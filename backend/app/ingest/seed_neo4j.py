from datetime import datetime
from ..core.neo4j_client import neo4j_client
from ..core.schema import JiraTicket, GithubCommit, GithubPR, User
from .synthetic import synthetic_gen, EventType

class Neo4jSeeder:
    """
    Seeds Neo4j Aura with synthetic data.
    """
    def __init__(self):
        self.client = neo4j_client

    def clear_db(self):
        """Wipe the DB for a fresh start."""
        print("Clearing Neo4j Database...")
        self.client.execute_query("MATCH (n) DETACH DELETE n")

    def seed_users(self):
        """Create User Nodes."""
        print("Seeding Users...")
        developers = [
            User(user_id="Alice", name="Alice Engineer", role="Senior", department="Backend", salary_band=3, location="US"),
            User(user_id="Bob", name="Bob Builder", role="Junior", department="Frontend", salary_band=1, location="IN"),
            User(user_id="Charlie", name="Charlie Lead", role="Staff", department="Platform", salary_band=4, location="US"),
            User(user_id="Dave", name="Dave Dev", role="Senior", department="Backend", salary_band=3, location="US"),
            User(user_id="Eve", name="Eve External", role="Manager", department="External", salary_band=5, location="US"),
        ]
        
        for dev in developers:
            query = """
            MERGE (u:User {user_id: $user_id})
            SET u.name = $name, u.role = $role, u.department = $department, u.location = $location
            """
            self.client.execute_query(query, dev.model_dump())

    def seed_events(self, events):
        """Process stream and create Graph Nodes/Edges."""
        print(f"Seeding {len(events)} events...")
        
        for event in events:
            # 1. JIRA TICKETS
            if event.event_type == EventType.ISSUE_STATUS_CHANGE:
                # Create/Update Ticket Node
                # Note: We use a simplified query to avoid syntax errors with ON CREATE
                query = """
                MERGE (t:Ticket {ticket_id: $ticket_id})
                SET t.status = $status, t.project_id = $project_id, t.type = $ticket_type
                
                WITH t
                WHERE t.created_date IS NULL
                SET t.created_date = date($date_str)
                
                WITH t
                WHERE $status = 'DONE' OR $status = 'CLOSED'
                SET t.closed_date = date($date_str)
                """
                self.client.execute_query(query, {
                    "ticket_id": event.ticket_id,
                    "status": event.status,
                    "project_id": event.project_id,
                    "ticket_type": event.ticket_type,
                    "date_str": event.timestamp.strftime("%Y-%m-%d")
                })

                # Link to Project
                self.client.execute_query("""
                MATCH (t:Ticket {ticket_id: $ticket_id})
                MERGE (p:Project {project_id: $project_id})
                MERGE (t)-[:BELONGS_TO]->(p)
                """, {"ticket_id": event.ticket_id, "project_id": event.project_id})

                # Handle Blockers (The Graph Magic)
                if hasattr(event, 'blocked_by') and event.blocked_by:
                    blocker_id = event.blocked_by.split('(')[0].strip()
                    self.client.execute_query("""
                    MATCH (t:Ticket {ticket_id: $ticket_id})
                    MERGE (b:Ticket {ticket_id: $blocker_id})
                    MERGE (b)-[:BLOCKS]->(t)
                    """, {"ticket_id": event.ticket_id, "blocker_id": blocker_id})

            # 2. GITHUB COMMITS
            elif event.event_type == EventType.COMMIT:
                # Create Commit Node
                query = """
                CREATE (c:Commit {commit_hash: $commit_hash})
                SET c.timestamp = $timestamp, c.additions = $additions, c.deletions = $deletions, c.repo_id = $repo_id
                """
                self.client.execute_query(query, {
                    "commit_hash": event.commit_hash,
                    "timestamp": event.timestamp.isoformat(),
                    "additions": event.additions,
                    "deletions": event.deletions,
                    "repo_id": event.repo_id
                })

                # Link Author (User) -> Commit
                self.client.execute_query("""
                MATCH (c:Commit {commit_hash: $commit_hash})
                MATCH (u:User {user_id: $actor_id})
                MERGE (u)-[:AUTHORED]->(c)
                """, {"commit_hash": event.commit_hash, "actor_id": event.actor_id})

    def run(self):
        # 1. Connect
        if not self.client.verify_connection():
            print("Failed to connect to Neo4j.")
            return

        # 2. Reset
        self.clear_db()

        # 3. Seed Static Data
        self.seed_users()

        # 4. Generate & Seed Dynamic History
        events = synthetic_gen.generate_timeline(days=90)
        self.seed_events(events)
        
        print("Neo4j Seeding Complete!")
        self.client.close()

if __name__ == "__main__":
    seeder = Neo4jSeeder()
    seeder.run()
