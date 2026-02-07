from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging
from .agents.risk import DeliveryRiskAgent
from .core.models import AnalysisResult
from .core.constants import ROLE_DEFINITIONS
from .api.routes import router as crud_router
from .core.neo4j_client import neo4j_client

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI-Driven Delivery Intelligence",
    description="Decision Intelligence Platform for Engineering Operations",
    version="2.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include CRUD routes
app.include_router(crud_router)

# Initialize risk agent (reads Neo4j directly)
risk_agent = DeliveryRiskAgent()


@app.get("/api/analyze/{project_id}", response_model=AnalysisResult)
async def analyze_project(project_id: str):
    """
    Analyze project delivery risk.
    Graph → Agents → LLM → Human pipeline. No fake data.
    """
    try:
        result = risk_agent.analyze(project_id)
        return result
    except Exception as e:
        logger.error(f"Analysis failed for {project_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")


# ── Role-Based Endpoints ──

@app.get("/api/roles")
async def list_roles():
    """Return all available roles and their dashboard config."""
    return ROLE_DEFINITIONS


@app.get("/api/roles/{role}")
async def get_role_dashboard(role: str):
    """Return dashboard configuration for a specific role."""
    if role not in ROLE_DEFINITIONS:
        raise HTTPException(status_code=404, detail=f"Role '{role}' not found")
    return ROLE_DEFINITIONS[role]


@app.get("/api/system-users")
async def list_system_users():
    """Return all system users (for role selector)."""
    try:
        records, _ = neo4j_client.execute_query(
            "MATCH (su:SystemUser) RETURN su { .* } as user ORDER BY su.role"
        )
        return [dict(r["user"]) for r in records]
    except Exception as e:
        logger.error(f"Failed to fetch system users: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/system-users/{user_id}")
async def get_system_user(user_id: str):
    """Get a specific system user."""
    try:
        records, _ = neo4j_client.execute_query(
            "MATCH (su:SystemUser {id: $id}) RETURN su { .* } as user",
            {"id": user_id},
        )
        if not records:
            raise HTTPException(status_code=404, detail="User not found")
        return dict(records[0]["user"])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/dashboard/{role}")
async def get_dashboard_data(role: str):
    """
    Role-filtered dashboard data.
    engineer  → own team's tickets + project progress
    hr        → all members + workload per person
    chairperson → all projects + risk summary
    finance   → cost overview of interventions
    """
    if role not in ROLE_DEFINITIONS:
        raise HTTPException(status_code=404, detail=f"Role '{role}' not found")

    try:
        data: dict = {"role": role, "config": ROLE_DEFINITIONS[role]}

        if role == "engineer":
            # Team tickets & project progress
            records, _ = neo4j_client.execute_query("""
                MATCH (t:Team)-[:HAS_PROJECT]->(p:Project)
                OPTIONAL MATCH (p)-[:HAS_TICKET]->(tk:Ticket)
                OPTIONAL MATCH (tk)<-[:ASSIGNED_TO]-(m:Member)
                RETURN t.name as team, p { .* } as project,
                       collect(DISTINCT tk { .*, assignee: m.name }) as tickets
                ORDER BY t.name, p.name
            """)
            projects = []
            for r in records:
                proj = dict(r["project"]) if r["project"] else {}
                proj["team"] = r["team"]
                proj["tickets"] = [dict(tk) for tk in r["tickets"] if tk.get("id")]
                projects.append(proj)
            data["projects"] = projects

        elif role == "hr":
            # All members + ticket counts (workload)
            records, _ = neo4j_client.execute_query("""
                MATCH (m:Member)
                OPTIONAL MATCH (m)-[:ASSIGNED_TO]->(tk:Ticket)
                WHERE tk.status <> 'Done'
                OPTIONAL MATCH (m)-[:MEMBER_OF]->(t:Team)
                RETURN m { .* } as member, t.name as team,
                       count(tk) as active_tickets
                ORDER BY count(tk) DESC
            """)
            members = []
            for r in records:
                mem = dict(r["member"])
                mem["team"] = r["team"] or "Unassigned"
                mem["active_tickets"] = r["active_tickets"]
                members.append(mem)
            data["members"] = members

        elif role == "chairperson":
            # All projects with risk overview
            records, _ = neo4j_client.execute_query("""
                MATCH (t:Team)-[:HAS_PROJECT]->(p:Project)
                OPTIONAL MATCH (p)-[:HAS_TICKET]->(tk:Ticket)
                WHERE tk.status <> 'Done'
                OPTIONAL MATCH (tk)<-[:BLOCKED_BY]-(blocker:Ticket)
                WHERE blocker.status <> 'Done'
                RETURN t.name as team, p { .* } as project,
                       count(DISTINCT tk) as active_tickets,
                       count(DISTINCT blocker) as blocked_count
                ORDER BY count(DISTINCT blocker) DESC
            """)
            projects = []
            for r in records:
                proj = dict(r["project"]) if r["project"] else {}
                proj["team"] = r["team"]
                proj["active_tickets"] = r["active_tickets"]
                proj["blocked_count"] = r["blocked_count"]
                projects.append(proj)
            data["projects"] = projects

        elif role == "finance":
            # Intervention cost summary + resource counts
            from .core.constants import INTERVENTION_IMPACTS
            records, _ = neo4j_client.execute_query("""
                MATCH (t:Team)
                OPTIONAL MATCH (t)<-[:MEMBER_OF]-(m:Member)
                OPTIONAL MATCH (t)-[:HAS_PROJECT]->(p:Project)
                RETURN t { .* } as team,
                       count(DISTINCT m) as member_count,
                       count(DISTINCT p) as project_count
            """)
            teams = []
            for r in records:
                team = dict(r["team"])
                team["member_count"] = r["member_count"]
                team["project_count"] = r["project_count"]
                teams.append(team)
            data["teams"] = teams
            data["intervention_costs"] = INTERVENTION_IMPACTS

        return data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Dashboard error for role {role}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/graph")
