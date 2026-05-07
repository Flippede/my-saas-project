import json
import os
from typing import Any, Dict

import requests


API_URL = "https://api.deepseek.com/v1/chat/completions"
API_KEY = os.getenv("DEEPSEEK_API_KEY", "").strip()


def generate_scripts(payload: dict) -> Dict[str, Any]:
    video_url = payload.get("video_url", "https://example.com/default-topic")
    keywords = payload.get("keywords", "美妆, 平价, 新手友好")

    system_prompt = (
        "你是一位顶尖的抖音短视频带货操盘手和爆款编导，具备强商业转化能力、强内容节奏感、"
        "强人群洞察力。你的核心任务是：在短时间内输出具备高完播率、高互动率、高下单转化率的带货脚本。\n\n"
        "请严格遵守以下创作原则：\n"
        "1) 以成交为目标：每条脚本都要围绕明确的购买动机与行动指令设计。\n"
        "2) 前3秒强钩子：必须快速制造痛点、反差、悬念或利益点，避免平铺直叙。\n"
        "3) 人群精准：根据目标用户常见困扰、消费心理、场景化需求组织表达。\n"
        "4) 节奏清晰：采用【开头钩子 -> 痛点放大 -> 解决方案 -> 产品亮点 -> 信任背书 -> 行动号召】结构。\n"
        "5) 可拍可演：语言口语化、镜头感强、适合主播直接口播，不写空泛套话。\n"
        "6) 合规表达：不出现违法违规、夸大承诺、医疗绝对化、虚假宣传内容。\n\n"
        "输出时，你应像一名资深操盘团队总编导，直接给成片可用脚本，不要解释方法论。"
    )

    user_prompt = (
        "主题视频链接：" + str(video_url) + "\n"
        + "关键词：" + str(keywords) + "\n\n"
        + "请基于以上信息，直接生成3条抖音带货短视频脚本，要求如下：\n"
        + "- 每条脚本开头痛点不同（不能重复同一种开场套路）\n"
        + "- 每条脚本采用不同人设视角（例如：宝妈、学生党、职场女性、成分党等）\n"
        + "- 每条脚本包含：\n"
        + "  1) 3秒钩子\n"
        + "  2) 痛点展开\n"
        + "  3) 产品解决方案与核心卖点\n"
        + "  4) 信任背书/对比点\n"
        + "  5) 明确行动号召（CTA）\n"
        + "- 每条脚本长度控制在180~260字，口播风格自然，适合直接拍摄。\n\n"
        + "请按以下格式返回：\n"
        + "脚本1（人设：xxx）\n"
        + "...\n\n"
        + "脚本2（人设：xxx）\n"
        + "...\n\n"
        + "脚本3（人设：xxx）\n"
        + "..."
    )

    if not API_KEY:
        return {
            "success": False,
            "tool_id": "script_generator",
            "input": {"video_url": video_url, "keywords": keywords},
            "model": "deepseek-chat",
            "result_type": "text",
            "result": "",
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
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.85,
        "max_tokens": 1800,
    }

    try:
        response = requests.post(
            API_URL,
            headers=headers,
            data=json.dumps(body, ensure_ascii=False),
            timeout=60,
        )
        response.raise_for_status()
        data = response.json()
        choices = data.get("choices", [])
        content = ""
        if choices:
            content = choices[0].get("message", {}).get("content", "")

        return {
            "success": True,
            "tool_id": "script_generator",
            "input": {"video_url": video_url, "keywords": keywords},
            "model": "deepseek-chat",
            "result_type": "text",
            "result": content,
            "raw_usage": data.get("usage"),
            "message": "脚本生成成功",
        }
    except Exception as e:
        return {
            "success": False,
            "tool_id": "script_generator",
            "input": {"video_url": video_url, "keywords": keywords},
            "model": "deepseek-chat",
            "result_type": "text",
            "result": "",
            "error": str(e),
            "message": "DeepSeek API 调用失败",
        }
