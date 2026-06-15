import base64
import json
import os
import requests
import secrets
import sqlite3
import time
import traceback
import uuid
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Any, List, Optional
from urllib import error as urlerror
from urllib import parse as urlparse
from urllib import request as urlrequest

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse
from pydantic import BaseModel, Field

from services.ai_game_asset_planner import plan_assets_from_game_world
from services.ai_game_generator import generate_game_world, get_ai_game_provider_config, regenerate_game_world_section
from services.ai_game_providers import ALLOWED_REGENERATE_SECTIONS
from tools.script_generator import generate_scripts
from tools.video_storyboard import generate_storyboard

def _read_env(name: str, default: str = "") -> str:
    return os.getenv(name, default).strip()


def _read_env_any(names: List[str], default: str = "") -> str:
    for name in names:
        value = _read_env(name)
        if value:
            return value
    return default


def _read_file(path: str) -> str:
    normalized_path = str(path or "").strip()
    if not normalized_path:
        return ""
    try:
        with open(normalized_path, "r", encoding="utf-8") as file_obj:
            return file_obj.read().strip()
    except OSError:
        return ""


def _read_pem_env_any(names: List[str]) -> str:
    return _read_env_any(names).replace("\\n", "\n")


def _parse_cors_origins() -> List[str]:
    raw_origins = _read_env(
        "CORS_ALLOW_ORIGINS",
        "http://127.0.0.1:3000,http://localhost:3000,https://x-creator.cc",
    )
    if raw_origins == "*":
        return ["*"]
    return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]


app = FastAPI(title="AI Storyboard X MVP", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_parse_cors_origins(),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = _read_env("DB_PATH", "x_creator.db")
FIXED_AMOUNT = Decimal(_read_env_any(["FIXED_AMOUNT", "PAY_AMOUNT"], "49.00"))
OPENCLAW_INSTALL_PRODUCT_CODE = "openclaw_install_service"
OPENCLAW_INSTALL_PRODUCT_NAME = "OpenClaw 龙虾安装调试服务"
OPENCLAW_INSTALL_AMOUNT = Decimal("128.00")
WECHAT_API_BASE = _read_env_any(["WECHAT_API_BASE", "WECHAT_PAY_API_BASE"], "https://api.mch.weixin.qq.com")
WECHAT_NOTIFY_URL = _read_env_any(
    ["WECHAT_NOTIFY_URL", "WECHAT_PAY_NOTIFY_URL", "WX_NOTIFY_URL"],
    "https://x-creator.cc/api/v1/wechat/webhook",
)

# 微信支付 V3 配置（占位）
WECHAT_APPID = _read_env_any(["WECHAT_APPID", "WECHAT_PAY_APPID", "WX_APPID", "APPID", "WECHAT_MP_APPID"])
WECHAT_MCHID = _read_env_any(["WECHAT_MCHID", "WECHAT_PAY_MCHID", "WX_MCHID", "MCH_ID", "MCHID"])
WECHAT_V3_KEY = _read_env_any(["WECHAT_V3_KEY", "WECHAT_API_V3_KEY", "WECHAT_PAY_V3_KEY", "WX_API_V3_KEY", "API_V3_KEY"])
WECHAT_CERT_SERIAL_NO = _read_env_any(
    ["WECHAT_CERT_SERIAL_NO", "WECHAT_PAY_CERT_SERIAL_NO", "WX_CERT_SERIAL_NO", "MCH_CERT_SERIAL_NO"]
)
WECHAT_MP_APPID = _read_env("WECHAT_MP_APPID", WECHAT_APPID)
WECHAT_MP_APPSECRET = _read_env("WECHAT_MP_APPSECRET")
WECHAT_PRIVATE_KEY_PATH = _read_env_any(["WECHAT_PRIVATE_KEY_PATH", "WECHAT_PAY_PRIVATE_KEY_PATH"])
WECHAT_PLATFORM_PUBLIC_KEY_PATH = _read_env_any(
    ["WECHAT_PLATFORM_PUBLIC_KEY_PATH", "WECHAT_PAY_PLATFORM_PUBLIC_KEY_PATH"]
)
WECHAT_PLATFORM_PUBLIC_KEY_ID = _read_env_any(
    ["WECHAT_PLATFORM_PUBLIC_KEY_ID", "WECHAT_PAY_PLATFORM_PUBLIC_KEY_ID"]
)
WECHAT_PRIVATE_KEY = _read_file(WECHAT_PRIVATE_KEY_PATH) or _read_pem_env_any(
    ["WECHAT_PRIVATE_KEY", "WECHAT_PAY_PRIVATE_KEY", "WX_PRIVATE_KEY", "MCH_PRIVATE_KEY"]
)
WECHAT_PLATFORM_PUBLIC_KEY = _read_file(WECHAT_PLATFORM_PUBLIC_KEY_PATH) or _read_pem_env_any(
    ["WECHAT_PLATFORM_PUBLIC_KEY", "WECHAT_PAY_PLATFORM_PUBLIC_KEY", "WX_PLATFORM_PUBLIC_KEY"]
)
ADMIN_OPENIDS = {
    item.strip()
    for item in _read_env("ADMIN_OPENIDS").split(",")
    if item.strip()
}


def get_db_conn() -> sqlite3.Connection:
    # 使用项目当前统一数据库文件（如需改名可统一调整 DB_PATH）
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def validate_wechat_login_config() -> None:
    required_values = {
        "WECHAT_MP_APPID": WECHAT_MP_APPID,
        "WECHAT_MP_APPSECRET": WECHAT_MP_APPSECRET,
    }

    for key, value in required_values.items():
        text = str(value or "").strip()
        if not text:
            raise RuntimeError(f"{key} 未配置")
        if "YOUR_" in text or "这里填入" in text:
            raise RuntimeError(f"{key} 仍为占位值，请替换为真实配置")


def _check_required_config(required_values: dict) -> dict:
    missing_keys: List[str] = []
    placeholder_keys: List[str] = []
    invalid_keys: List[str] = []
    for key, value in required_values.items():
        text = str(value).strip()
        if not text:
            missing_keys.append(key)
        if "YOUR_" in text or "这里填入" in text:
            placeholder_keys.append(key)

    return {
        "configured": not missing_keys and not placeholder_keys and not invalid_keys,
        "required": list(required_values.keys()),
        "missing": missing_keys,
        "placeholder": placeholder_keys,
        "invalid": invalid_keys,
    }


def get_wechat_payment_config_status() -> dict:
    create_required_values = {
        "WECHAT_APPID": WECHAT_APPID,
        "WECHAT_MCHID": WECHAT_MCHID,
        "WECHAT_CERT_SERIAL_NO": WECHAT_CERT_SERIAL_NO,
        "WECHAT_PRIVATE_KEY_PATH": WECHAT_PRIVATE_KEY,
    }
    callback_required_values = {
        "WECHAT_V3_KEY": WECHAT_V3_KEY,
        "WECHAT_PLATFORM_PUBLIC_KEY_PATH": WECHAT_PLATFORM_PUBLIC_KEY,
    }

    create_status = _check_required_config(create_required_values)
    callback_status = _check_required_config(callback_required_values)

    if WECHAT_V3_KEY and len(WECHAT_V3_KEY) != 32:
        callback_status["invalid"].append("WECHAT_V3_KEY")
    if WECHAT_PRIVATE_KEY and "BEGIN PRIVATE KEY" not in WECHAT_PRIVATE_KEY:
        create_status["invalid"].append("WECHAT_PRIVATE_KEY_PATH")
    if WECHAT_PLATFORM_PUBLIC_KEY and "BEGIN PUBLIC KEY" not in WECHAT_PLATFORM_PUBLIC_KEY:
        callback_status["invalid"].append("WECHAT_PLATFORM_PUBLIC_KEY_PATH")
    create_status["configured"] = (
        not create_status["missing"] and not create_status["placeholder"] and not create_status["invalid"]
    )
    callback_status["configured"] = (
        not callback_status["missing"] and not callback_status["placeholder"] and not callback_status["invalid"]
    )

    return {
        "configured": create_status["configured"] and not create_status["invalid"],
        "create_order_missing": create_status["missing"],
        "callback_missing": callback_status["missing"],
        "create_order": create_status,
        "callback": callback_status,
        "optional_with_defaults": {
            "WECHAT_API_BASE": WECHAT_API_BASE,
            "WECHAT_NOTIFY_URL": WECHAT_NOTIFY_URL,
            "FIXED_AMOUNT": f"{FIXED_AMOUNT:.2f}",
        },
        "supported_aliases": {
            "WECHAT_APPID": ["WECHAT_PAY_APPID", "WX_APPID", "APPID", "WECHAT_MP_APPID"],
            "WECHAT_MCHID": ["WECHAT_PAY_MCHID", "WX_MCHID", "MCH_ID", "MCHID"],
            "WECHAT_V3_KEY": ["WECHAT_API_V3_KEY", "WECHAT_PAY_V3_KEY", "WX_API_V3_KEY", "API_V3_KEY"],
            "WECHAT_CERT_SERIAL_NO": ["WECHAT_PAY_CERT_SERIAL_NO", "WX_CERT_SERIAL_NO", "MCH_CERT_SERIAL_NO"],
            "WECHAT_PRIVATE_KEY_PATH": ["WECHAT_PAY_PRIVATE_KEY_PATH"],
            "WECHAT_PRIVATE_KEY": ["WECHAT_PAY_PRIVATE_KEY", "WX_PRIVATE_KEY", "MCH_PRIVATE_KEY"],
            "WECHAT_PLATFORM_PUBLIC_KEY_PATH": ["WECHAT_PAY_PLATFORM_PUBLIC_KEY_PATH"],
            "WECHAT_PLATFORM_PUBLIC_KEY": ["WECHAT_PAY_PLATFORM_PUBLIC_KEY", "WX_PLATFORM_PUBLIC_KEY"],
        },
        "env_source": "backend reads process environment; deployed service imports backend/.env via systemd EnvironmentFile",
    }


def validate_wechat_create_config() -> None:
    status = get_wechat_payment_config_status()
    create_status = status["create_order"]
    if create_status["missing"]:
        raise RuntimeError("微信支付创建订单配置不完整，缺少: " + ", ".join(create_status["missing"]))
    if create_status["placeholder"]:
        raise RuntimeError("微信支付创建订单配置仍为占位值: " + ", ".join(create_status["placeholder"]))
    if create_status["invalid"]:
        raise RuntimeError("微信支付创建订单配置格式不正确: " + ", ".join(create_status["invalid"]))


def validate_wechat_callback_config() -> None:
    status = get_wechat_payment_config_status()
    callback_status = status["callback"]
    missing = callback_status["missing"] + callback_status["invalid"]
    if missing:
        raise RuntimeError("微信支付回调配置不完整或格式不正确: " + ", ".join(missing))


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def parse_iso_time(time_str: str) -> datetime:
    # 兼容 Python 3.6 的 ISO 时间解析
    try:
        raw = str(time_str or "").strip()
        if not raw:
            return now_utc()
        raw = raw.replace("Z", "")
        if "+" in raw:
            raw = raw.split("+")[0]
        if "." in raw:
            raw = raw.split(".")[0]
        parsed = datetime.strptime(raw.replace("T", " "), "%Y-%m-%d %H:%M:%S")
        return parsed.replace(tzinfo=timezone.utc)
    except Exception:
        return now_utc()


def make_order_id() -> str:
    return f"WX{datetime.now().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:10].upper()}"


def init_db() -> None:
    conn = get_db_conn()
    cur = conn.cursor()
    # users 新版结构（订单号桥接）
    # 若历史 users 表不是该结构，则做轻量迁移。
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
    has_users = cur.fetchone() is not None
    if not has_users:
        cur.execute(
            """
            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                is_vip INTEGER NOT NULL DEFAULT 0,
                expire_at TEXT
            )
            """
        )
    else:
        cur.execute("PRAGMA table_info(users)")
        user_cols = [row[1] for row in cur.fetchall()]
        # 旧结构兼容迁移：openid/nickname... -> id/username/is_vip/expire_at
        if "id" not in user_cols or "username" not in user_cols:
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS users_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT NOT NULL UNIQUE,
                    is_vip INTEGER NOT NULL DEFAULT 0,
                    expire_at TEXT
                )
                """
            )
            if "openid" in user_cols:
                cur.execute(
                    """
                    INSERT OR IGNORE INTO users_new (username, is_vip, expire_at)
                    SELECT openid,
                           CASE WHEN is_vip IS NULL THEN 0 ELSE is_vip END,
                           vip_expire
                    FROM users
                    WHERE openid IS NOT NULL AND openid != ''
                    """
                )
            cur.execute("DROP TABLE users")
            cur.execute("ALTER TABLE users_new RENAME TO users")

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS orders (
            order_id TEXT PRIMARY KEY,
            user_id INTEGER,
            amount TEXT NOT NULL,
            status TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS tokens (
            token TEXT PRIMARY KEY,
            order_id TEXT UNIQUE,
            openid TEXT,
            expire_date TEXT NOT NULL,
            status INTEGER NOT NULL DEFAULT 1
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS login_sessions (
            scene_id TEXT PRIMARY KEY,
            status TEXT NOT NULL,
            openid TEXT,
            created_at TEXT NOT NULL
        )
        """
    )
    cur.execute("PRAGMA table_info(login_sessions)")
    login_cols = [row[1] for row in cur.fetchall()]
    required_login_cols = {"scene_id", "openid", "status", "created_at"}
    if not required_login_cols.issubset(set(login_cols)):
        cur.execute("DROP TABLE login_sessions")
        cur.execute(
            """
            CREATE TABLE login_sessions (
                scene_id TEXT PRIMARY KEY,
                openid TEXT,
                status TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS game_submissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            game_name TEXT,
            game_type TEXT,
            art_style TEXT,
            protagonist TEXT,
            enemy_boss TEXT,
            scene_setting TEXT,
            core_gameplay TEXT,
            deliverables_json TEXT NOT NULL DEFAULT '[]',
            budget_range TEXT,
            contact TEXT,
            notes TEXT,
            admin_note TEXT,
            status TEXT NOT NULL DEFAULT 'new',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS service_orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            product_code TEXT NOT NULL,
            product_name TEXT NOT NULL,
            amount TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            out_trade_no TEXT NOT NULL UNIQUE,
            transaction_id TEXT,
            paid_at TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS ai_game_projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL DEFAULT '',
            one_sentence_idea TEXT NOT NULL,
            game_type TEXT,
            art_style TEXT,
            target_platform TEXT,
            status TEXT NOT NULL DEFAULT 'draft',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS ai_game_generation_runs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            input_json TEXT NOT NULL DEFAULT '{}',
            output_json TEXT NOT NULL DEFAULT '{}',
            provider TEXT,
            model_name TEXT,
            status TEXT NOT NULL DEFAULT 'pending',
            error_message TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS ai_game_assets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            asset_type TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            prompt TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            result_url TEXT,
            thumbnail_url TEXT,
            metadata_json TEXT NOT NULL DEFAULT '{}',
            admin_note TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        """
    )
    cur.execute("PRAGMA table_info(game_submissions)")
    submission_cols = [row[1] for row in cur.fetchall()]
    if "admin_note" not in submission_cols:
        cur.execute("ALTER TABLE game_submissions ADD COLUMN admin_note TEXT")
    cur.execute("PRAGMA table_info(tokens)")
    cols = [row[1] for row in cur.fetchall()]
    if "order_id" not in cols:
        cur.execute("ALTER TABLE tokens ADD COLUMN order_id TEXT")
    if "openid" not in cols:
        cur.execute("ALTER TABLE tokens ADD COLUMN openid TEXT")
    cur.execute("PRAGMA table_info(orders)")
    order_cols = [row[1] for row in cur.fetchall()]
    if "user_id" not in order_cols:
        cur.execute("ALTER TABLE orders ADD COLUMN user_id INTEGER")
    if "username" not in order_cols:
        cur.execute("ALTER TABLE orders ADD COLUMN username TEXT")
    if "plan" not in order_cols:
        cur.execute("ALTER TABLE orders ADD COLUMN plan TEXT")
    if "vip_type" not in order_cols:
        cur.execute("ALTER TABLE orders ADD COLUMN vip_type TEXT")
    if "transaction_id" not in order_cols:
        cur.execute("ALTER TABLE orders ADD COLUMN transaction_id TEXT")
    if "paid_at" not in order_cols:
        cur.execute("ALTER TABLE orders ADD COLUMN paid_at TEXT")
    conn.commit()
    conn.close()


