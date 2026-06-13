import copy
import json
from typing import Any


ALLOWED_REGENERATE_SECTIONS = {
    "worldview",
    "core_gameplay",
    "protagonist",
    "bosses",
    "scenes",
    "ui_screens",
    "video_storyboard",
    "asset_prompts",
    "pitch_deck_outline",
    "development_next_steps",
    "next_steps",
}

REQUIRED_OUTPUT_KEYS = {
    "title",
    "one_sentence_pitch",
    "genre",
    "target_player",
    "worldview",
    "core_gameplay",
    "player_fantasy",
    "protagonist",
    "bosses",
    "scenes",
    "ui_screens",
    "video_storyboard",
    "asset_prompts",
    "pitch_deck_outline",
    "monetization_angle",
    "development_next_steps",
}

ASSET_PROMPT_KEYS = [
    "character_concept_art",
    "environment_concept_art",
    "ui_mockups",
    "sprite_sheet",
    "video_storyboard",
]

GAME_WORLD_JSON_SCHEMA = {
    "title": "",
    "one_sentence_pitch": "",
    "genre": "",
    "target_player": "",
    "worldview": {
        "summary": "",
        "setting": "",
        "conflict": "",
        "factions": [],
        "tone_keywords": [],
    },
    "core_gameplay": {
        "summary": "",
        "loop": "",
        "combat": "",
        "progression": "",
        "unique_hook": "",
    },
    "player_fantasy": "",
    "protagonist": {
        "name": "",
        "identity": "",
        "appearance": "",
        "personality": "",
        "abilities": [],
        "visual_prompt": "",
    },
    "bosses": [
        {
            "name": "",
            "concept": "",
            "visual_style": "",
            "mechanics": [],
            "visual_prompt": "",
        }
    ],
    "scenes": [
        {
            "name": "",
            "description": "",
            "visual_keywords": [],
            "image_prompt": "",
        }
    ],
    "ui_screens": [
        {
            "name": "",
            "purpose": "",
            "layout_description": "",
            "image_prompt": "",
        }
    ],
    "video_storyboard": [
        {
            "shot": 1,
            "duration": "",
            "camera": "",
            "visual": "",
            "action": "",
            "caption": "",
            "video_prompt": "",
        }
    ],
    "asset_prompts": {
        "character_concept_art": [],
        "environment_concept_art": [],
        "ui_mockups": [],
        "sprite_sheet": [],
        "video_storyboard": [],
    },
    "pitch_deck_outline": [],
    "monetization_angle": "",
    "development_next_steps": [],
}

SYSTEM_PROMPT = """你是“造境 AI”的资深游戏创意总监、系统策划和视觉开发制片人。
你的任务是把用户的一句话游戏想法扩展成可继续制作角色概念图、场景图、UI Mockup、视频分镜和 Pitch Deck 的结构化游戏世界方案。

硬性规则：
1. 只输出合法 JSON 对象，不要输出 Markdown，不要输出代码块，不要解释。
2. 必须使用中文撰写内容；Prompt 字段可以混合必要的英文美术关键词。
3. 内容要像真实游戏 Pitch 初稿，避免空泛口号。
4. 不要承诺已经生成图片、视频、3D 模型、Unity Demo 或可玩游戏。
5. 输出字段必须兼容下面的 JSON 结构，缺失字段请用空字符串或空数组补齐。
6. 视觉 Prompt 要可直接用于后续图像、UI 或视频生成工具。

JSON 结构：
{schema}
""".format(schema=json.dumps(GAME_WORLD_JSON_SCHEMA, ensure_ascii=False, indent=2))


class ProviderConfigError(RuntimeError):
    pass


class ProviderResponseError(RuntimeError):
    pass


def clean_text(value: Any, fallback: str = "") -> str:
    text = str(value or "").strip()
    return text or fallback


def ensure_list(value: Any) -> list:
    if value is None:
        return []
    if isinstance(value, list):
        return value
    if isinstance(value, tuple):
        return list(value)
    if isinstance(value, str):
        text = value.strip()
        return [text] if text else []
    return [value]


def ensure_string_list(value: Any) -> list[str]:
    return [clean_text(item) for item in ensure_list(value) if clean_text(item)]


def strip_json_wrappers(raw_text: str) -> str:
    text = clean_text(raw_text)
    if text.startswith("```"):
        lines = text.splitlines()
        if lines and lines[0].strip().startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip().startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines).strip()

    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return text[start : end + 1]
    return text


def parse_json_object(raw_text: str) -> dict:
    text = strip_json_wrappers(raw_text)
    try:
        parsed = json.loads(text)
    except json.JSONDecodeError as exc:
        raise ProviderResponseError("AI 返回了非法 JSON，无法解析。") from exc
    if not isinstance(parsed, dict):
        raise ProviderResponseError("AI 返回内容不是 JSON 对象。")
    return parsed


