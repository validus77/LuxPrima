from abc import ABC, abstractmethod
from typing import Optional
import openai
import google.generativeai as genai
import google.generativeai as genai
from app.core.config import settings

class LLMProvider(ABC):
    @property
    @abstractmethod
    def name(self) -> str:
        """Returns the name of the model/provider."""
        pass

    @abstractmethod
    async def generate(self, prompt: str) -> str:
        """Generates text based on the prompt."""
        pass

class OpenAIProvider(LLMProvider):
    def __init__(self, api_key: str, model: str = "gpt-3.5-turbo"):
        self.client = openai.AsyncOpenAI(api_key=api_key)
        self._model = model

    @property
    def name(self) -> str:
        return f"OpenAI {self._model}"

    async def generate(self, prompt: str) -> str:
        response = await self.client.chat.completions.create(
            model=self._model,
            messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content or ""

class GeminiProvider(LLMProvider):
    def __init__(self, api_key: str, model: str = "gemini-pro"):
        genai.configure(api_key=api_key)
        self._model_name = model
        self.model = genai.GenerativeModel(model)

    @property
    def name(self) -> str:
        return f"Google {self._model_name}"

    async def generate(self, prompt: str) -> str:
        response = await self.model.generate_content_async(prompt)
        return response.text

class LocalProvider(LLMProvider):
    def __init__(self, base_url: str, model: str = "local-model"):
        self.base_url = base_url
        self._model = model

    @property
    def name(self) -> str:
        return f"Local {self._model}"

    async def generate(self, prompt: str) -> str:
        import aiohttp
        # Disable timeout for local LLM (user request)
        timeout = aiohttp.ClientTimeout(total=None)
        
        payload = {
            "model": self._model,
            "messages": [{"role": "user", "content": prompt}]
        }
        
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.post(f"{self.base_url}/chat/completions", json=payload) as response:
                response.raise_for_status()
                data = await response.json()
                return data["choices"][0]["message"]["content"]

def get_llm_service(provider: str, api_key: Optional[str] = None, model: Optional[str] = None, base_url: Optional[str] = None) -> LLMProvider:
    if provider == "openai":
        return OpenAIProvider(api_key=api_key or settings.OPENAI_API_KEY, model=model or "gpt-3.5-turbo")
    elif provider == "gemini":
        return GeminiProvider(api_key=api_key or settings.GEMINI_API_KEY, model=model or "gemini-pro")
    elif provider == "local":
        return LocalProvider(base_url=base_url or settings.LOCAL_LLM_URL, model=model or "local")
    else:
        raise ValueError(f"Unsupported LLM provider: {provider}")
