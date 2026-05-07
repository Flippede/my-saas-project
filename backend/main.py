from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from tools.script_generator import generate_scripts
from tools.video_storyboard import generate_storyboard

app = FastAPI(title="AI Tools Backend MVP", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ToolsRequest(BaseModel):
    tool_id: str
    payload: dict


@app.post("/api/v1/tools")
def dispatch_tool(request: ToolsRequest):
    if request.tool_id == "script_generator":
        return generate_scripts(request.payload)
    if request.tool_id == "video_storyboard":
        return generate_storyboard(request.payload)
    raise HTTPException(status_code=404, detail="未找到该工具")


@app.post("/api/v1/ping")
def ping_probe():
    print("\n=======================================")
    print("🔥 架构师探针触发：后端成功接收到前端请求！")
    print("=======================================\n")
    return {"status": "success", "msg": "pong - 连通性测试通过"}


@app.get("/health")
async def health_check():
    return {"status": "ok"}
