import json
from typing import Any, Dict, List, Optional


ASSET_TYPES = {
    "protagonist",
    "boss",
    "scene",
    "ui_screen",
    "video_storyboard",
    "sprite_sheet",
    "pitch_material",
    "other",
}


def _clean(value: Any, fallback: str = "") -> str:
    text = str(value or "").strip()
    return text or fallback


def _as_list(value: Any) -> list:
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [value]


def _string_list(value: Any) -> List[str]:
    return [_clean(item) for item in _as_list(value) if _clean(item)]


def _make_asset(
    project_id: int,
    user_id: int,
    asset_type: str,
    title: str,
    description: str,
    prompt: str,
    metadata: Optional[Dict] = None,
) -> dict:
    return {
        "project_id": project_id,
        "user_id": user_id,
        "asset_type": asset_type if asset_type in ASSET_TYPES else "other",
        "title": _clean(title, "未命名资产"),
        "description": _clean(description),
        "prompt": _clean(prompt),
        "status": "ready_for_generation",
        "metadata_json": json.dumps(metadata or {}, ensure_ascii=False),
    }


def _dedupe_assets(assets: List[Dict]) -> List[Dict]:
    seen = set()
    unique_assets = []
    for asset in assets:
        key = (
            _clean(asset.get("asset_type")).lower(),
            _clean(asset.get("title")).lower(),
            _clean(asset.get("prompt")).lower(),
        )
        if not key[0] or not key[1] or not key[2] or key in seen:
            continue
        seen.add(key)
        unique_assets.append(asset)
    return unique_assets


