from openai import OpenAI
from .config import settings

class FeatherlessClient:
    def __init__(self):
        self.client = OpenAI(
            base_url=settings.FEATHERLESS_BASE_URL,
            api_key=settings.FEATHERLESS_API_KEY
        )
        self.model = settings.MODEL_ID

    def generate_reasoning(self, context: str) -> str:
        """
        Generates explainable reasoning based on the provided context.
        """
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert Engineering Delivery Analyst. Your job is to analyze risk signals and provide a concise, distinct explanation of WHY a project is at risk, and recommend 1 specific action. Be direct, professional, and data-driven."},
                    {"role": "user", "content": context}
                ],
                temperature=0.3, # Low temperature for more deterministic/analytical output
                max_tokens=250
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Error generating reasoning: {str(e)}"

llm_client = FeatherlessClient()