async def get_graph_data():
    """
    Return every node and relationship in Neo4j for the graph visualisation page.
    Returns { nodes: [...], edges: [...] }
    """
    try:
        # ── Nodes ──
        node_records, _ = neo4j_client.execute_query("""
            MATCH (n)
            WHERE n:Team OR n:Project OR n:Ticket OR n:Member OR n:SystemUser
            RETURN id(n) AS neo_id,
                   labels(n)[0] AS label,
                   n { .* } AS props
        """)
        nodes = []
        for r in node_records:
            props = dict(r["props"]) if r["props"] else {}
            nodes.append({
                "neo_id": r["neo_id"],
                "id": props.get("id", str(r["neo_id"])),
                "label": r["label"],
                "name": props.get("name") or props.get("title") or props.get("id", ""),
                "props": props,
            })

        # ── Edges ──
        edge_records, _ = neo4j_client.execute_query("""
            MATCH (a)-[r]->(b)
            WHERE (a:Team OR a:Project OR a:Ticket OR a:Member OR a:SystemUser)
              AND (b:Team OR b:Project OR b:Ticket OR b:Member OR b:SystemUser)
            RETURN id(a) AS source_neo, id(b) AS target_neo, type(r) AS rel_type
        """)
        # build neo_id -> id map
        neo_map = {n["neo_id"]: n["id"] for n in nodes}
        edges = []
        for r in edge_records:
            src = neo_map.get(r["source_neo"])
            tgt = neo_map.get(r["target_neo"])
            if src and tgt:
                edges.append({"source": src, "target": tgt, "type": r["rel_type"]})

        return {"nodes": nodes, "edges": edges}
    except Exception as e:
        logger.error(f"Graph data error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/")
def health_check():
    connected = False
    try:
        connected = neo4j_client.verify_connection()
    except Exception:
        pass

    return {
        "status": "ok",
        "system": "Decision Intelligence Platform",
        "tagline": "Graph → Agents → LLM → Human",
        "agents": ["RiskAgent", "ConstraintAgent", "SimulationAgent"],
        "roles": list(ROLE_DEFINITIONS.keys()),
        "neo4j_status": "connected" if connected else "unavailable",
        "endpoints": {
            "crud": ["/api/teams", "/api/projects/{id}", "/api/tickets/{id}"],
            "ai": ["/api/analyze/{project_id}"],
            "roles": ["/api/roles", "/api/system-users", "/api/dashboard/{role}"],
        }
    }
