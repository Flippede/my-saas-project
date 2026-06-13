from .base import clean_text
from .openai_compatible import OpenAICompatibleGameWorldProvider


class QwenGameWorldProvider(OpenAICompatibleGameWorldProvider):
    provider_name = "qwen"

    def __init__(self, api_key: str, base_url: str, model_name: str, timeout_seconds: int = 60, **kwargs) -> None:
        super().__init__(
            api_key=api_key,
            base_url=clean_text(base_url, "https://dashscope.aliyuncs.com/compatible-mode/v1"),
            model_name=clean_text(model_name, "qwen-plus"),
            timeout_seconds=timeout_seconds,
            **kwargs,
        )
