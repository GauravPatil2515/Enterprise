from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Optional
import logging
from .agents.risk import DeliveryRiskAgent
from .core.models import AnalysisResult, RiskSnapshot
from .core.constants import ROLE_DEFINITIONS
from .api.routes import router as crud_router
from .core.neo4j_client import neo4j_client
from .core.llm import llm_client

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


# ── Chat Models ──

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    project_id: Optional[str] = None
    messages: List[ChatMessage]


def _build_project_context(project_id: str) -> str:
    """Build a rich context block from Neo4j for the given project."""
    try:
        records, _ = neo4j_client.execute_query("""
            MATCH (p:Project {id: $pid})
            OPTIONAL MATCH (t:Team)-[:HAS_PROJECT]->(p)
            OPTIONAL MATCH (p)-[:HAS_TICKET]->(tk:Ticket)
            OPTIONAL MATCH (tk)<-[:ASSIGNED_TO]-(m:Member)
            OPTIONAL MATCH (tk)<-[:BLOCKED_BY]-(blocker:Ticket)
            RETURN p { .* } as project,
                   t.name as team,
                   collect(DISTINCT tk {
                       .*, assignee: m.name,
                       blocker_id: blocker.id,
                       blocker_title: blocker.title,
                       blocker_status: blocker.status
                   }) as tickets
        """, {"pid": project_id})
        if not records:
            return f"No project found with id '{project_id}'."

        rec = records[0]
        proj = dict(rec["project"]) if rec["project"] else {}
        tickets = [dict(t) for t in rec["tickets"] if t.get("id")]
        team = rec["team"] or "Unknown"

        blocked = [t for t in tickets if t.get("blocker_id") and t.get("blocker_status") != "Done"]
        overdue = []
        from datetime import datetime
        now = datetime.now()
        for t in tickets:
            if t.get("status") != "Done" and t.get("dueDate"):
                try:
                    d = datetime.strptime(t["dueDate"], "%Y-%m-%d")
                    if d < now:
                        overdue.append(t)
                except ValueError:
                    pass
        active = [t for t in tickets if t.get("status") != "Done"]

        # Also get latest risk analysis if available
        risk_info = ""
        try:
            result = risk_agent.analyze(project_id)
            risk_info = f"""
Current Risk Analysis:
  Risk Score: {result.risk_score:.2f} ({result.risk_level})
  Primary Reason: {result.primary_reason}
  Recommended Actions: {', '.join(result.recommended_actions[:3])}
  Decision Options:
{chr(10).join([f'    - {d.action}: risk_reduction={d.risk_reduction:.0%}, cost={d.cost}, feasible={d.feasible}, recommended={d.recommended}' for d in result.decision_comparison])}"""
        except Exception:
            risk_info = "  (Risk analysis unavailable)"

        ctx = f"""=== PROJECT CONTEXT (live from Neo4j) ===
Project: {proj.get('name', project_id)} (id: {project_id})
Team: {team}
Status: {proj.get('status', 'Unknown')}
Deadline: {proj.get('deadline', 'Not set')}

Tickets ({len(active)} active / {len(tickets)} total):
{chr(10).join([f"  - [{t.get('status')}] {t.get('id')}: {t.get('title')} (priority: {t.get('priority')}, assignee: {t.get('assignee', 'unassigned')}, due: {t.get('dueDate', 'none')})" for t in active[:12]])}

Blocked ({len(blocked)}):
{chr(10).join([f"  - {t.get('id')} blocked by {t.get('blocker_id')} \"{t.get('blocker_title')}\"" for t in blocked]) if blocked else "  None"}

Overdue ({len(overdue)}):
{chr(10).join([f"  - {t.get('id')}: {t.get('title')} (due: {t.get('dueDate')})" for t in overdue]) if overdue else "  None"}

{risk_info}
=== END CONTEXT ==="""
        return ctx
    except Exception as e:
        return f"Error loading project context: {str(e)}"


@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    """
    Conversational AI chat — answers questions about projects using real Neo4j data.
    Supports multi-turn conversation via message history.
    """
    try:
        # Build context from project data
        context = ""
        if req.project_id:
            context = _build_project_context(req.project_id)

        # Prepare messages: inject context into first user message
        messages = [{"role": m.role, "content": m.content} for m in req.messages]
        if context and messages:
            messages[0]["content"] = f"{context}\n\nUser question: {messages[0]['content']}"

        response = llm_client.chat(messages)
        return {"role": "assistant", "content": response}

    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/chat/stream")