def _load_private_key():
    return serialization.load_pem_private_key(WECHAT_PRIVATE_KEY.encode("utf-8"), password=None)


def _load_platform_public_key():
    return serialization.load_pem_public_key(WECHAT_PLATFORM_PUBLIC_KEY.encode("utf-8"))


def _build_wechat_authorization(method: str, canonical_url: str, body: str) -> str:
    timestamp = str(int(time.time()))
    nonce_str = secrets.token_hex(16)
    message = f"{method}\n{canonical_url}\n{timestamp}\n{nonce_str}\n{body}\n"
    signature = _load_private_key().sign(
        message.encode("utf-8"),
        padding.PKCS1v15(),
        hashes.SHA256(),
    )
    sign_b64 = base64.b64encode(signature).decode("utf-8")
    return (
        'WECHATPAY2-SHA256-RSA2048 '
        f'mchid="{WECHAT_MCHID}",'
        f'nonce_str="{nonce_str}",'
        f'signature="{sign_b64}",'
        f'timestamp="{timestamp}",'
        f'serial_no="{WECHAT_CERT_SERIAL_NO}"'
    )


def _wechat_post_native(
    out_trade_no: str,
    amount: Decimal = FIXED_AMOUNT,
    description: str = "AI Storyboard X - 30天订阅",
) -> str:
    url_path = "/v3/pay/transactions/native"
    amount_obj = {"total": int(amount * 100), "currency": "CNY"}
    body_dict = {
        "appid": WECHAT_APPID,
        "mchid": WECHAT_MCHID,
        "description": description,
        "out_trade_no": out_trade_no,
        "notify_url": WECHAT_NOTIFY_URL,
        "amount": amount_obj,
    }

    # 微信 Native 下单关键参数自检，避免无效请求。
    required_fields = ["appid", "mchid", "out_trade_no", "description", "notify_url", "amount"]
    missing = [k for k in required_fields if not body_dict.get(k)]
    if missing:
        raise HTTPException(status_code=500, detail=f"微信下单缺少必填字段: {missing}")
    if not str(body_dict["notify_url"]).startswith("https://"):
        raise HTTPException(status_code=500, detail="notify_url 必须是公网 HTTPS 地址")
    if not isinstance(body_dict["amount"], dict):
        raise HTTPException(status_code=500, detail="amount 必须是字典对象")
    expected_total = int(amount * 100)
    if body_dict["amount"].get("total") != expected_total or body_dict["amount"].get("currency") != "CNY":
        raise HTTPException(
            status_code=500,
            detail="amount 格式错误，当前配置金额应为 total={0}, currency='CNY'".format(expected_total),
        )

    body = json.dumps(body_dict, ensure_ascii=False, separators=(",", ":"))
    auth = _build_wechat_authorization("POST", url_path, body)

    req = urlrequest.Request(
        url=f"{WECHAT_API_BASE}{url_path}",
        data=body.encode("utf-8"),
        method="POST",
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": auth,
            "User-Agent": "AI-Storyboard-X/1.0",
        },
    )
    try:
        with urlrequest.urlopen(req, timeout=12) as resp:
            raw = resp.read().decode("utf-8")
            data = json.loads(raw)
    except urlerror.HTTPError as e:
        error_body = e.read().decode("utf-8")
        print(f"微信支付接口返回错误详情: {error_body}")
        traceback.print_exc()
        raise HTTPException(
            status_code=502,
            detail=f"微信下单 HTTPError: status={e.code}, body={error_body}",
        ) from e
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(status_code=502, detail=f"微信下单请求失败: {exc}") from exc

    code_url = data.get("code_url")
    if not code_url:
        try:
            raise RuntimeError(f"微信下单响应缺少 code_url: {data}")
        except RuntimeError as exc:
            traceback.print_exc()
            raise HTTPException(status_code=502, detail=f"微信下单响应异常: {data}") from exc
    return code_url


