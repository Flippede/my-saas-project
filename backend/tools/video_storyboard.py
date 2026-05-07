import json
import os
import re
from typing import Any, Dict, List

import requests


API_URL = "https://api.deepseek.com/v1/chat/completions"
API_KEY = os.getenv("DEEPSEEK_API_KEY", "").strip()

SYSTEM_PROMPT = (
    "## 角色\n"
    "你同时具备三重能力：专业的短视频导演、精通画面与风格的 AI 绘画提示词专家，"
    "以及顶级的「内容整理与提炼」专家——能从极度口语化、无排版、碎片化的素材中还原叙事。\n\n"
    "## 输入形态说明\n"
    "用户提供的可能是：语音转写稿、问诊/对话记录、灵感便签、乱序段落等，不必是完整故事。"
    "你必须先消化这些噪声，再产出可用的分镜。\n\n"
    "## 工作流（请严格按此顺序在内心完成，不要向用户输出中间思考过程）\n"
    "1) 第一步（隐式、仅内省）：通读原始文本与全局角色特征，理解意图；在内心将材料重构、补全因果、"
    "理顺时间线与情绪起伏，形成一条有逻辑、有高潮、有画面感、可拍摄的完整故事素材。\n"
    "2) 第二步（唯一对外输出）：基于上述重构后的故事素材，拆分为连贯、可衔接的视频分镜；"
    "每个分镜的镜头与情节必须能串成整条短片。\n\n"
    "## 对 plot 字段的特别要求\n"
    "各分镜的 `plot` 要用中文写清本镜在「整理后的故事」里处于什么位置：可适当点出前因后果、"
    "人物动机或情绪转折，使单镜情节比以前更丰满、有逻辑；读者只看分镜列表也能理解整条叙事线。"
    "禁止在 plot 中写「第一步我先整理了…」等元话语，应直接叙事化表达。\n\n"
    "## 输出格式（硬约束，以兼容下游解析）\n"
    "无论输入多么杂乱，你的最终回复必须且只能是一个合法的 JSON 数组，不要 markdown 包裹以外的任何说明文字。"
    "数组元素字段固定为：\n"
    '- `scene`：整数序号，从 1 递增。\n'
    '- `plot`：中文情节描述（融合重构后的故事精要，见上文）。\n'
    '- `image_prompt`：英文生图提示词；开头必须自然融入用户给出的「全局角色特征」。\n'
    '- `omni_reference`：英文全能参考词（如镜头角度、景别、光影、质感等）。\n'
    "示例结构（仅示意字段，请按实际分镜数量输出）：\n"
    '`[{"scene": 1, "plot": "...", "image_prompt": "...", "omni_reference": "..."}]`'
)


def _strip_markdown_json_fence(text: str) -> str:
    raw = (text or "").strip()
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", raw, re.IGNORECASE)
    if fence:
        return fence.group(1).strip()
    return raw


def _parse_storyboard_json(content: str) -> List[Dict[str, Any]]:
    cleaned = _strip_markdown_json_fence(content)
    start = cleaned.find("[")
    end = cleaned.rfind("]")
    if start == -1 or end == -1 or end <= start:
        raise ValueError("模型输出中未找到 JSON 数组")
    snippet = cleaned[start : end + 1]
    data = json.loads(snippet)
    if not isinstance(data, list):
        raise ValueError("解析结果不是 JSON 数组")
    return data


def generate_storyboard(payload: dict) -> Dict[str, Any]:
    character_profile = str(payload.get("characterProfile") or "").strip()
    story_text = str(payload.get("storyText") or "").strip()

    user_prompt = (
        "【全局角色特征】\n"
        + character_profile
        + "\n\n【原始故事文案】\n"
        + story_text
    )

    base_error = {
        "tool_id": "video_storyboard",
        "input": {"characterProfile": character_profile, "storyText": story_text},
        "model": "deepseek-chat",
        "result_type": "json",
        "result": [],
    }

    if not character_profile or not story_text:
        return {
            **base_error,
            "success": False,
            "error": "characterProfile 与 storyText 均不能为空",
            "message": "参数校验失败",
        }

    if not API_KEY:
        return {
            **base_error,
            "success": False,
            "error": "DEEPSEEK_API_KEY 未配置",
            "message": "DeepSeek API 调用失败",
        }

    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + API_KEY,
    }
    body = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.6,
        "max_tokens": 4096,
    }

    try:
        response = requests.post(
            API_URL,
            headers=headers,
            data=json.dumps(body, ensure_ascii=False),
            timeout=120,
        )
        response.raise_for_status()
        data = response.json()
        choices = data.get("choices", [])
        content = ""
        if choices:
            content = choices[0].get("message", {}).get("content", "") or ""

        try:
            scenes = _parse_storyboard_json(content)
        except (json.JSONDecodeError, ValueError) as parse_exc:
            return {
                **base_error,
                "success": False,
                "error": f"JSON 解析失败: {parse_exc}",
                "message": "模型输出无法解析为分镜数组",
                "raw_preview": (content[:800] + "…") if len(content) > 800 else content,
            }

        return {
            "success": True,
            "tool_id": "video_storyboard",
            "input": {"characterProfile": character_profile, "storyText": story_text},
            "model": "deepseek-chat",
            "result_type": "json",
            "result": scenes,
            "raw_usage": data.get("usage"),
            "message": "分镜生成成功",
        }
    except requests.RequestException as e:
        return {
            **base_error,
            "success": False,
            "error": str(e),
            "message": "DeepSeek API 调用失败",
        }
    except Exception as e:
        return {
            **base_error,
            "success": False,
            "error": str(e),
            "message": "分镜生成过程发生异常",
        }