async def chat_stream_endpoint(req: ChatRequest):
    """
    Streaming conversational AI — returns SSE tokens as they are generated.
    """
    try:
        context = ""
        if req.project_id:
            context = _build_project_context(req.project_id)

        messages = [{"role": m.role, "content": m.content} for m in req.messages]
        if context and messages:
            messages[0]["content"] = f"{context}\n\nUser question: {messages[0]['content']}"

        def generate():
            try:
                for token in llm_client.chat_stream(messages):
                    yield f"data: {token}\n\n"
                yield "data: [DONE]\n\n"
            except Exception as e:
                yield f"data: [ERROR] {str(e)}\n\n"

        return StreamingResponse(generate(), media_type="text/event-stream")

    except Exception as e:
        logger.error(f"Chat stream error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


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
                RETURN t.name as team, t.id as team_id, p { .* } as project,
                       count(DISTINCT tk) as active_tickets,
                       count(DISTINCT blocker) as blocked_count
                ORDER BY count(DISTINCT blocker) DESC
            """)
            projects = []
            for r in records:
                proj = dict(r["project"]) if r["project"] else {}
                proj["team"] = r["team"]
                proj["team_id"] = r["team_id"]
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


# ============================================================================
# Risk History / Trend Tracking
# ============================================================================

@app.post("/api/risk-snapshot/{project_id}")
async def save_risk_snapshot(project_id: str):
    """
    Run risk analysis and persist a snapshot node in Neo4j.
    Returns the snapshot.
    """
    try:
        result = risk_agent.analyze(project_id)

        # Count blocked & overdue from supporting_signals
        blocked = sum(1 for s in result.supporting_signals if "blocked" in s.lower())
        overdue = sum(1 for s in result.supporting_signals if "overdue" in s.lower())
        total = len(result.supporting_signals)

        snapshot = RiskSnapshot(
            project_id=project_id,
            project_name=result.project_name,
            risk_score=result.risk_score,
            risk_level=result.risk_level,
            blocked_count=blocked,
            overdue_count=overdue,
            total_tickets=total,
        )

        # Persist to Neo4j
        neo4j_client.execute_query(
            """
            MATCH (p:Project {id: $pid})
            CREATE (s:RiskSnapshot {
                project_id: $pid,
                project_name: $pname,
                risk_score: $score,
                risk_level: $level,
                blocked_count: $blocked,
                overdue_count: $overdue,
                total_tickets: $total,
                timestamp: $ts
            })
            CREATE (p)-[:HAS_SNAPSHOT]->(s)
            """,
            {
                "pid": snapshot.project_id,
                "pname": snapshot.project_name,
                "score": snapshot.risk_score,
                "level": snapshot.risk_level,
                "blocked": snapshot.blocked_count,
                "overdue": snapshot.overdue_count,
                "total": snapshot.total_tickets,
                "ts": snapshot.timestamp,
            },
        )

        return snapshot.model_dump()
    except Exception as e:
        logger.error(f"Snapshot save error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/risk-history/{project_id}")
async def get_risk_history(project_id: str, limit: int = 30):
    """
    Retrieve risk snapshots for a project, ordered by timestamp desc.
    """
    try:
        records, _ = neo4j_client.execute_query(
            """
            MATCH (p:Project {id: $pid})-[:HAS_SNAPSHOT]->(s:RiskSnapshot)
            RETURN s { .* } as snapshot
            ORDER BY s.timestamp DESC
            LIMIT $lim
            """,
            {"pid": project_id, "lim": limit},
        )
        snapshots = [dict(r["snapshot"]) for r in records]
        snapshots.reverse()  # chronological order for charting
        return snapshots
    except Exception as e:
        logger.error(f"Risk history error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Postmortem Generator
# ============================================================================

@app.get("/api/postmortem/{project_id}")
async def generate_postmortem(project_id: str):
    """
    Generate a structured postmortem report for a project using
    risk analysis data + LLM reasoning.
    """
    try:
        # Get full analysis
        result = risk_agent.analyze(project_id)

        # Build evidence summary
        signals = "\n".join([f"- {s}" for s in result.supporting_signals]) or "- No issues detected"
        actions = "\n".join([f"- {a}" for a in result.recommended_actions]) or "- None"
        decisions = "\n".join([
            f"- {d.action}: risk_reduction={d.risk_reduction:.0%}, "
            f"cost={d.cost}, feasible={d.feasible}, recommended={d.recommended}"
            for d in result.decision_comparison
        ])

        prompt = f"""
Generate a structured POSTMORTEM report for this project.
Use ONLY the evidence provided below — do NOT invent facts.

Project: {result.project_name} (ID: {result.project_id})
Risk Score: {result.risk_score:.2f} ({result.risk_level})
AI Summary: {result.primary_reason}

Evidence Signals:
{signals}

Recommended Actions:
{actions}

Decision Comparison (Monte Carlo results):
{decisions}

Format the postmortem with these sections:
1. **Executive Summary** (2 sentences)
2. **What Went Wrong** (bullet points from evidence)
3. **Root Cause Analysis** (why these issues happened)
4. **Impact Assessment** (what's at stake if unresolved)
5. **Action Items** (ranked by priority, from the recommended actions)
6. **Lessons Learned** (what to do differently next time)

Be direct, data-driven, and actionable.
"""
        postmortem_text = llm_client.chat(
            [{"role": "user", "content": prompt}],
            temperature=0.3,
        )

        return {
            "project_id": result.project_id,
            "project_name": result.project_name,
            "risk_score": result.risk_score,
            "risk_level": result.risk_level,
            "postmortem": postmortem_text,
            "generated_from": {
                "signals_count": len(result.supporting_signals),
                "actions_count": len(result.recommended_actions),
                "agents_consulted": [op.agent for op in result.agent_opinions],
            },
        }
    except Exception as e:
        logger.error(f"Postmortem generation error: {e}")
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
            "ai": ["/api/analyze/{project_id}", "/api/chat", "/api/chat/stream", "/api/risk-snapshot/{project_id}", "/api/risk-history/{project_id}", "/api/postmortem/{project_id}"],
            "roles": ["/api/roles", "/api/system-users", "/api/dashboard/{role}"],
        }
    }