def _wechat_query_order(out_trade_no: str) -> dict:
    url_path = "/v3/pay/transactions/out-trade-no/{0}?mchid={1}".format(
        urlparse.quote(out_trade_no),
        urlparse.quote(WECHAT_MCHID),
    )
    auth = _build_wechat_authorization("GET", url_path, "")
    req = urlrequest.Request(
        url=f"{WECHAT_API_BASE}{url_path}",
        method="GET",
        headers={
            "Accept": "application/json",
            "Authorization": auth,
            "User-Agent": "AI-Storyboard-X/1.0",
        },
    )
    try:
        with urlrequest.urlopen(req, timeout=12) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw)
    except urlerror.HTTPError as e:
        error_body = e.read().decode("utf-8")
        print("微信查单失败: out_trade_no={0}, status={1}, body={2}".format(out_trade_no, e.code, error_body))
        return {}
    except Exception as exc:
        print("微信查单请求异常: out_trade_no={0}, error={1}".format(out_trade_no, type(exc).__name__))
        return {}


def _activate_vip_for_paid_order(out_trade_no: str, transaction_id: str = "", paid_at: str = "") -> dict:
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT status, user_id, amount FROM orders WHERE order_id = ?", (out_trade_no,))
    order = cur.fetchone()
    if not order:
        conn.close()
        return {"ok": False, "message": "order_not_found"}

    user_id = order["user_id"]
    if not user_id:
        conn.close()
        return {"ok": False, "message": "order_missing_user_id"}

    expire_date = (now_utc() + timedelta(days=30)).isoformat()
    effective_paid_at = paid_at or now_utc().isoformat()

    if order["status"] in {"paid", "success"}:
        cur.execute(
            """
            UPDATE orders
            SET status = 'paid',
                transaction_id = COALESCE(NULLIF(transaction_id, ''), ?),
                paid_at = COALESCE(NULLIF(paid_at, ''), ?)
            WHERE order_id = ?
            """,
            (transaction_id, effective_paid_at, out_trade_no),
        )
        cur.execute(
            """
            UPDATE users
            SET is_vip = 1,
                expire_at = CASE
                    WHEN expire_at IS NULL OR expire_at = '' OR expire_at < ? THEN ?
                    ELSE expire_at
                END
            WHERE id = ?
            """,
            (expire_date, expire_date, user_id),
        )
        conn.commit()
        conn.close()
        return {"ok": True, "message": "already_paid", "user_id": user_id}

    cur.execute(
        """
        UPDATE orders
        SET status = 'paid',
            transaction_id = ?,
            paid_at = ?
        WHERE order_id = ?
        """,
        (transaction_id, effective_paid_at, out_trade_no),
    )
    cur.execute(
        """
        UPDATE users
        SET is_vip = 1, expire_at = ?
        WHERE id = ?
        """,
        (expire_date, user_id),
    )
    conn.commit()
    conn.close()
    print("支付订单已开通VIP: out_trade_no={0}, transaction_id={1}, user_id={2}".format(
        out_trade_no,
        transaction_id or "-",
        user_id,
    ))
    return {"ok": True, "message": "paid", "user_id": user_id}


def _get_service_order(out_trade_no: str) -> Optional[sqlite3.Row]:
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM service_orders WHERE out_trade_no = ?", (out_trade_no,))
    row = cur.fetchone()
    conn.close()
    return row


def _mark_service_order_paid(out_trade_no: str, transaction_id: str = "", paid_at: str = "") -> dict:
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT id, status, user_id FROM service_orders WHERE out_trade_no = ?", (out_trade_no,))
    order = cur.fetchone()
    if not order:
        conn.close()
        return {"ok": False, "message": "service_order_not_found"}

    effective_paid_at = paid_at or now_utc().isoformat()
    if str(order["status"] or "").lower() == "paid":
        cur.execute(
            """
            UPDATE service_orders
            SET transaction_id = COALESCE(NULLIF(transaction_id, ''), ?),
                paid_at = COALESCE(NULLIF(paid_at, ''), ?),
                updated_at = ?
            WHERE out_trade_no = ?
            """,
            (transaction_id, effective_paid_at, now_utc().isoformat(), out_trade_no),
        )
        conn.commit()
        conn.close()
        return {"ok": True, "message": "already_paid", "user_id": order["user_id"]}

    cur.execute(
        """
        UPDATE service_orders
        SET status = 'paid',
            transaction_id = ?,
            paid_at = ?,
            updated_at = ?
        WHERE out_trade_no = ?
        """,
        (transaction_id, effective_paid_at, now_utc().isoformat(), out_trade_no),
    )
    conn.commit()
    conn.close()
    print("OpenClaw 服务订单已支付: out_trade_no={0}, transaction_id={1}".format(
        out_trade_no,
        transaction_id or "-",
    ))
    return {"ok": True, "message": "paid", "user_id": order["user_id"]}


def _sync_service_order_from_wechat(out_trade_no: str) -> dict:
    order = _get_service_order(out_trade_no)
    if not order:
        return {"synced": False, "message": "service_order_not_found"}
    if str(order["status"] or "").lower() == "paid":
        return {"synced": True, "message": "already_paid"}

    data = _wechat_query_order(out_trade_no)
    trade_state = data.get("trade_state", "")
    if trade_state != "SUCCESS":
        return {"synced": False, "message": trade_state or "not_success"}

    amount_total = data.get("amount", {}).get("total", 0)
    if Decimal(str(amount_total)) != OPENCLAW_INSTALL_AMOUNT * 100:
        print("OpenClaw 服务订单查单金额不匹配: out_trade_no={0}, amount_total={1}".format(out_trade_no, amount_total))
        return {"synced": False, "message": "amount_mismatch"}

    paid_at = parse_iso_time(data.get("success_time", "")).isoformat()
    result = _mark_service_order_paid(
        out_trade_no,
        transaction_id=data.get("transaction_id", ""),
        paid_at=paid_at,
    )
    return {"synced": result.get("ok", False), "message": result.get("message", "paid")}


def _sync_order_from_wechat(out_trade_no: str) -> dict:
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT status FROM orders WHERE order_id = ?", (out_trade_no,))
    order = cur.fetchone()
    conn.close()
    if not order:
        return {"synced": False, "message": "order_not_found"}
    if order["status"] in {"paid", "success"}:
        result = _activate_vip_for_paid_order(out_trade_no)
        return {"synced": result.get("ok", False), "message": result.get("message", "already_paid")}

    data = _wechat_query_order(out_trade_no)
    trade_state = data.get("trade_state", "")
    transaction_id = data.get("transaction_id", "")
    print("微信查单结果: out_trade_no={0}, trade_state={1}, transaction_id={2}".format(
        out_trade_no,
        trade_state or "-",
        transaction_id or "-",
    ))
    if trade_state != "SUCCESS":
        return {"synced": False, "message": trade_state or "not_success"}

    amount_total = data.get("amount", {}).get("total", 0)
    if Decimal(str(amount_total)) != FIXED_AMOUNT * 100:
        print("微信查单金额不匹配: out_trade_no={0}, amount_total={1}".format(out_trade_no, amount_total))
        return {"synced": False, "message": "amount_mismatch"}

    paid_at = parse_iso_time(data.get("success_time", "")).isoformat()
    result = _activate_vip_for_paid_order(out_trade_no, transaction_id=transaction_id, paid_at=paid_at)
    return {"synced": result.get("ok", False), "message": result.get("message", "paid")}


def _verify_wechat_signature(headers, body: str) -> bool:
    timestamp = headers.get("Wechatpay-Timestamp", "")
    nonce = headers.get("Wechatpay-Nonce", "")
    signature = headers.get("Wechatpay-Signature", "")
    if not timestamp or not nonce or not signature:
        return False

    message = f"{timestamp}\n{nonce}\n{body}\n"
    try:
        sign_bytes = base64.b64decode(signature)
        _load_platform_public_key().verify(
            sign_bytes,
            message.encode("utf-8"),
            padding.PKCS1v15(),
            hashes.SHA256(),
        )
        return True
    except Exception:
        return False


def _decrypt_wechat_resource(resource: dict) -> dict:
    nonce = resource.get("nonce", "")
    associated_data = resource.get("associated_data", "")
    ciphertext = resource.get("ciphertext", "")
    if not nonce or not ciphertext:
        raise HTTPException(status_code=400, detail="微信回调密文结构不完整")

    aesgcm = AESGCM(WECHAT_V3_KEY.encode("utf-8"))
    cipher_bytes = base64.b64decode(ciphertext)
    plain = aesgcm.decrypt(
        nonce.encode("utf-8"),
        cipher_bytes,
        associated_data.encode("utf-8") if associated_data else None,
    )
    return json.loads(plain.decode("utf-8"))


def get_wechat_access_token():
    url = (
        "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid="
        + WECHAT_MP_APPID
        + "&secret="
        + WECHAT_MP_APPSECRET
    )
    try:
        resp = requests.get(url, timeout=10).json()
        if "access_token" in resp:
            return resp["access_token"]
        print("微信返回报错: {0}".format(resp))
        return None
    except Exception as e:
        print("请求微信 access_token 接口失败: {0}".format(type(e).__name__))
        return None