def build_generation_user_prompt(input_payload: dict) -> str:
    return """请基于以下输入生成完整游戏世界方案。

输入：
{payload}

补充要求：
- 世界观、玩法、角色、Boss、场景、UI、视频分镜、素材 Prompt、Pitch 大纲都要可继续制作。
- 至少给出 3 个 Boss、3 个场景、2 个 UI 页面、5 个视频镜头。
- 每个视觉资产相关对象都必须包含可复制的 Prompt。
""".format(payload=json.dumps(input_payload, ensure_ascii=False, indent=2))


def build_regenerate_user_prompt(current_output: dict, section: str, instruction: str) -> str:
    return """请只重新生成指定 section，并保持它与当前游戏世界一致。

指定 section：
{section}

用户补充要求：
{instruction}

当前完整游戏世界 JSON：
{current_output}

返回格式规则：
只输出一个 JSON 对象，格式为：
{{
  "{section}": <重新生成后的 section 内容>
}}
不要输出其他字段，不要输出 Markdown。
""".format(
        section=section,
        instruction=instruction or "保持原方向，但增强细节、视觉可执行性和制作价值。",
        current_output=json.dumps(current_output, ensure_ascii=False, indent=2),
    )


class BaseGameWorldProvider:
    provider_name = "base"

    def __init__(self, model_name: str = "", timeout_seconds: int = 60, **_: Any) -> None:
        self.model_name = model_name
        self.timeout_seconds = timeout_seconds

    def generate_game_world(self, input_payload: dict) -> dict:
        raise NotImplementedError("AI game provider is not implemented.")

    def regenerate_section(self, current_output: dict, section: str, instruction: str, input_payload: dict | None = None) -> Any:
        raise NotImplementedError("AI game provider is not implemented.")


def normalize_worldview(value: Any) -> dict:
    if isinstance(value, dict):
        return {
            "summary": clean_text(value.get("summary")),
            "setting": clean_text(value.get("setting")),
            "conflict": clean_text(value.get("conflict")),
            "factions": ensure_string_list(value.get("factions")),
            "tone_keywords": ensure_string_list(value.get("tone_keywords")),
        }
    text = clean_text(value)
    return {
        "summary": text,
        "setting": text,
        "conflict": "",
        "factions": [],
        "tone_keywords": [],
    }


def normalize_core_gameplay(value: Any) -> dict:
    if isinstance(value, dict):
        return {
            "summary": clean_text(value.get("summary")),
            "loop": clean_text(value.get("loop")),
            "combat": clean_text(value.get("combat")),
            "progression": clean_text(value.get("progression")),
            "unique_hook": clean_text(value.get("unique_hook")),
        }
    text = clean_text(value)
    return {
        "summary": text,
        "loop": text,
        "combat": "",
        "progression": "",
        "unique_hook": "",
    }


def normalize_protagonist(value: Any, art_style: str = "") -> dict:
    data = value if isinstance(value, dict) else {}
    name = clean_text(data.get("name"), "未命名主角")
    appearance = clean_text(data.get("appearance"))
    identity = clean_text(data.get("identity"))
    return {
        "name": name,
        "identity": identity,
        "appearance": appearance,
        "personality": clean_text(data.get("personality")),
        "abilities": ensure_string_list(data.get("abilities")),
        "visual_prompt": clean_text(
            data.get("visual_prompt"),
            f"{name} character concept art, {identity}, {appearance}, {art_style}, game key art",
        ),
    }


def normalize_bosses(value: Any, art_style: str = "") -> list[dict]:
    bosses = []
    for index, item in enumerate(ensure_list(value), start=1):
        data = item if isinstance(item, dict) else {"name": f"Boss {index}", "concept": clean_text(item)}
        name = clean_text(data.get("name"), f"Boss {index}")
        concept = clean_text(data.get("concept"))
        visual_style = clean_text(data.get("visual_style"))
        bosses.append(
            {
                "name": name,
                "concept": concept,
                "visual_style": visual_style,
                "mechanics": ensure_string_list(data.get("mechanics")),
                "visual_prompt": clean_text(
                    data.get("visual_prompt"),
                    f"{name} boss concept art, {concept}, {visual_style}, {art_style}, dramatic game key art",
                ),
            }
        )
    return bosses


def normalize_scenes(value: Any, art_style: str = "") -> list[dict]:
    scenes = []
    for index, item in enumerate(ensure_list(value), start=1):
        data = item if isinstance(item, dict) else {"name": f"场景 {index}", "description": clean_text(item)}
        name = clean_text(data.get("name"), f"场景 {index}")
        description = clean_text(data.get("description"))
        scenes.append(
            {
                "name": name,
                "description": description,
                "visual_keywords": ensure_string_list(data.get("visual_keywords")),
                "image_prompt": clean_text(
                    data.get("image_prompt"),
                    f"{name}, {description}, {art_style}, game environment concept art",
                ),
            }
        )
    return scenes


def normalize_ui_screens(value: Any, art_style: str = "") -> list[dict]:
    screens = []
    for index, item in enumerate(ensure_list(value), start=1):
        data = item if isinstance(item, dict) else {"name": f"UI 页面 {index}", "purpose": clean_text(item)}
        name = clean_text(data.get("name"), f"UI 页面 {index}")
        purpose = clean_text(data.get("purpose"))
        layout = clean_text(data.get("layout_description"))
        screens.append(
            {
                "name": name,
                "purpose": purpose,
                "layout_description": layout,
                "image_prompt": clean_text(
                    data.get("image_prompt"),
                    f"{name} game UI mockup, {purpose}, {layout}, {art_style}, clean readable interface",
                ),
            }
        )
    return screens


