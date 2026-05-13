from neo4j import GraphDatabase
from .config import settings
import logging

logger = logging.getLogger(__name__)


class Neo4jClient:
    """
    Enterprise Knowledge Graph (E-KG) Client.
    Connects to Neo4j Aura for persistent graph storage.
    Gracefully degrades if Neo4j is unavailable — app still boots.
    """

    def __init__(self):
        self.driver = None
        self._connected = False
        self._error: str | None = None

        uri = (settings.NEO4J_URI or "").replace("neo4j+s://", "bolt+ssc://")
        if not uri:
            self._error = "NEO4J_URI not set — graph features disabled"
            logger.warning("⚠️  %s", self._error)
            return

        try:
            self.driver = GraphDatabase.driver(
                uri,
                auth=(settings.NEO4J_USERNAME, settings.NEO4J_PASSWORD),
            )
            self.driver.verify_connectivity()
            self._connected = True
            logger.info("✅ Neo4j connected successfully")
        except Exception as e:
            self._error = f"Neo4j connection failed: {e}"
            logger.warning("⚠️  %s", self._error)
            self.driver = None

    @property
    def is_connected(self) -> bool:
        return self._connected

    def verify_connection(self) -> bool:
        if not self.driver:
            return False
        try:
            self.driver.verify_connectivity()
            return True
        except Exception as e:
            logger.warning("Neo4j connectivity check failed: %s", e)
            return False

    def execute_query(self, query: str, parameters: dict = None):
        """Execute a Cypher query. Returns ([], None) gracefully if not connected."""
        if not self._connected or not self.driver:
            logger.debug("Neo4j not connected — returning empty result")
            return [], None
        try:
            records, summary, _ = self.driver.execute_query(
                query,
                parameters or {},
                database_=self.database,
            )
            return records, summary
        except Exception as e:
            logger.error("Neo4j query failed: %s", e)
            return [], None

    @property
    def database(self) -> str:
        return settings.NEO4J_DATABASE

    def close(self):
        if self.driver:
            self.driver.close()


# Singleton — never crashes on import, always safe to call
neo4j_client = Neo4jClient()
