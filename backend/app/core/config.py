from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Featherless AI
    FEATHERLESS_API_KEY: str = "rc_fe628153d9c56b700e32cb57fa79182f77de4c7e9ff6aa0c18fb27d13f5be0dd"
    FEATHERLESS_BASE_URL: str = "https://api.featherless.ai/v1"
    MODEL_ID: str = "Qwen/Qwen2.5-32B-Instruct"
    
    # Neo4j Aura
    NEO4J_URI: str = "neo4j+s://41ac015d.databases.neo4j.io"
    NEO4J_USERNAME: str = "neo4j"
    NEO4J_PASSWORD: str = "ftY3pDjAKmfZnNmamHryWY04ODjCBDCIrgK_1NVen4Y"
    NEO4J_DATABASE: str = "neo4j"

    class Config:
        env_file = ".env"

settings = Settings()
