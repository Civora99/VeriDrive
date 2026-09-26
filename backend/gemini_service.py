import json
import re
import logging
from typing import Optional, Dict, Any
from google import genai
from google.genai import errors
from config import settings

logger = logging.getLogger("paccar.gemini_service")

class GeminiService:
    def __init__(self):
        self._client: Optional[genai.Client] = None
        self._initialized = False
        self._init_client()

    def _init_client(self):
        if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "your_key_here":
            try:
                self._client = genai.Client(api_key=settings.GEMINI_API_KEY)
                self._initialized = True
            except Exception as e:
                logger.warning("Failed to initialize Google GenAI Client: %s", str(e))
                self._client = None
                self._initialized = False

    def is_available(self) -> bool:
        if settings.DEMO_MODE:
            return False
        return self._initialized and self._client is not None

    def clean_json_text(self, text: str) -> str:
        """Strip markdown code fences and isolate the JSON block."""
        s = text.strip()
        # Remove ```json ... ``` or ``` ... ```
        if s.startswith("```json"):
            s = s[7:]
        elif s.startswith("```"):
            s = s[3:]
        if s.endswith("```"):
            s = s[:-3]
        s = s.strip()

        # If not cleanly starting with { or [, locate boundaries
        if not (s.startswith("{") or s.startswith("[")):
            match = re.search(r"(\{.*\}|\[.*\])", s, re.DOTALL)
            if match:
                s = match.group(1).strip()
        return s

    def generate_structured_response(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        model_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Sends prompt to Gemini and returns parsed JSON.
        Raises RuntimeError or ValueError if Gemini fails or is unavailable.
        """
        if not self.is_available():
            raise RuntimeError("Gemini service is unavailable or in DEMO_MODE.")

        model = model_name or settings.GEMINI_MODEL or "gemini-3.8-flash"
        
        try:
            from google.genai import types
            config = types.GenerateContentConfig(
                response_mime_type="application/json",
                automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
                system_instruction=system_instruction if system_instruction else None
            )

            response = self._client.models.generate_content(
                model=model,
                contents=prompt,
                config=config
            )
            raw_text = response.text or ""
            cleaned = self.clean_json_text(raw_text)
            
            try:
                data = json.loads(cleaned)
                return data
            except json.JSONDecodeError as jde:
                logger.warning("First JSON parse attempt failed: %s. Attempting extraction repair.", jde)
                # Retry regex extraction on raw text
                match = re.search(r"(\{.*\}|\[.*\])", raw_text, re.DOTALL)
                if match:
                    return json.loads(match.group(1))
                raise ValueError(f"Malformed JSON returned by Gemini: {raw_text[:200]}...")

        except errors.APIError as ae:
            logger.error("Gemini API Error (%s): %s", ae.code, ae.message)
            raise RuntimeError(f"Gemini API Error ({ae.code}): {ae.message}")
        except Exception as e:
            logger.error("Gemini request failure: %s", str(e))
            raise RuntimeError(f"Gemini generation failure: {str(e)}")

gemini_service = GeminiService()