def _create_login_qr_ticket(scene_str: str) -> dict:
    access_token = get_wechat_access_token()
    if not access_token:
        raise HTTPException(status_code=500, detail="微信凭证获取失败，请检查终端日志")
    api = "https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token=" + access_token
    body = {
        "expire_seconds": 300,
        "action_name": "QR_STR_SCENE",
        "action_info": {"scene": {"scene_str": scene_str}},
    }
    req = urlrequest.Request(
        url=api,
        data=json.dumps(body).encode("utf-8"),
        method="POST",
        headers={"Content-Type": "application/json"},
    )
    try:
        with urlrequest.urlopen(req, timeout=10) as resp:
            raw = resp.read().decode("utf-8")
            data = json.loads(raw)
    except Exception as exc:
        raise HTTPException(status_code=502, detail="创建服务号登录二维码失败: " + str(exc))

    ticket = data.get("ticket", "")
    if not ticket:
        raise HTTPException(status_code=502, detail="微信返回 ticket 为空: " + str(data))
    return data


@app.on_event("startup")
def on_startup() -> None:
    init_db()


class PaymentCreateResponse(BaseModel):
    order_id: str
    code_url: str
    amount: str
    status: str


class ServiceOrderResponse(BaseModel):
    order_id: str
    product_code: str
    product_name: str
    amount: str
    status: str
    service_status: str
    code_url: Optional[str] = ""
    paid_at: Optional[str] = ""


class LoginQRCodeResponse(BaseModel):
    scene_id: str
    qrcode_url: str
    expires_in: int


class ToolsDispatchRequest(BaseModel):
    tool_id: str
    payload: dict = Field(default_factory=dict)


class GameSubmissionRequest(BaseModel):
    game_name: Optional[str] = ""
    game_type: Optional[str] = ""
    art_style: Optional[str] = ""
    protagonist: Optional[str] = ""
    enemy_boss: Optional[str] = ""
    scene_setting: Optional[str] = ""
    core_gameplay: Optional[str] = ""
    deliverables: List[str] = Field(default_factory=list)
    budget_range: Optional[str] = ""
    contact: Optional[str] = ""
    notes: Optional[str] = ""


class AIGameProjectCreateRequest(BaseModel):
    idea: str = Field(min_length=1, max_length=1200)
    game_type: Optional[str] = ""
    art_style: Optional[str] = ""
    target_platform: Optional[str] = ""


class AIGameProjectRegenerateSectionRequest(BaseModel):
    section: str = Field(min_length=1, max_length=80)
    instruction: Optional[str] = ""


class AIGameAssetUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    prompt: Optional[str] = None
    status: Optional[str] = None
    result_url: Optional[str] = None
    thumbnail_url: Optional[str] = None


class AdminAIGameAssetUpdateRequest(AIGameAssetUpdateRequest):
    admin_note: Optional[str] = None
    metadata_json: Optional[dict] = None


class AdminGameSubmissionUpdateRequest(BaseModel):
    status: Optional[str] = None
    admin_note: Optional[str] = None


ALLOWED_AI_GAME_ASSET_TYPES = {
    "protagonist",
    "boss",
    "scene",
    "ui_screen",
    "video_storyboard",
    "sprite_sheet",
    "pitch_material",
    "other",
}


ALLOWED_AI_GAME_ASSET_STATUSES = {
    "pending",
    "ready_for_generation",
    "generating",
    "generated",
    "uploaded",
    "failed",
    "cancelled",
}


ALLOWED_GAME_SUBMISSION_STATUSES = {
    "new",
    "reviewing",
    "quoted",
    "in_progress",
    "delivered",
    "cancelled",
}


def _clean_text(value: Optional[str]) -> str:
    return str(value or "").strip()


def _get_token_identity(token: str) -> Optional[dict]:
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT openid FROM tokens WHERE token = ? AND status = 1", (token,))
    token_row = cur.fetchone()
    if not token_row or not token_row["openid"]:
        conn.close()
        return None

    openid = token_row["openid"]
    cur.execute("SELECT id FROM users WHERE username = ?", (openid,))
    user_row = cur.fetchone()
    conn.close()
    if not user_row:
        return None

    return {
        "user_id": int(user_row["id"]),
        "openid": openid,
    }


def _get_user_id_for_token(token: str) -> Optional[int]:
    identity = _get_token_identity(token)
    if not identity:
        return None
    return int(identity["user_id"])


def _get_optional_user_id_from_authorization(authorization: Optional[str]) -> Optional[int]:
    if not authorization:
        return None

    parts = authorization.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer" or not parts[1].strip():
        return None

    token = parts[1].strip()
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT expire_date, status FROM tokens WHERE token = ?", (token,))
    row = cur.fetchone()
    conn.close()
    if not row or int(row["status"]) != 1 or now_utc() >= parse_iso_time(row["expire_date"]):
        return None

    return _get_user_id_for_token(token)


