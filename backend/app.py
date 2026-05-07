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
from typing import Any, Optional
from urllib import error as urlerror
from urllib import parse as urlparse
from urllib import request as urlrequest

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse
from pydantic import BaseModel, Field

from tools.script_generator import generate_scripts
from tools.video_storyboard import generate_storyboard

def _read_env(name: str, default: str = "") -> str:
    return os.getenv(name, default).strip()


def _parse_cors_origins() -> list[str]:
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
FIXED_AMOUNT = Decimal(_read_env("FIXED_AMOUNT", "49.00"))
WECHAT_API_BASE = _read_env("WECHAT_API_BASE", "https://api.mch.weixin.qq.com")
WECHAT_NOTIFY_URL = _read_env("WECHAT_NOTIFY_URL", "https://x-creator.cc/api/v1/wechat/webhook")

# 微信支付 V3 配置（占位）
WECHAT_APPID = _read_env("WECHAT_APPID")
WECHAT_MCHID = _read_env("WECHAT_MCHID")
WECHAT_V3_KEY = _read_env("WECHAT_V3_KEY")
WECHAT_CERT_SERIAL_NO = _read_env("WECHAT_CERT_SERIAL_NO")
WECHAT_MP_APPID = _read_env("WECHAT_MP_APPID", WECHAT_APPID)
WECHAT_MP_APPSECRET = _read_env("WECHAT_MP_APPSECRET")
WECHAT_PRIVATE_KEY = _read_env("WECHAT_PRIVATE_KEY")
WECHAT_PLATFORM_PUBLIC_KEY = _read_env("WECHAT_PLATFORM_PUBLIC_KEY")


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


def validate_wechat_config() -> None:
    required_values = {
        "WECHAT_APPID": WECHAT_APPID,
        "WECHAT_MCHID": WECHAT_MCHID,
        "WECHAT_V3_KEY": WECHAT_V3_KEY,
        "WECHAT_CERT_SERIAL_NO": WECHAT_CERT_SERIAL_NO,
        "WECHAT_PRIVATE_KEY": WECHAT_PRIVATE_KEY,
        "WECHAT_PLATFORM_PUBLIC_KEY": WECHAT_PLATFORM_PUBLIC_KEY,
    }

    for key, value in required_values.items():
        text = str(value).strip()
        if not text:
            raise RuntimeError(f"{key} 未配置")
        if "YOUR_" in text or "这里填入" in text:
            raise RuntimeError(f"{key} 仍为占位值，请替换为真实配置")

    if len(WECHAT_V3_KEY) != 32:
        raise RuntimeError("WECHAT_V3_KEY 长度必须为 32 字符")
    if "BEGIN PRIVATE KEY" not in WECHAT_PRIVATE_KEY:
        raise RuntimeError("WECHAT_PRIVATE_KEY 格式不正确")
    if "BEGIN PUBLIC KEY" not in WECHAT_PLATFORM_PUBLIC_KEY:
        raise RuntimeError("WECHAT_PLATFORM_PUBLIC_KEY 格式不正确")


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


