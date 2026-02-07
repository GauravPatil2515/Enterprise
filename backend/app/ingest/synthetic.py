import random
from datetime import datetime, timedelta
from uuid import uuid4
from typing import List
from ..core.models import (
    BaseEvent, EventType, CodeCommitEvent, PullRequestEvent, 
    WorkItemEvent
)

class SyntheticDataGenerator:
    """
    Generates a realistic 'Virtual Company' history.
    Simulates 3 months of activity for a team.
    """
    def __init__(self):
        self.team_id = "TEAM-ALPHA"
        self.project_id = "PROJ-ALPHA"
        self.devs = ["Alice", "Bob", "Charlie", "Dave", "Eve"]
        self.features = ["FE-101", "FE-102", "FE-103", "FE-104", "FE-105"]
        self.repos = ["frontend-repo", "backend-repo"]

    def generate_timeline(self, days=90) -> List[BaseEvent]:
        events = []
        base_date = datetime.now() - timedelta(days=days)
        
        for day in range(days):
            current_date = base_date + timedelta(days=day)
            
            # Skip weekends
            if current_date.weekday() >= 5: continue
            
            # 1. Daily Standup: Random Tickets move
            for feature in self.features:
                if random.random() < 0.1: # 10% chance status change
                    events.append(WorkItemEvent(
                        timestamp=current_date,
                        event_type=EventType.ISSUE_STATUS_CHANGE,
                        source_system="jira",
                        team_id=self.team_id,
                        project_id=self.project_id,
                        ticket_id=feature,
                        ticket_type="FEATURE",
                        status="IN_PROGRESS" if random.random() > 0.5 else "TODO",
                    ))
            
            # 2. Coding Activity
            for dev in self.devs:
                if random.random() < 0.6: # 60% chance dev commits today
                    events.append(CodeCommitEvent(
                        timestamp=current_date + timedelta(hours=random.randint(9, 17)),
                        event_type=EventType.COMMIT,
                        source_system="github",
                        team_id=self.team_id,
                        project_id=self.project_id,
                        repo_id=random.choice(self.repos),
                        commit_hash=f"sha-{uuid4().hex[:6]}",
                        actor_id=dev,
                        additions=random.randint(10, 500),
                        deletions=random.randint(0, 50)
                    ))

            # 3. INJECT SCENARIO: The "Stalled Critical Path"
            # Feature FE-101 gets blocked on Day 85 and stays blocked
            if day == 85:
                events.append(WorkItemEvent(
                    timestamp=current_date,
                    event_type=EventType.ISSUE_STATUS_CHANGE,
                    source_system="jira",
                    team_id=self.team_id,
                    project_id=self.project_id,
                    ticket_id="FE-101",
                    ticket_type="FEATURE",
                    status="IN_PROGRESS",
                    blocked_by="BE-99 (Team B)"
                ))
            
            # Stop all activity on FE-101 after day 85
            # (Logic handled by *not* generating commits for FE-101 related work specifically)
            # For MVP simplicity, we rely on the Risk Agent detecting the Blocked Status + Time Decay.

        return events

synthetic_gen = SyntheticDataGenerator()
