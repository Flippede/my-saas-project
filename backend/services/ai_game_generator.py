import os
from typing import Any

from services.ai_game_providers import (
    ALLOWED_REGENERATE_SECTIONS,
    MockGameWorldProvider,
    OpenAICompatibleGameWorldProvider,
    ProviderConfigError,
    QwenGameWorldProvider,
)
from services.ai_game_providers.base import clean_text, normalize_game_world_result, normalize_section_value


def _read_env(name: str, default: str = "") -> str:
    return os.getenv(name, default).strip()


def _read_timeout_seconds() -> int:
    raw_value = _read_env("AI_GAME_TIMEOUT_SECONDS", "60")
    try:
        return max(5, int(raw_value))
    except ValueError:
        return 60


def get_ai_game_provider_config() -> dict:
    provider = _read_env("AI_GAME_PROVIDER", "mock").lower() or "mock"
    api_key = _read_env("AI_GAME_API_KEY")
    base_url = _read_env("AI_GAME_BASE_URL")
    model_name = _read_env("AI_GAME_MODEL")
    timeout_seconds = _read_timeout_seconds()

    if provider in {"openai", "deepseek", "siliconflow"}:
        provider = "openai_compatible"

    if provider != "mock" and not api_key:
        provider = "mock"

    if provider == "mock" and not model_name:
        model_name = "mock-game-world-v2"
    if provider == "qwen" and not model_name:
        model_name = "qwen-plus"

    return {
        "provider": provider,
        "model_name": model_name,
        "api_key": api_key,
        "base_url": base_url,
        "timeout_seconds": timeout_seconds,
    }


def _build_provider():
    config = get_ai_game_provider_config()
    provider = config["provider"]
    try:
        if provider == "openai_compatible":
            return OpenAICompatibleGameWorldProvider(**config)
        if provider == "qwen":
            return QwenGameWorldProvider(**config)
    except ProviderConfigError:
        return MockGameWorldProvider(model_name="mock-game-world-v2", timeout_seconds=config["timeout_seconds"])

    return MockGameWorldProvider(model_name=config["model_name"], timeout_seconds=config["timeout_seconds"])


def generate_game_world(input_payload: dict) -> dict:
    provider = _build_provider()
    result = provider.generate_game_world(input_payload)
    return normalize_game_world_result(result, input_payload)


def regenerate_game_world_section(
    input_payload: dict,
    current_output: dict,
    section: str,
    instruction: str = "",
) -> dict:
    normalized_section = clean_text(section)
    if normalized_section not in ALLOWED_REGENERATE_SECTIONS:
        allowed = ", ".join(sorted(ALLOWED_REGENERATE_SECTIONS))
        raise ValueError(f"Unsupported section: {normalized_section}. Allowed sections: {allowed}")

    current = normalize_game_world_result(current_output, input_payload)
    provider = _build_provider()
    provider_section = "development_next_steps" if normalized_section == "next_steps" else normalized_section
    section_value: Any = provider.regenerate_section(current, provider_section, instruction, input_payload)
    normalized_value = normalize_section_value(provider_section, section_value, input_payload)

    updated = dict(current)
    updated[provider_section] = normalized_value
    if provider_section == "development_next_steps":
        updated["next_steps"] = normalized_value
    return normalize_game_world_result(updated, input_payload)