def _wechat_post_native(out_trade_no: str) -> str:
    url_path = "/v3/pay/transactions/native"
    amount_obj = {"total": int(FIXED_AMOUNT * 100), "currency": "CNY"}
    body_dict = {
        "appid": WECHAT_APPID,
        "mchid": WECHAT_MCHID,
        "description": "AI Storyboard X - 30天订阅",
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
    expected_total = int(FIXED_AMOUNT * 100)
    if body_dict["amount"].get("total") != expected_total or body_dict["amount"].get("currency") != "CNY":
        raise HTTPException(
            status_code=500,
            detail="amount 格式错误，当前配置金额应为 total={0}, currency='CNY'".format(expected_total),
        )

    body = json.dumps(body_dict, ensure_ascii=False, separators=(",", ":"))
    auth = _build_wechat_authorization("POST", url_path, body)
    print("WeChat V3 Authorization:", auth)

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
        print("请求微信接口失败: {0}".format(e))
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


class LoginQRCodeResponse(BaseModel):
    scene_id: str
    qrcode_url: str
    expires_in: int


class ToolsDispatchRequest(BaseModel):
    tool_id: str
    payload: dict = Field(default_factory=dict)


@app.get("/api/v1/auth/get_login_qrcode", response_model=LoginQRCodeResponse)
async def get_login_qrcode():
    print("DEBUG: 正在请求微信登录二维码...")
    scene_id = str(uuid.uuid4())[:8]

    validate_wechat_login_config()
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
    print(f"DEBUG: 收到请求 - 路径: {request.url.path} | Authorization头: {auth_header}")
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


@app.post("/api/v1/payment/create", response_model=PaymentCreateResponse)
async def create_payment(request: Request, token: str = Depends(verify_token_from_header)):
    try:
        data = await request.json()
    except Exception:
        data = {}
    # print("DEBUG: 收到支付请求原始数据: {}".format(data))
    validate_wechat_config()

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
    cur.execute(
        """
        INSERT INTO orders (order_id, user_id, amount, status, created_at)
        VALUES (?, ?, ?, 'pending', ?)
        """,
        (out_trade_no, resolved_user_id, f"{FIXED_AMOUNT:.2f}", now_utc().isoformat()),
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
    print(f"DEBUG: 收到微信回调请求体: {body[:100]}...")
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
    validate_wechat_config()
    if not _verify_wechat_signature(request.headers, body):
        print(f"DEBUG: 验签失败！Header中的序列号为: {request.headers.get('Wechatpay-Serial')}")
        raise HTTPException(status_code=401, detail="微信回调验签失败")

    payload = json.loads(body)
    resource = payload.get("resource", {})
    plain_data = _decrypt_wechat_resource(resource)

    if plain_data.get("trade_state") != "SUCCESS":
        return JSONResponse(status_code=200, content={"code": "SUCCESS", "message": "成功"})

    out_trade_no = plain_data.get("out_trade_no", "")
    amount_total = plain_data.get("amount", {}).get("total", 0)
    openid = plain_data.get("payer", {}).get("openid", "")
    if not out_trade_no:
        raise HTTPException(status_code=400, detail="回调缺少 out_trade_no")
    if Decimal(str(amount_total)) != FIXED_AMOUNT * 100:
        raise HTTPException(status_code=400, detail="订单金额校验失败")

    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT status, user_id FROM orders WHERE order_id = ?", (out_trade_no,))
    order = cur.fetchone()
    if not order:
        conn.close()
        raise HTTPException(status_code=404, detail="订单不存在")

    if order["status"] != "success":
        token = f"XCC_{uuid.uuid4().hex}"
        expire_date = (now_utc() + timedelta(days=30)).isoformat()
        user_id = order["user_id"]
        cur.execute("UPDATE orders SET status = 'success' WHERE order_id = ?", (out_trade_no,))
        cur.execute(
            """
            INSERT OR REPLACE INTO tokens (token, order_id, openid, expire_date, status)
            VALUES (?, ?, ?, ?, 1)
            """,
            (token, out_trade_no, openid, expire_date),
        )
        if user_id:
            cur.execute(
                """
                UPDATE users
                SET is_vip = 1, expire_at = ?
                WHERE id = ?
                """,
                (expire_date, user_id),
            )
        conn.commit()
        print(f"🔥 订单 {out_trade_no} 自动支付成功，已生成 Token")
    conn.close()
    return JSONResponse(status_code=200, content={"code": "SUCCESS", "message": "成功"})


@app.get("/api/v1/payment/status")
async def payment_status(order_id: str):
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT status FROM orders WHERE order_id = ?", (order_id,))
    order = cur.fetchone()
    if not order:
        conn.close()
        raise HTTPException(status_code=404, detail="订单不存在")

    if order["status"] != "success":
        conn.close()
        return {"status": "pending", "order_id": order_id}

    cur.execute(
        "SELECT token FROM tokens WHERE order_id = ? AND status = 1 LIMIT 1",
        (order_id,),
    )
    token_row = cur.fetchone()
    conn.close()
    return {"status": "success", "order_id": order_id, "token": token_row["token"] if token_row else None}


@app.post("/api/v1/tools")
async def dispatch_tool(body: ToolsDispatchRequest):
    if body.tool_id == "script_generator":
        return generate_scripts(body.payload)
    if body.tool_id == "video_storyboard":
        return generate_storyboard(body.payload)
    raise HTTPException(status_code=404, detail="未找到该工具")


@app.get("/api/v1/user/info")
async def get_user_info(token: str = Depends(verify_token_from_header)):
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


@app.get("/health")
async def health():
    return {"status": "ok"}