def plan_assets_from_game_world(project_id: int, user_id: int, output_json: dict) -> List[Dict]:
    world = output_json or {}
    assets: List[Dict] = []

    protagonist = world.get("protagonist") if isinstance(world.get("protagonist"), dict) else {}
    protagonist_prompt = _clean(protagonist.get("visual_prompt"))
    if protagonist_prompt:
        assets.append(
            _make_asset(
                project_id,
                user_id,
                "protagonist",
                _clean(protagonist.get("name"), "主角设定"),
                "主角概念图 / 三视图 / 关键视觉资产任务。",
                protagonist_prompt,
                {"source": "protagonist"},
            )
        )

    for index, boss in enumerate(_as_list(world.get("bosses")), start=1):
        if not isinstance(boss, dict):
            continue
        prompt = _clean(boss.get("visual_prompt"))
        if not prompt:
            prompt = ", ".join(
                [
                    _clean(boss.get("name"), f"Boss {index}"),
                    _clean(boss.get("concept")),
                    _clean(boss.get("visual_style")),
                    "boss concept art, game key art",
                ]
            )
        assets.append(
            _make_asset(
                project_id,
                user_id,
                "boss",
                _clean(boss.get("name"), f"Boss {index}"),
                _clean(boss.get("concept"), "Boss 概念图资产任务。"),
                prompt,
                {"source": "bosses", "index": index - 1, "mechanics": _string_list(boss.get("mechanics"))},
            )
        )

    for index, scene in enumerate(_as_list(world.get("scenes")), start=1):
        if not isinstance(scene, dict):
            continue
        prompt = _clean(scene.get("image_prompt"))
        if not prompt:
            prompt = ", ".join(
                [
                    _clean(scene.get("name"), f"场景 {index}"),
                    _clean(scene.get("description")),
                    "game environment concept art",
                ]
            )
        assets.append(
            _make_asset(
                project_id,
                user_id,
                "scene",
                _clean(scene.get("name"), f"场景 {index}"),
                _clean(scene.get("description"), "场景概念图资产任务。"),
                prompt,
                {"source": "scenes", "index": index - 1, "visual_keywords": _string_list(scene.get("visual_keywords"))},
            )
        )

    for index, screen in enumerate(_as_list(world.get("ui_screens")), start=1):
        if not isinstance(screen, dict):
            continue
        prompt = _clean(screen.get("image_prompt"))
        if not prompt:
            prompt = ", ".join(
                [
                    _clean(screen.get("name"), f"UI 页面 {index}"),
                    _clean(screen.get("purpose")),
                    _clean(screen.get("layout_description")),
                    "game UI mockup",
                ]
            )
        assets.append(
            _make_asset(
                project_id,
                user_id,
                "ui_screen",
                _clean(screen.get("name"), f"UI 页面 {index}"),
                _clean(screen.get("layout_description") or screen.get("purpose"), "UI 页面资产任务。"),
                prompt,
                {"source": "ui_screens", "index": index - 1},
            )
        )

    for index, shot in enumerate(_as_list(world.get("video_storyboard")), start=1):
        if not isinstance(shot, dict):
            continue
        prompt = _clean(shot.get("video_prompt"))
        if not prompt:
            prompt = ", ".join(
                [
                    _clean(shot.get("camera")),
                    _clean(shot.get("visual")),
                    _clean(shot.get("action")),
                    "game trailer storyboard shot",
                ]
            )
        assets.append(
            _make_asset(
                project_id,
                user_id,
                "video_storyboard",
                "镜头 {0}: {1}".format(index, _clean(shot.get("caption"), _clean(shot.get("visual"), "视频分镜"))),
                "时长 {0}；镜头 {1}；动作 {2}".format(
                    _clean(shot.get("duration"), "--"),
                    _clean(shot.get("camera"), "--"),
                    _clean(shot.get("action"), "--"),
                ),
                prompt,
                {"source": "video_storyboard", "index": index - 1, "shot": shot.get("shot", index)},
            )
        )

    asset_prompts = world.get("asset_prompts") if isinstance(world.get("asset_prompts"), dict) else {}
    for index, prompt in enumerate(_string_list(asset_prompts.get("sprite_sheet")), start=1):
        assets.append(
            _make_asset(
                project_id,
                user_id,
                "sprite_sheet",
                f"Sprite Sheet {index}",
                "角色动作表 / 序列帧 / sprite sheet 资产任务。",
                prompt,
                {"source": "asset_prompts.sprite_sheet", "index": index - 1},
            )
        )

    for index, prompt in enumerate(_string_list(asset_prompts.get("character_concept_art")), start=1):
        assets.append(
            _make_asset(
                project_id,
                user_id,
                "other",
                f"角色概念资产 {index}",
                "角色概念图补充资产任务。",
                prompt,
                {"source": "asset_prompts.character_concept_art", "index": index - 1},
            )
        )

    for index, prompt in enumerate(_string_list(asset_prompts.get("environment_concept_art")), start=1):
        assets.append(
            _make_asset(
                project_id,
                user_id,
                "scene",
                f"环境概念资产 {index}",
                "环境概念图补充资产任务。",
                prompt,
                {"source": "asset_prompts.environment_concept_art", "index": index - 1},
            )
        )

    for index, prompt in enumerate(_string_list(asset_prompts.get("ui_mockups")), start=1):
        assets.append(
            _make_asset(
                project_id,
                user_id,
                "ui_screen",
                f"UI Mockup {index}",
                "UI Mockup 补充资产任务。",
                prompt,
                {"source": "asset_prompts.ui_mockups", "index": index - 1},
            )
        )

    for index, prompt in enumerate(_string_list(asset_prompts.get("video_storyboard")), start=1):
        assets.append(
            _make_asset(
                project_id,
                user_id,
                "video_storyboard",
                f"视频分镜补充 Prompt {index}",
                "宣传片 / 视频分镜补充资产任务。",
                prompt,
                {"source": "asset_prompts.video_storyboard", "index": index - 1},
            )
        )

    for index, item in enumerate(_string_list(world.get("pitch_deck_outline")), start=1):
        assets.append(
            _make_asset(
                project_id,
                user_id,
                "pitch_material",
                f"Pitch 材料 {index}: {item[:24]}",
                "Pitch Deck 页面或章节材料任务。",
                item,
                {"source": "pitch_deck_outline", "index": index - 1},
            )
        )

    return _dedupe_assets(assets)
