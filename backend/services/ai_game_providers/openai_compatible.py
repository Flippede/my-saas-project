import json
from urllib import error as urlerror
from urllib import request as urlrequest

from .base import (
    BaseGameWorldProvider,
    ProviderConfigError,
    ProviderResponseError,
    SYSTEM_PROMPT,
    build_generation_user_prompt,
    build_regenerate_user_prompt,
    clean_text,
    normalize_game_world_result,
    normalize_section_value,
    parse_json_object,
)


class OpenAICompatibleGameWorldProvider(BaseGameWorldProvider):
    provider_name = "openai_compatible"

    def __init__(
        self,
        api_key: str,
        base_url: str,
        model_name: str,
        timeout_seconds: int = 60,
        **kwargs,
    ) -> None:
        super().__init__(model_name=model_name, timeout_seconds=timeout_seconds, **kwargs)
        self.api_key = clean_text(api_key)
        self.base_url = clean_text(base_url)
        if not self.api_key:
            raise ProviderConfigError("AI_GAME_API_KEY is required for openai_compatible provider.")
        if not self.base_url:
            raise ProviderConfigError("AI_GAME_BASE_URL is required for openai_compatible provider.")
        if not self.model_name:
            raise ProviderConfigError("AI_GAME_MODEL is required for openai_compatible provider.")

    def generate_game_world(self, input_payload: dict) -> dict:
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": build_generation_user_prompt(input_payload)},
        ]
        parsed = parse_json_object(self._chat(messages))
        return normalize_game_world_result(parsed, input_payload)

    def regenerate_section(self, current_output: dict, section: str, instruction: str, input_payload: dict | None = None):
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": build_regenerate_user_prompt(current_output, section, instruction),
            },
        ]
        parsed = parse_json_object(self._chat(messages))
        if section not in parsed:
            raise ProviderResponseError(f"AI 返回 JSON 中缺少 section: {section}")
        return normalize_section_value(section, parsed.get(section), input_payload)

    def _chat(self, messages: list[dict]) -> str:
        endpoint = self._chat_completions_endpoint()
        payload = {
            "model": self.model_name,
            "messages": messages,
            "temperature": 0.72,
            "response_format": {"type": "json_object"},
        }
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        req = urlrequest.Request(
            endpoint,
            data=body,
            method="POST",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
        )

        try:
            with urlrequest.urlopen(req, timeout=self.timeout_seconds) as response:
                raw = response.read().decode("utf-8")
        except urlerror.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="ignore")
            raise ProviderResponseError(f"AI Provider HTTP {exc.code}: {detail[:500]}") from exc
        except Exception as exc:
            raise ProviderResponseError(f"AI Provider 请求失败: {type(exc).__name__}") from exc

        try:
            data = json.loads(raw)
            content = data["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError, json.JSONDecodeError) as exc:
            raise ProviderResponseError("AI Provider 响应结构不符合 chat completions 格式。") from exc

        return clean_text(content)

    def _chat_completions_endpoint(self) -> str:
        base_url = self.base_url.rstrip("/")
        if base_url.endswith("/chat/completions"):
            return base_url
        return f"{base_url}/chat/completions"