def _format_game_submission(row: sqlite3.Row) -> dict:
    try:
        deliverables = json.loads(row["deliverables_json"] or "[]")
    except json.JSONDecodeError:
        deliverables = []
    if not isinstance(deliverables, list):
        deliverables = []

    return {
        "id": row["id"],
        "user_id": row["user_id"],
        "game_name": row["game_name"] or "",
        "game_type": row["game_type"] or "",
        "art_style": row["art_style"] or "",
        "protagonist": row["protagonist"] or "",
        "enemy_boss": row["enemy_boss"] or "",
        "scene_setting": row["scene_setting"] or "",
        "core_gameplay": row["core_gameplay"] or "",
        "deliverables": deliverables,
        "budget_range": row["budget_range"] or "",
        "contact": row["contact"] or "",
        "notes": row["notes"] or "",
        "admin_note": row["admin_note"] or "",
        "status": row["status"] or "new",
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def _safe_json_loads(value: Optional[str], fallback: Any) -> Any:
    try:
        return json.loads(value or "")
    except (TypeError, json.JSONDecodeError):
        return fallback


def _format_ai_game_project(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "user_id": row["user_id"],
        "title": row["title"] or "",
        "one_sentence_idea": row["one_sentence_idea"] or "",
        "game_type": row["game_type"] or "",
        "art_style": row["art_style"] or "",
        "target_platform": row["target_platform"] or "",
        "status": row["status"] or "draft",
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def _format_ai_game_generation_run(row: Optional[sqlite3.Row]) -> Optional[dict]:
    if not row:
        return None
    return {
        "id": row["id"],
        "project_id": row["project_id"],
        "user_id": row["user_id"],
        "input_json": _safe_json_loads(row["input_json"], {}),
        "output_json": _safe_json_loads(row["output_json"], {}),
        "provider": row["provider"] or "",
        "model_name": row["model_name"] or "",
        "status": row["status"] or "pending",
        "error_message": row["error_message"] or "",
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def _format_ai_game_asset(row: sqlite3.Row) -> dict:
    metadata = _safe_json_loads(row["metadata_json"], {})
    if not isinstance(metadata, dict):
        metadata = {}
    return {
        "id": row["id"],
        "project_id": row["project_id"],
        "user_id": row["user_id"],
        "asset_type": row["asset_type"] or "other",
        "title": row["title"] or "",
        "description": row["description"] or "",
        "prompt": row["prompt"] or "",
        "status": row["status"] or "pending",
        "result_url": row["result_url"] or "",
        "thumbnail_url": row["thumbnail_url"] or "",
        "metadata": metadata,
        "admin_note": row["admin_note"] or "",
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def _get_ai_game_asset_counts(project_id: int, user_id: Optional[int] = None) -> dict:
    conn = get_db_conn()
    cur = conn.cursor()
    params: list[Any] = [project_id]
    where_sql = "WHERE project_id = ?"
    if user_id is not None:
        where_sql += " AND user_id = ?"
        params.append(user_id)
    cur.execute(
        f"""
        SELECT status, COUNT(*) AS count
        FROM ai_game_assets
        {where_sql}
        GROUP BY status
        """,
        params,
    )
    rows = cur.fetchall()
    conn.close()
    by_status = {row["status"] or "pending": int(row["count"]) for row in rows}
    total = sum(by_status.values())
    return {
        "total": total,
        "pending": by_status.get("pending", 0) + by_status.get("ready_for_generation", 0),
        "generated": by_status.get("generated", 0),
        "uploaded": by_status.get("uploaded", 0),
        "failed": by_status.get("failed", 0),
        "by_status": by_status,
    }


@app.get("/api/payment/config-check")
async def payment_config_check():
    return get_wechat_payment_config_status()


@app.get("/api/v1/auth/get_login_qrcode", response_model=LoginQRCodeResponse)
async def get_login_qrcode():
    print("DEBUG: 正在请求微信登录二维码...")
    scene_id = str(uuid.uuid4())[:8]

    try:
        validate_wechat_login_config()
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    access_token = get_wechat_access_token()
    if not access_token:
        raise HTTPException(status_code=500, detail="微信凭证获取失败，请检查终端日志")

    qr_url = "https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token={0}".format(access_token)
    payload = {
        "expire_seconds": 300,
        "action_name": "QR_STR_SCENE",
        "action_info": {"scene": {"scene_str": scene_id}},
    }

    try:
        resp = requests.post(qr_url, json=payload, timeout=10)
        raw_text = resp.text
        r = resp.json()
        ticket = r.get("ticket")
        if not ticket:
            print("微信二维码接口返回错误详情: {0}".format(raw_text))
            raise HTTPException(status_code=500, detail="生成二维码失败: {0}".format(r))

        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute(
            """
            INSERT OR REPLACE INTO login_sessions (scene_id, openid, status, created_at)
            VALUES (?, '', 'pending', ?)
            """,
            (scene_id, now_utc().isoformat()),
        )
        conn.commit()
        conn.close()

        return LoginQRCodeResponse(
            scene_id=scene_id,
            qrcode_url="https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket={0}".format(urlparse.quote(ticket)),
            expires_in=300,
        )
    except HTTPException:
        raise
    except Exception as e:
        print("微信二维码请求异常: {0}".format(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/auth/login_status")
async def login_status(session_id: str):
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT status, openid FROM login_sessions WHERE scene_id = ?",
        (session_id,),
    )
    row = cur.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="登录会话不存在")
    if row["status"] != "success":
        conn.close()
        return {"status": "pending", "session_id": session_id}

    openid = row["openid"] or ""
    if not openid:
        conn.close()
        return {"status": "pending", "session_id": session_id}

    cur.execute(
        """
        SELECT token, expire_date FROM tokens
        WHERE openid = ? AND status = 1
        ORDER BY expire_date DESC
        LIMIT 1
        """,
        (openid,),
    )
    token_row = cur.fetchone()
    if token_row and now_utc() < parse_iso_time(token_row["expire_date"]):
        token = token_row["token"]
    else:
        if token_row:
            cur.execute("UPDATE tokens SET status = 0 WHERE token = ?", (token_row["token"],))
        token = "XCC_" + uuid.uuid4().hex
        expire_date = (now_utc() + timedelta(days=30)).isoformat()
        cur.execute(
            """
            INSERT INTO tokens (token, order_id, openid, expire_date, status)
            VALUES (?, NULL, ?, ?, 1)
            """,
            (token, openid, expire_date),
        )
        conn.commit()
    conn.close()
    return {
        "status": "success",
        "session_id": session_id,
        "openid": openid,
        "token": token,
    }


def verify_token_from_header(request: Request, authorization: Optional[str] = Header(default=None)) -> str:
    auth_header = request.headers.get("authorization")
    print(f"DEBUG: 收到请求 - 路径: {request.url.path} | Authorization头: {'present' if auth_header else 'missing'}")
    if not auth_header:
        print("警告：该请求未携带 Token！")
    if not authorization:
        print(f"DEBUG: 支付请求未检测到有效Token")
        raise HTTPException(status_code=401, detail="缺少 Authorization Header")
    parts = authorization.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        print(f"DEBUG: 支付请求未检测到有效Token")
        raise HTTPException(status_code=401, detail="Authorization 格式必须为 Bearer <token>")

    token = parts[1].strip()
    if not token:
        print(f"DEBUG: 支付请求未检测到有效Token")
        raise HTTPException(status_code=401, detail="Token 不能为空")

    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT expire_date, status FROM tokens WHERE token = ?", (token,))
    row = cur.fetchone()
    conn.close()
    if not row:
        print(f"DEBUG: 支付请求未检测到有效Token")
        raise HTTPException(status_code=401, detail="Token 不存在")
    if int(row["status"]) != 1:
        raise HTTPException(status_code=403, detail="Token 已失效")
    if now_utc() >= parse_iso_time(row["expire_date"]):
        raise HTTPException(status_code=403, detail="Token 已过期")
    return token


def require_admin_token(token: str = Depends(verify_token_from_header)) -> dict:
    identity = _get_token_identity(token)
    if not identity:
        raise HTTPException(status_code=401, detail="登录凭证无效，无法识别用户")
    if not ADMIN_OPENIDS or identity["openid"] not in ADMIN_OPENIDS:
        raise HTTPException(status_code=403, detail="无权限访问需求管理后台")
    return identity


@app.post("/api/v1/payment/create", response_model=PaymentCreateResponse)
async def create_payment(request: Request, token: str = Depends(verify_token_from_header)):
    try:
        data = await request.json()
    except Exception:
        data = {}
    # print("DEBUG: 收到支付请求原始数据: {}".format(data))
    try:
        validate_wechat_create_config()
    except RuntimeError as exc:
        print("微信支付配置检查失败: {0}".format(str(exc)))
        raise HTTPException(status_code=503, detail="微信支付暂未配置，请联系管理员完成商户配置。") from exc

    # 自动识别身份：token -> openid -> users.id
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT openid FROM tokens WHERE token = ? AND status = 1", (token,))
    token_row = cur.fetchone()
    if not token_row or not token_row["openid"]:
        conn.close()
        raise HTTPException(status_code=401, detail="登录凭证无效，无法识别用户")

    openid = token_row["openid"]
    cur.execute("SELECT id FROM users WHERE username = ?", (openid,))
    user_row = cur.fetchone()
    if not user_row:
        conn.close()
        raise HTTPException(status_code=404, detail="用户不存在")
    resolved_user_id = int(user_row["id"])

    out_trade_no = make_order_id()
    plan = str(data.get("plan") or "storyboard_x_monthly")
    vip_type = str(data.get("vip_type") or "monthly")
    cur.execute(
        """
        INSERT INTO orders (order_id, user_id, username, plan, vip_type, amount, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
        """,
        (out_trade_no, resolved_user_id, openid, plan, vip_type, f"{FIXED_AMOUNT:.2f}", now_utc().isoformat()),
    )
    conn.commit()
    conn.close()

    code_url = _wechat_post_native(out_trade_no)
    return PaymentCreateResponse(
        order_id=out_trade_no,
        code_url=code_url,
        amount=f"{FIXED_AMOUNT:.2f}",
        status="pending",
    )


@app.api_route("/api/payment/wechat/notify", methods=["GET", "POST"])
@app.api_route("/api/v1/wechat/webhook", methods=["GET", "POST"])
async def wechat_webhook(request: Request):
    # --- 新增：处理微信服务器验证 (GET请求) ---
    if request.method == "GET":
        echostr = request.query_params.get("echostr")
        if echostr:
            return PlainTextResponse(content=echostr)
        return PlainTextResponse(content="ok")

    # --- 以下保留原有的 POST 处理逻辑 ---
    body = (await request.body()).decode("utf-8")
    print("DEBUG: 收到微信回调请求")
    content_type = request.headers.get("content-type", "")

    # 服务号扫码事件回调（XML）
    if "xml" in content_type or body.strip().startswith("<xml"):
        try:
            root = ET.fromstring(body)
        except Exception:
            return "success"

        msg_type = (root.findtext("MsgType") or "").strip()
        event = (root.findtext("Event") or "").strip().upper()
        openid = (root.findtext("FromUserName") or "").strip()
        event_key = (root.findtext("EventKey") or "").strip()

        if msg_type == "event" and event in {"SCAN", "SUBSCRIBE"} and event_key:
            scene_id = event_key
            if scene_id.startswith("qrscene_"):
                scene_id = scene_id[8:]

            conn = get_db_conn()
            cur = conn.cursor()
            cur.execute(
                "SELECT scene_id, status FROM login_sessions WHERE scene_id = ?",
                (scene_id,),
            )
            session = cur.fetchone()
            if session and session["status"] != "success":
                cur.execute(
                    """
                    UPDATE login_sessions
                    SET status = 'success', openid = ?
                    WHERE scene_id = ?
                    """,
                    (openid, scene_id),
                )
                cur.execute(
                    """
                    INSERT OR IGNORE INTO users (username, is_vip, expire_at)
                    VALUES (?, 0, '')
                    """,
                    (openid,),
                )
                conn.commit()
            conn.close()
        return "success"

    # 微信支付回调（JSON）
    try:
        validate_wechat_callback_config()
    except RuntimeError as exc:
        print("微信支付回调配置检查失败: {0}".format(str(exc)))
        return JSONResponse(status_code=200, content={"code": "SUCCESS", "message": "配置待补齐，等待查单补偿"})

    if not _verify_wechat_signature(request.headers, body):
        print("微信支付回调验签失败: serial={0}".format(request.headers.get("Wechatpay-Serial")))
        raise HTTPException(status_code=401, detail="微信回调验签失败")

    payload = json.loads(body)
    resource = payload.get("resource", {})
    plain_data = _decrypt_wechat_resource(resource)

    if plain_data.get("trade_state") != "SUCCESS":
        print("微信支付回调非成功状态: out_trade_no={0}, trade_state={1}".format(
            plain_data.get("out_trade_no", ""),
            plain_data.get("trade_state", ""),
        ))
        return JSONResponse(status_code=200, content={"code": "SUCCESS", "message": "成功"})

    out_trade_no = plain_data.get("out_trade_no", "")
    amount_total = plain_data.get("amount", {}).get("total", 0)
    transaction_id = plain_data.get("transaction_id", "")
    success_time = plain_data.get("success_time", "")
    if not out_trade_no:
        raise HTTPException(status_code=400, detail="回调缺少 out_trade_no")

    service_order = _get_service_order(out_trade_no)
    if service_order:
        if Decimal(str(amount_total)) != OPENCLAW_INSTALL_AMOUNT * 100:
            print("OpenClaw 服务订单回调金额不匹配: out_trade_no={0}, amount_total={1}".format(out_trade_no, amount_total))
            raise HTTPException(status_code=400, detail="服务订单金额校验失败")
        paid_at = parse_iso_time(success_time).isoformat()
        result = _mark_service_order_paid(out_trade_no, transaction_id=transaction_id, paid_at=paid_at)
        print("OpenClaw 服务订单回调处理结果: out_trade_no={0}, result={1}".format(
            out_trade_no,
            result.get("message", ""),
        ))
        if not result.get("ok"):
            raise HTTPException(status_code=404, detail="服务订单不存在")
        return JSONResponse(status_code=200, content={"code": "SUCCESS", "message": "成功"})

    if Decimal(str(amount_total)) != FIXED_AMOUNT * 100:
        print("微信支付回调金额不匹配: out_trade_no={0}, amount_total={1}".format(out_trade_no, amount_total))
        raise HTTPException(status_code=400, detail="订单金额校验失败")

    paid_at = parse_iso_time(success_time).isoformat()
    result = _activate_vip_for_paid_order(out_trade_no, transaction_id=transaction_id, paid_at=paid_at)
    print("微信支付回调处理结果: out_trade_no={0}, trade_state=SUCCESS, transaction_id={1}, result={2}".format(
        out_trade_no,
        transaction_id or "-",
        result.get("message", ""),
    ))
    if not result.get("ok"):
        raise HTTPException(status_code=404, detail="订单不存在")
    return JSONResponse(status_code=200, content={"code": "SUCCESS", "message": "成功"})


def _get_order_status_payload(order_id: str) -> dict:
    _sync_order_from_wechat(order_id)
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT status, user_id FROM orders WHERE order_id = ?", (order_id,))
    order = cur.fetchone()
    if not order:
        conn.close()
        raise HTTPException(status_code=404, detail="订单不存在")

    status = str(order["status"] or "pending").lower()
    if status == "success":
        status = "paid"
    vip_active = False
    if order["user_id"]:
        cur.execute("SELECT is_vip FROM users WHERE id = ?", (order["user_id"],))
        user_row = cur.fetchone()
        vip_active = bool(user_row and int(user_row["is_vip"]) == 1)
    conn.close()
    return {
        "status": status,
        "order_id": order_id,
        "vip_active": vip_active,
        "redirect_url": "/dashboard",
    }


@app.get("/api/payment/order-status")
async def payment_order_status(order_id: str):
    return _get_order_status_payload(order_id)


@app.get("/api/v1/payment/status")
async def payment_status(order_id: str):
    payload = _get_order_status_payload(order_id)
    legacy_status = "success" if payload["status"] == "paid" else payload["status"]
    return {
        "status": legacy_status,
        "order_id": order_id,
        "vip_active": payload["vip_active"],
        "redirect_url": payload["redirect_url"],
    }


def _format_openclaw_service_order(row: sqlite3.Row, code_url: str = "") -> dict:
    status = str(row["status"] or "pending").lower()
    service_status = "待预约 / 待远程服务" if status == "paid" else "待支付"
    return {
        "order_id": row["out_trade_no"],
        "product_code": row["product_code"],
        "product_name": row["product_name"],
        "amount": row["amount"],
        "status": status,
        "service_status": service_status,
        "code_url": code_url,
        "paid_at": row["paid_at"] or "",
    }


@app.post(
    "/api/v1/service-orders/openclaw-install/create-payment",
    response_model=ServiceOrderResponse,
)
async def create_openclaw_install_service_payment(token: str = Depends(verify_token_from_header)):
    try:
        validate_wechat_create_config()
    except RuntimeError as exc:
        print("微信支付配置检查失败: {0}".format(str(exc)))
        raise HTTPException(status_code=503, detail="微信支付暂未配置，请联系管理员完成商户配置。") from exc

    user_id = _get_user_id_for_token(token)
    if user_id is None:
        raise HTTPException(status_code=401, detail="登录凭证无效，无法识别用户")

    out_trade_no = make_order_id()
    now = now_utc().isoformat()
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO service_orders (
            user_id, product_code, product_name, amount, status,
            out_trade_no, transaction_id, paid_at, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, 'pending', ?, '', '', ?, ?)
        """,
        (
            user_id,
            OPENCLAW_INSTALL_PRODUCT_CODE,
            OPENCLAW_INSTALL_PRODUCT_NAME,
            f"{OPENCLAW_INSTALL_AMOUNT:.2f}",
            out_trade_no,
            now,
            now,
        ),
    )
    conn.commit()
    cur.execute("SELECT * FROM service_orders WHERE out_trade_no = ?", (out_trade_no,))
    row = cur.fetchone()
    conn.close()

    code_url = _wechat_post_native(
        out_trade_no,
        amount=OPENCLAW_INSTALL_AMOUNT,
        description=OPENCLAW_INSTALL_PRODUCT_NAME,
    )
    return _format_openclaw_service_order(row, code_url=code_url)


@app.get("/api/v1/service-orders/{order_id}", response_model=ServiceOrderResponse)
async def get_service_order(order_id: str, token: str = Depends(verify_token_from_header)):
    user_id = _get_user_id_for_token(token)
    if user_id is None:
        raise HTTPException(status_code=401, detail="登录凭证无效，无法识别用户")

    _sync_service_order_from_wechat(order_id)
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT * FROM service_orders WHERE out_trade_no = ? AND user_id = ?",
        (order_id, user_id),
    )
    row = cur.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="服务订单不存在")
    return _format_openclaw_service_order(row)


@app.post("/api/v1/game-submissions")
async def create_game_submission(
    body: GameSubmissionRequest,
    authorization: Optional[str] = Header(default=None),
):
    contact = _clean_text(body.contact)
    game_type = _clean_text(body.game_type)
    art_style = _clean_text(body.art_style)
    core_gameplay = _clean_text(body.core_gameplay)
    protagonist = _clean_text(body.protagonist)
    scene_setting = _clean_text(body.scene_setting)

    if not contact:
        raise HTTPException(status_code=400, detail="请填写联系方式，方便我们与你确认需求。")

    if not any([game_type, art_style, core_gameplay, protagonist, scene_setting]):
        raise HTTPException(status_code=400, detail="请至少填写游戏类型、画风、核心玩法或角色场景设定。")

    deliverables = []
    for item in body.deliverables:
        value = _clean_text(item)
        if value and value not in deliverables:
            deliverables.append(value)

    now = now_utc().isoformat()
    user_id = _get_optional_user_id_from_authorization(authorization)

    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO game_submissions (
            user_id, game_name, game_type, art_style, protagonist, enemy_boss,
            scene_setting, core_gameplay, deliverables_json, budget_range,
            contact, notes, status, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)
        """,
        (
            user_id,
            _clean_text(body.game_name),
            game_type,
            art_style,
            protagonist,
            _clean_text(body.enemy_boss),
            scene_setting,
            core_gameplay,
            json.dumps(deliverables, ensure_ascii=False),
            _clean_text(body.budget_range),
            contact,
            _clean_text(body.notes),
            now,
            now,
        ),
    )
    submission_id = int(cur.lastrowid)
    conn.commit()
    conn.close()

    return {
        "id": submission_id,
        "status": "new",
        "user_id": user_id,
    }


@app.get("/api/v1/my-game-submissions")
async def get_my_game_submissions(token: str = Depends(verify_token_from_header)):
    user_id = _get_user_id_for_token(token)
    if user_id is None:
        raise HTTPException(status_code=401, detail="登录凭证无效，无法识别用户")

    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT *
        FROM game_submissions
        WHERE user_id = ?
        ORDER BY created_at DESC, id DESC
        """,
        (user_id,),
    )
    rows = cur.fetchall()
    conn.close()

    return {
        "items": [_format_game_submission(row) for row in rows],
    }


@app.post("/api/v1/ai-game-projects")
async def create_ai_game_project(body: AIGameProjectCreateRequest, token: str = Depends(verify_token_from_header)):
    user_id = _get_user_id_for_token(token)
    if user_id is None:
        raise HTTPException(status_code=401, detail="登录凭证无效，无法识别用户")

    idea = _clean_text(body.idea)
    if not idea:
        raise HTTPException(status_code=400, detail="请填写游戏想法")

    input_payload = {
        "idea": idea,
        "game_type": _clean_text(body.game_type),
        "art_style": _clean_text(body.art_style),
        "target_platform": _clean_text(body.target_platform),
    }
    now = now_utc().isoformat()
    provider_config = get_ai_game_provider_config()

    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO ai_game_projects (
            user_id, title, one_sentence_idea, game_type, art_style,
            target_platform, status, created_at, updated_at
        )
        VALUES (?, '', ?, ?, ?, ?, 'generating', ?, ?)
        """,
        (
            user_id,
            idea,
            input_payload["game_type"],
            input_payload["art_style"],
            input_payload["target_platform"],
            now,
            now,
        ),
    )
    project_id = int(cur.lastrowid)
    cur.execute(
        """
        INSERT INTO ai_game_generation_runs (
            project_id, user_id, input_json, output_json, provider,
            model_name, status, error_message, created_at, updated_at
        )
        VALUES (?, ?, ?, '{}', ?, ?, 'running', '', ?, ?)
        """,
        (
            project_id,
            user_id,
            json.dumps(input_payload, ensure_ascii=False),
            provider_config["provider"],
            provider_config["model_name"],
            now,
            now,
        ),
    )
    run_id = int(cur.lastrowid)
    conn.commit()
    conn.close()

    try:
        output = generate_game_world(input_payload)
        title = _clean_text(output.get("title")) or idea[:40]
        finished_at = now_utc().isoformat()
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute(
            """
            UPDATE ai_game_projects
            SET title = ?, status = 'generated', updated_at = ?
            WHERE id = ? AND user_id = ?
            """,
            (title, finished_at, project_id, user_id),
        )
        cur.execute(
            """
            UPDATE ai_game_generation_runs
            SET output_json = ?, status = 'success', error_message = '', updated_at = ?
            WHERE id = ? AND project_id = ? AND user_id = ?
            """,
            (
                json.dumps(output, ensure_ascii=False),
                finished_at,
                run_id,
                project_id,
                user_id,
            ),
        )
        conn.commit()
        cur.execute("SELECT * FROM ai_game_projects WHERE id = ? AND user_id = ?", (project_id, user_id))
        project_row = cur.fetchone()
        cur.execute("SELECT * FROM ai_game_generation_runs WHERE id = ? AND user_id = ?", (run_id, user_id))
        run_row = cur.fetchone()
        conn.close()
    except Exception as exc:
        failed_at = now_utc().isoformat()
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute(
            """
            UPDATE ai_game_projects
            SET status = 'failed', updated_at = ?
            WHERE id = ? AND user_id = ?
            """,
            (failed_at, project_id, user_id),
        )
        cur.execute(
            """
            UPDATE ai_game_generation_runs
            SET status = 'failed', error_message = ?, updated_at = ?
            WHERE id = ? AND project_id = ? AND user_id = ?
            """,
            (str(exc), failed_at, run_id, project_id, user_id),
        )
        conn.commit()
        conn.close()
        raise HTTPException(status_code=500, detail="AI 游戏世界生成失败，请稍后重试") from exc

    return {
        "project": _format_ai_game_project(project_row),
        "run": _format_ai_game_generation_run(run_row),
        "result": output,
    }


@app.get("/api/v1/ai-game-projects")
async def list_ai_game_projects(token: str = Depends(verify_token_from_header)):
    user_id = _get_user_id_for_token(token)
    if user_id is None:
        raise HTTPException(status_code=401, detail="登录凭证无效，无法识别用户")

    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT *
        FROM ai_game_projects
        WHERE user_id = ?
        ORDER BY created_at DESC, id DESC
        """,
        (user_id,),
    )
    rows = cur.fetchall()
    conn.close()
    items = []
    for row in rows:
        project = _format_ai_game_project(row)
        project["asset_counts"] = _get_ai_game_asset_counts(int(row["id"]), user_id)
        items.append(project)
    return {
        "items": items,
    }


@app.get("/api/v1/ai-game-projects/{project_id}")
async def get_ai_game_project(project_id: int, token: str = Depends(verify_token_from_header)):
    user_id = _get_user_id_for_token(token)
    if user_id is None:
        raise HTTPException(status_code=401, detail="登录凭证无效，无法识别用户")

    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM ai_game_projects WHERE id = ? AND user_id = ?", (project_id, user_id))
    project_row = cur.fetchone()
    if not project_row:
        conn.close()
        raise HTTPException(status_code=404, detail="AI 游戏项目不存在")

    cur.execute(
        """
        SELECT *
        FROM ai_game_generation_runs
        WHERE project_id = ? AND user_id = ?
        ORDER BY created_at DESC, id DESC
        LIMIT 1
        """,
        (project_id, user_id),
    )
    run_row = cur.fetchone()
    conn.close()

    formatted_run = _format_ai_game_generation_run(run_row)
    generation_result = formatted_run["output_json"] if formatted_run and formatted_run.get("output_json") else None
    formatted_project = _format_ai_game_project(project_row)
    formatted_project["asset_counts"] = _get_ai_game_asset_counts(project_id, user_id)
    return {
        "project": formatted_project,
        "latest_run": formatted_run,
        "generation_result": generation_result,
    }


@app.post("/api/v1/ai-game-projects/{project_id}/regenerate-section")
async def regenerate_ai_game_project_section(
    project_id: int,
    body: AIGameProjectRegenerateSectionRequest,
    token: str = Depends(verify_token_from_header),
):
    user_id = _get_user_id_for_token(token)
    if user_id is None:
        raise HTTPException(status_code=401, detail="登录凭证无效，无法识别用户")

    section = _clean_text(body.section)
    instruction = _clean_text(body.instruction)
    if section not in ALLOWED_REGENERATE_SECTIONS:
        raise HTTPException(status_code=400, detail="不支持重新生成该模块")

    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM ai_game_projects WHERE id = ? AND user_id = ?", (project_id, user_id))
    project_row = cur.fetchone()
    if not project_row:
        conn.close()
        raise HTTPException(status_code=404, detail="AI 游戏项目不存在")

    cur.execute(
        """
        SELECT *
        FROM ai_game_generation_runs
        WHERE project_id = ? AND user_id = ? AND status = 'success'
        ORDER BY created_at DESC, id DESC
        LIMIT 1
        """,
        (project_id, user_id),
    )
    latest_success_run = cur.fetchone()
    if not latest_success_run:
        conn.close()
        raise HTTPException(status_code=400, detail="当前项目暂无可重新生成的成功结果")

    current_output = _safe_json_loads(latest_success_run["output_json"], {})
    if not isinstance(current_output, dict) or not current_output:
        conn.close()
        raise HTTPException(status_code=400, detail="当前项目生成结果为空，无法重新生成模块")

    original_input = _safe_json_loads(latest_success_run["input_json"], {})
    if not isinstance(original_input, dict) or not original_input.get("idea"):
        original_input = {
            "idea": project_row["one_sentence_idea"] or "",
            "game_type": project_row["game_type"] or "",
            "art_style": project_row["art_style"] or "",
            "target_platform": project_row["target_platform"] or "",
        }

    now = now_utc().isoformat()
    provider_config = get_ai_game_provider_config()
    run_input = {
        "action": "regenerate_section",
        "section": section,
        "instruction": instruction,
        "project_input": original_input,
        "source_run_id": latest_success_run["id"],
    }
    cur.execute(
        """
        INSERT INTO ai_game_generation_runs (
            project_id, user_id, input_json, output_json, provider,
            model_name, status, error_message, created_at, updated_at
        )
        VALUES (?, ?, ?, '{}', ?, ?, 'running', '', ?, ?)
        """,
        (
            project_id,
            user_id,
            json.dumps(run_input, ensure_ascii=False),
            provider_config["provider"],
            provider_config["model_name"],
            now,
            now,
        ),
    )
    run_id = int(cur.lastrowid)
    conn.commit()
    conn.close()

    try:
        updated_output = regenerate_game_world_section(original_input, current_output, section, instruction)
        title = _clean_text(updated_output.get("title")) or project_row["title"] or project_row["one_sentence_idea"][:40]
        finished_at = now_utc().isoformat()
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute(
            """
            UPDATE ai_game_projects
            SET title = ?, status = 'generated', updated_at = ?
            WHERE id = ? AND user_id = ?
            """,
            (title, finished_at, project_id, user_id),
        )
        cur.execute(
            """
            UPDATE ai_game_generation_runs
            SET output_json = ?, status = 'success', error_message = '', updated_at = ?
            WHERE id = ? AND project_id = ? AND user_id = ?
            """,
            (
                json.dumps(updated_output, ensure_ascii=False),
                finished_at,
                run_id,
                project_id,
                user_id,
            ),
        )
        conn.commit()
        cur.execute("SELECT * FROM ai_game_projects WHERE id = ? AND user_id = ?", (project_id, user_id))
        refreshed_project = cur.fetchone()
        cur.execute("SELECT * FROM ai_game_generation_runs WHERE id = ? AND user_id = ?", (run_id, user_id))
        refreshed_run = cur.fetchone()
        conn.close()
    except Exception as exc:
        failed_at = now_utc().isoformat()
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute(
            """
            UPDATE ai_game_generation_runs
            SET status = 'failed', error_message = ?, updated_at = ?
            WHERE id = ? AND project_id = ? AND user_id = ?
            """,
            (str(exc), failed_at, run_id, project_id, user_id),
        )
        cur.execute(
            """
            UPDATE ai_game_projects
            SET status = 'generated', updated_at = ?
            WHERE id = ? AND user_id = ?
            """,
            (failed_at, project_id, user_id),
        )
        conn.commit()
        conn.close()
        raise HTTPException(status_code=500, detail="AI 模块重新生成失败，请稍后重试") from exc

    formatted_run = _format_ai_game_generation_run(refreshed_run)
    formatted_project = _format_ai_game_project(refreshed_project)
    formatted_project["asset_counts"] = _get_ai_game_asset_counts(project_id, user_id)
    return {
        "project": formatted_project,
        "latest_run": formatted_run,
        "generation_result": updated_output,
    }


@app.post("/api/v1/ai-game-projects/{project_id}/plan-assets")
async def plan_ai_game_project_assets(project_id: int, token: str = Depends(verify_token_from_header)):
    user_id = _get_user_id_for_token(token)
    if user_id is None:
        raise HTTPException(status_code=401, detail="登录凭证无效，无法识别用户")

    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM ai_game_projects WHERE id = ? AND user_id = ?", (project_id, user_id))
    project_row = cur.fetchone()
    if not project_row:
        conn.close()
        raise HTTPException(status_code=404, detail="AI 游戏项目不存在")

    cur.execute(
        """
        SELECT *
        FROM ai_game_generation_runs
        WHERE project_id = ? AND user_id = ? AND status = 'success'
        ORDER BY created_at DESC, id DESC
        LIMIT 1
        """,
        (project_id, user_id),
    )
    run_row = cur.fetchone()
    if not run_row:
        conn.close()
        raise HTTPException(status_code=400, detail="当前项目暂无可拆解的成功生成结果")

    output_json = _safe_json_loads(run_row["output_json"], {})
    if not isinstance(output_json, dict) or not output_json:
        conn.close()
        raise HTTPException(status_code=400, detail="当前项目生成结果为空，无法拆解资产任务")

    planned_assets = plan_assets_from_game_world(project_id, user_id, output_json)
    now = now_utc().isoformat()
    created_count = 0
    for asset in planned_assets:
        cur.execute(
            """
            SELECT id
            FROM ai_game_assets
            WHERE project_id = ? AND user_id = ? AND asset_type = ? AND title = ? AND prompt = ?
            LIMIT 1
            """,
            (
                project_id,
                user_id,
                asset["asset_type"],
                asset["title"],
                asset["prompt"],
            ),
        )
        if cur.fetchone():
            continue

        cur.execute(
            """
            INSERT INTO ai_game_assets (
                project_id, user_id, asset_type, title, description, prompt,
                status, result_url, thumbnail_url, metadata_json, admin_note,
                created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, '', '', ?, '', ?, ?)
            """,
            (
                project_id,
                user_id,
                asset["asset_type"],
                asset["title"],
                asset["description"],
                asset["prompt"],
                asset["status"],
                asset["metadata_json"],
                now,
                now,
            ),
        )
        created_count += 1

    conn.commit()
    cur.execute(
        """
        SELECT *
        FROM ai_game_assets
        WHERE project_id = ? AND user_id = ?
        ORDER BY created_at DESC, id DESC
        """,
        (project_id, user_id),
    )
    rows = cur.fetchall()
    conn.close()
    return {
        "items": [_format_ai_game_asset(row) for row in rows],
        "created_count": created_count,
    }


@app.get("/api/v1/ai-game-projects/{project_id}/assets")
async def get_ai_game_project_assets(project_id: int, token: str = Depends(verify_token_from_header)):
    user_id = _get_user_id_for_token(token)
    if user_id is None:
        raise HTTPException(status_code=401, detail="登录凭证无效，无法识别用户")

    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT id FROM ai_game_projects WHERE id = ? AND user_id = ?", (project_id, user_id))
    if not cur.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="AI 游戏项目不存在")

    cur.execute(
        """
        SELECT *
        FROM ai_game_assets
        WHERE project_id = ? AND user_id = ?
        ORDER BY created_at DESC, id DESC
        """,
        (project_id, user_id),
    )
    rows = cur.fetchall()
    conn.close()
    return {
        "items": [_format_ai_game_asset(row) for row in rows],
    }


def _build_ai_game_asset_update(body: AIGameAssetUpdateRequest, admin_update: bool = False) -> tuple[list[str], list[Any]]:
    updates: list[str] = []
    params: list[Any] = []

    text_fields = ["title", "description", "prompt", "result_url", "thumbnail_url"]
    for field in text_fields:
        value = getattr(body, field, None)
        if value is not None:
            updates.append(f"{field} = ?")
            params.append(_clean_text(value))

    if body.status is not None:
        status = _clean_text(body.status)
        if status not in ALLOWED_AI_GAME_ASSET_STATUSES:
            raise HTTPException(status_code=400, detail="无效的资产状态")
        updates.append("status = ?")
        params.append(status)

    if admin_update and isinstance(body, AdminAIGameAssetUpdateRequest):
        if body.admin_note is not None:
            updates.append("admin_note = ?")
            params.append(_clean_text(body.admin_note))
        if body.metadata_json is not None:
            updates.append("metadata_json = ?")
            params.append(json.dumps(body.metadata_json, ensure_ascii=False))

    if not updates:
        raise HTTPException(status_code=400, detail="没有可更新的字段")

    updates.append("updated_at = ?")
    params.append(now_utc().isoformat())
    return updates, params


@app.patch("/api/v1/ai-game-assets/{asset_id}")
async def update_ai_game_asset(
    asset_id: int,
    body: AIGameAssetUpdateRequest,
    token: str = Depends(verify_token_from_header),
):
    user_id = _get_user_id_for_token(token)
    if user_id is None:
        raise HTTPException(status_code=401, detail="登录凭证无效，无法识别用户")

    updates, params = _build_ai_game_asset_update(body, admin_update=False)
    params.extend([asset_id, user_id])

    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT id FROM ai_game_assets WHERE id = ? AND user_id = ?", (asset_id, user_id))
    if not cur.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="资产不存在")

    cur.execute(
        f"UPDATE ai_game_assets SET {', '.join(updates)} WHERE id = ? AND user_id = ?",
        params,
    )
    conn.commit()
    cur.execute("SELECT * FROM ai_game_assets WHERE id = ? AND user_id = ?", (asset_id, user_id))
    row = cur.fetchone()
    conn.close()
    return _format_ai_game_asset(row)


@app.get("/api/v1/admin/ai-game-assets")
async def admin_list_ai_game_assets(
    status: Optional[str] = None,
    project_id: Optional[int] = None,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    _admin: dict = Depends(require_admin_token),
):
    where_clauses = []
    params: list[Any] = []
    normalized_status = _clean_text(status)
    if normalized_status:
        if normalized_status not in ALLOWED_AI_GAME_ASSET_STATUSES:
            raise HTTPException(status_code=400, detail="无效的资产状态")
        where_clauses.append("status = ?")
        params.append(normalized_status)
    if project_id is not None:
        where_clauses.append("project_id = ?")
        params.append(project_id)

    where_sql = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute(f"SELECT COUNT(*) AS total FROM ai_game_assets {where_sql}", params)
    total_row = cur.fetchone()
    total = int(total_row["total"] if total_row else 0)
    cur.execute(
        f"""
        SELECT *
        FROM ai_game_assets
        {where_sql}
        ORDER BY created_at DESC, id DESC
        LIMIT ? OFFSET ?
        """,
        [*params, limit, offset],
    )
    rows = cur.fetchall()
    conn.close()
    return {
        "items": [_format_ai_game_asset(row) for row in rows],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@app.patch("/api/v1/admin/ai-game-assets/{asset_id}")
async def admin_update_ai_game_asset(
    asset_id: int,
    body: AdminAIGameAssetUpdateRequest,
    _admin: dict = Depends(require_admin_token),
):
    updates, params = _build_ai_game_asset_update(body, admin_update=True)
    params.append(asset_id)

    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT id FROM ai_game_assets WHERE id = ?", (asset_id,))
    if not cur.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="资产不存在")

    cur.execute(
        f"UPDATE ai_game_assets SET {', '.join(updates)} WHERE id = ?",
        params,
    )
    conn.commit()
    cur.execute("SELECT * FROM ai_game_assets WHERE id = ?", (asset_id,))
    row = cur.fetchone()
    conn.close()
    return _format_ai_game_asset(row)


@app.get("/api/debug/my-openid")
async def debug_my_openid(token: str = Depends(verify_token_from_header)):
    # TODO: 拿到 openid 后删除。
    identity = _get_token_identity(token)
    openid = str(identity["openid"]).strip() if identity and identity.get("openid") else ""

    if not openid:
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute("SELECT openid FROM tokens WHERE token = ? AND status = 1", (token,))
        token_row = cur.fetchone()
        conn.close()
        openid = str(token_row["openid"]).strip() if token_row and token_row["openid"] else ""

    if not openid:
        raise HTTPException(status_code=404, detail="当前登录用户没有绑定 openid")

    return {"openid": openid}


@app.get("/api/v1/admin/me")
async def admin_me(token: str = Depends(verify_token_from_header)):
    identity = _get_token_identity(token)
    is_admin = bool(identity and ADMIN_OPENIDS and identity["openid"] in ADMIN_OPENIDS)
    return {"is_admin": is_admin}


@app.get("/api/v1/admin/game-submissions")
async def admin_list_game_submissions(
    status: Optional[str] = None,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    _admin: dict = Depends(require_admin_token),
):
    normalized_status = _clean_text(status)
    if normalized_status and normalized_status not in ALLOWED_GAME_SUBMISSION_STATUSES:
        raise HTTPException(status_code=400, detail="无效的需求状态")

    conn = get_db_conn()
    cur = conn.cursor()

    where_sql = ""
    params: list[Any] = []
    if normalized_status:
        where_sql = "WHERE status = ?"
        params.append(normalized_status)

    cur.execute(f"SELECT COUNT(*) AS total FROM game_submissions {where_sql}", params)
    total_row = cur.fetchone()
    total = int(total_row["total"] if total_row else 0)

    cur.execute(
        f"""
        SELECT *
        FROM game_submissions
        {where_sql}
        ORDER BY created_at DESC, id DESC
        LIMIT ? OFFSET ?
        """,
        [*params, limit, offset],
    )
    rows = cur.fetchall()
    conn.close()

    return {
        "items": [_format_game_submission(row) for row in rows],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@app.get("/api/v1/admin/game-submissions/{submission_id}")
async def admin_get_game_submission(
    submission_id: int,
    _admin: dict = Depends(require_admin_token),
):
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM game_submissions WHERE id = ?", (submission_id,))
    row = cur.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="需求不存在")

    return _format_game_submission(row)


@app.patch("/api/v1/admin/game-submissions/{submission_id}")
async def admin_update_game_submission(
    submission_id: int,
    body: AdminGameSubmissionUpdateRequest,
    _admin: dict = Depends(require_admin_token),
):
    updates = []
    params: list[Any] = []

    if body.status is not None:
        status = _clean_text(body.status)
        if status not in ALLOWED_GAME_SUBMISSION_STATUSES:
            raise HTTPException(status_code=400, detail="无效的需求状态")
        updates.append("status = ?")
        params.append(status)

    if body.admin_note is not None:
        updates.append("admin_note = ?")
        params.append(_clean_text(body.admin_note))

    if not updates:
        raise HTTPException(status_code=400, detail="没有可更新的字段")

    updates.append("updated_at = ?")
    params.append(now_utc().isoformat())
    params.append(submission_id)

    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT id FROM game_submissions WHERE id = ?", (submission_id,))
    if not cur.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="需求不存在")

    cur.execute(
        f"UPDATE game_submissions SET {', '.join(updates)} WHERE id = ?",
        params,
    )
    conn.commit()
    cur.execute("SELECT * FROM game_submissions WHERE id = ?", (submission_id,))
    row = cur.fetchone()
    conn.close()

    return _format_game_submission(row)


@app.post("/api/v1/tools")
async def dispatch_tool(body: ToolsDispatchRequest):
    if body.tool_id == "script_generator":
        return generate_scripts(body.payload)
    if body.tool_id == "video_storyboard":
        return generate_storyboard(body.payload)
    raise HTTPException(status_code=404, detail="未找到该工具")


def _get_user_info_payload(token: str) -> dict:
    conn = get_db_conn()
    cur = conn.cursor()

    cur.execute("SELECT openid FROM tokens WHERE token = ?", (token,))
    token_row = cur.fetchone()
    if not token_row or not token_row["openid"]:
        conn.close()
        raise HTTPException(status_code=401, detail="登录凭证无效")

    openid = token_row["openid"]

    cur.execute("SELECT id, username, is_vip, expire_at FROM users WHERE username = ?", (openid,))
    user_row = cur.fetchone()
    conn.close()

    if not user_row:
        raise HTTPException(status_code=404, detail="找不到用户信息")

    return {
        "user_id": user_row["id"],
        "username": f"AI创作者_{str(user_row['id']).zfill(4)}",
        "is_vip": int(user_row["is_vip"]),
        "expire_at": user_row["expire_at"],
    }


@app.get("/api/v1/user/info")
async def get_user_info(response: Response, token: str = Depends(verify_token_from_header)):
    response.headers["Cache-Control"] = "no-store"
    return _get_user_info_payload(token)


@app.get("/api/me")
async def get_me(response: Response, authorization: Optional[str] = Header(default=None)):
    response.headers["Cache-Control"] = "no-store"
    response.headers["Pragma"] = "no-cache"

    if not authorization:
        return {"is_logged_in": False, "user": None}

    parts = authorization.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer" or not parts[1].strip():
        return {"is_logged_in": False, "user": None}

    token = parts[1].strip()
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT expire_date, status FROM tokens WHERE token = ?", (token,))
    row = cur.fetchone()
    conn.close()
    if not row or int(row["status"]) != 1 or now_utc() >= parse_iso_time(row["expire_date"]):
        return {"is_logged_in": False, "user": None}

    user = _get_user_info_payload(token)
    return {"is_logged_in": True, "user": user, **user}


@app.get("/health")
async def health():
    return {"status": "ok"}