def normalize_video_storyboard(value: Any, fallback_prompts: list[str] | None = None) -> list[dict]:
    shots = []
    raw_items = ensure_list(value)
    if not raw_items and fallback_prompts:
        raw_items = fallback_prompts
    for index, item in enumerate(raw_items, start=1):
        if isinstance(item, dict):
            visual = clean_text(item.get("visual"))
            action = clean_text(item.get("action"))
            video_prompt = clean_text(item.get("video_prompt"), " ".join([visual, action]).strip())
            shots.append(
                {
                    "shot": int(item.get("shot") or index),
                    "duration": clean_text(item.get("duration"), "3s"),
                    "camera": clean_text(item.get("camera"), "cinematic camera move"),
                    "visual": visual,
                    "action": action,
                    "caption": clean_text(item.get("caption")),
                    "video_prompt": video_prompt,
                }
            )
        else:
            text = clean_text(item)
            shots.append(
                {
                    "shot": index,
                    "duration": "3s",
                    "camera": "cinematic camera move",
                    "visual": text,
                    "action": text,
                    "caption": "",
                    "video_prompt": text,
                }
            )
    return shots


def normalize_asset_prompts(value: Any) -> dict:
    data = value if isinstance(value, dict) else {}
    return {key: ensure_string_list(data.get(key)) for key in ASSET_PROMPT_KEYS}


def normalize_game_world_result(raw_result: dict, input_payload: dict | None = None) -> dict:
    payload = input_payload or {}
    result = copy.deepcopy(raw_result or {})
    source_input = result.get("source_input") if isinstance(result.get("source_input"), dict) else {}
    art_style = clean_text(payload.get("art_style")) or clean_text(source_input.get("art_style"))
    game_type = clean_text(payload.get("game_type")) or clean_text(source_input.get("game_type")) or clean_text(result.get("genre"), "动作冒险")
    target_platform = clean_text(payload.get("target_platform")) or clean_text(source_input.get("target_platform"), "PC / WebGL")

    asset_prompts = normalize_asset_prompts(result.get("asset_prompts"))
    development_next_steps = ensure_string_list(result.get("development_next_steps") or result.get("next_steps"))
    normalized = {
        "title": clean_text(result.get("title"), "未命名游戏项目"),
        "one_sentence_pitch": clean_text(result.get("one_sentence_pitch"), "一个可继续扩展为视觉资产和 Pitch 的原创游戏方案。"),
        "genre": clean_text(result.get("genre"), game_type),
        "target_player": clean_text(result.get("target_player"), "喜欢强视觉风格、清晰玩法循环和可展示概念原型的玩家与创作者。"),
        "worldview": normalize_worldview(result.get("worldview")),
        "core_gameplay": normalize_core_gameplay(result.get("core_gameplay")),
        "player_fantasy": clean_text(result.get("player_fantasy")),
        "protagonist": normalize_protagonist(result.get("protagonist"), art_style),
        "bosses": normalize_bosses(result.get("bosses"), art_style),
        "scenes": normalize_scenes(result.get("scenes"), art_style),
        "ui_screens": normalize_ui_screens(result.get("ui_screens"), art_style),
        "video_storyboard": normalize_video_storyboard(result.get("video_storyboard"), asset_prompts.get("video_storyboard")),
        "asset_prompts": asset_prompts,
        "pitch_deck_outline": ensure_string_list(result.get("pitch_deck_outline")),
        "monetization_angle": clean_text(result.get("monetization_angle"), "可先以概念方案、Pitch 包和定制视觉资产服务验证需求，再逐步扩展为 Demo 制作。"),
        "development_next_steps": development_next_steps,
        "source_input": {
            "idea": clean_text(payload.get("idea") or source_input.get("idea")),
            "game_type": game_type,
            "art_style": art_style,
            "target_platform": target_platform,
        },
    }
    normalized["next_steps"] = normalized["development_next_steps"]
    return normalized


def normalize_section_value(section: str, value: Any, input_payload: dict | None = None) -> Any:
    payload = input_payload or {}
    art_style = clean_text(payload.get("art_style"))
    if section == "worldview":
        return normalize_worldview(value)
    if section == "core_gameplay":
        return normalize_core_gameplay(value)
    if section == "protagonist":
        return normalize_protagonist(value, art_style)
    if section == "bosses":
        return normalize_bosses(value, art_style)
    if section == "scenes":
        return normalize_scenes(value, art_style)
    if section == "ui_screens":
        return normalize_ui_screens(value, art_style)
    if section == "video_storyboard":
        return normalize_video_storyboard(value)
    if section == "asset_prompts":
        return normalize_asset_prompts(value)
    if section in {"pitch_deck_outline", "development_next_steps", "next_steps"}:
        return ensure_string_list(value)
    return value
