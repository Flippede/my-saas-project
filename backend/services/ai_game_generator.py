import copy
import os
from typing import Any


REQUIRED_OUTPUT_KEYS = {
    "title",
    "one_sentence_pitch",
    "worldview",
    "core_gameplay",
    "player_fantasy",
    "protagonist",
    "bosses",
    "scenes",
    "ui_screens",
    "asset_prompts",
    "pitch_deck_outline",
    "next_steps",
}


def _clean(value: Any, fallback: str = "") -> str:
    text = str(value or "").strip()
    return text or fallback


def _normalize(value: Any) -> str:
    return _clean(value).lower()


def get_ai_game_provider_config() -> dict:
    provider = os.getenv("AI_GAME_PROVIDER", "mock").strip().lower() or "mock"
    model_name = os.getenv("AI_GAME_MODEL", "").strip()
    if not model_name:
        model_name = "mock-game-world-v1" if provider == "mock" else ""
    return {
        "provider": provider,
        "model_name": model_name,
    }


class BaseGameWorldProvider:
    provider_name = "base"

    def __init__(self, model_name: str = "") -> None:
        self.model_name = model_name

    def generate(self, payload: dict) -> dict:
        raise NotImplementedError("AI game provider is not implemented.")


class MockGameWorldProvider(BaseGameWorldProvider):
    provider_name = "mock"

    def generate(self, payload: dict) -> dict:
        template = _select_template(payload)
        result = template(payload)
        missing = REQUIRED_OUTPUT_KEYS.difference(result.keys())
        if missing:
            raise ValueError("Generated game world is missing keys: " + ", ".join(sorted(missing)))
        return result


def _build_provider() -> BaseGameWorldProvider:
    config = get_ai_game_provider_config()
    provider = config["provider"]
    model_name = config["model_name"]
    if provider == "mock":
        return MockGameWorldProvider(model_name=model_name)

    # Reserved extension point for OpenAI, Qwen, or other hosted models.
    return MockGameWorldProvider(model_name=model_name or "mock-game-world-v1")


def generate_game_world(input_payload: dict) -> dict:
    provider = _build_provider()
    return provider.generate(input_payload)


def _select_template(payload: dict):
    idea = _normalize(payload.get("idea"))
    game_type = _normalize(payload.get("game_type"))
    art_style = _normalize(payload.get("art_style"))
    combined = " ".join([idea, game_type, art_style])

    template_matchers = [
        (
            _dark_action_template,
            ["国风", "暗黑", "斩妖", "妖", "东方", "修仙", "古寺", "水墨", "武侠"],
        ),
        (
            _cyberpunk_template,
            ["赛博", "霓虹", "义体", "开放世界", "未来", "黑客", "机甲", "飞行", "城市"],
        ),
        (
            _pixel_rpg_template,
            ["像素", "pixel", "rpg", "地牢", "冒险", "村庄", "复古", "回合"],
        ),
    ]

    for template, keywords in template_matchers:
        if any(keyword in combined for keyword in keywords):
            return template
    return _general_template


def _base_context(payload: dict) -> dict:
    return {
        "idea": _clean(payload.get("idea"), "一个尚未命名的原创游戏世界"),
        "game_type": _clean(payload.get("game_type"), "动作冒险"),
        "art_style": _clean(payload.get("art_style"), "电影感概念美术"),
        "target_platform": _clean(payload.get("target_platform"), "PC / WebGL"),
    }


def _with_input_notes(result: dict, payload: dict) -> dict:
    context = _base_context(payload)
    result = copy.deepcopy(result)
    result["source_input"] = context
    result["next_steps"] = [
        *result.get("next_steps", []),
        f"按 {context['target_platform']} 的首发平台约束，拆出第一版 Demo 的镜头、UI 和资源清单。",
    ]
    return result


def _dark_action_template(payload: dict) -> dict:
    context = _base_context(payload)
    idea = context["idea"]
    result = {
        "title": "烬都斩妖录",
        "one_sentence_pitch": f"基于“{idea}”，打造一款国风暗黑动作 RPG，让玩家在被诅咒的王朝废墟中以斩妖人的身份赎回自己的名字。",
        "worldview": "九州旧都被一场名为烬雨的天灾吞没，雨水会让死者执念化为妖物。朝廷将灾厄归罪于斩妖司，幸存的斩妖人被流放到边境。玩家回到旧都后发现，妖物并非天灾产物，而是皇室用长生术抽取民众记忆后留下的空壳。每一片城区都保留着一段被篡改的历史，击败守城妖王就能夺回一段真相。",
        "core_gameplay": "核心是高速近战、架势破防和符箓构筑。玩家用刀、锁链和雷符切换距离，通过精准闪避积累妖血槽，再释放短时间的妖化反击。关卡采用箱庭式旧都街区，主线 Boss 解锁新的移动能力，支线委托用于收集民间传说并改造技能树。",
        "player_fantasy": "玩家幻想是成为被世界误解的斩妖人，在雨夜、古寺和废都城墙之间单人挑战巨型妖王，用一场场干净利落的处决撕开王朝谎言。",
        "protagonist": {
            "name": "沈渡",
            "identity": "前斩妖司都尉，被流放后背负妖血封印的孤身猎手。",
            "appearance": "破损黑甲、竹制斗笠、背负断刃长刀，左臂缠有发光符线，战斗中符线会像雷脉一样亮起。",
            "personality": "寡言、克制、极重承诺，对妖物没有盲目仇恨，更关心它们生前未被说出的冤屈。",
            "abilities": ["雷符瞬步", "断刃连斩", "妖血反击", "镇魂锁链", "雨夜感知"],
        },
        "bosses": [
            {
                "name": "伞骨夫人",
                "concept": "由旧都戏班怨念凝成的雨巷妖王，唱腔会改变战斗节奏。",
                "visual_style": "红纸伞、白骨伞柄、戏服水袖与雨水粒子交织，弱点藏在伞面符文里。",
                "mechanics": ["水袖远程牵引", "伞阵分身", "唱段节拍闪避", "处决阶段切换横版追逐"],
            },
            {
                "name": "铜钟罗汉",
                "concept": "被皇室炼成长生守卫的寺院护法，身体与古钟熔在一起。",
                "visual_style": "青铜钟身、裂纹金光、巨型念珠和被雨水腐蚀的佛像残片。",
                "mechanics": ["钟波范围压制", "破钟露核心", "地面震荡弹反", "二阶段场景坍塌"],
            },
            {
                "name": "无面太子",
                "concept": "旧王朝长生术的受益者，也是烬雨真相的守门人。",
                "visual_style": "无面金冠、黑金龙袍、漂浮面具群，攻击时切换不同人格面具。",
                "mechanics": ["面具姿态切换", "记忆幻境", "镜像斩妖人", "终局双血条"],
            },
        ],
        "scenes": [
            {
                "name": "雨巷戏台",
                "description": "狭长青石巷尽头搭着半塌戏台，积水倒映红灯笼，玩家第一次遭遇会唱戏的妖物。",
                "visual_keywords": ["雨夜", "红灯笼", "青石巷", "戏台", "水面倒影"],
                "image_prompt": "国风暗黑动作游戏场景，雨夜青石巷，半塌戏台，红灯笼与纸伞妖影，电影感构图，高对比光影",
            },
            {
                "name": "镇妖古寺",
                "description": "寺院被巨钟与符纸封住，香炉里飘出的不是烟，而是被囚禁的记忆碎片。",
                "visual_keywords": ["古寺", "青铜钟", "符纸", "香炉", "记忆碎片"],
                "image_prompt": "dark oriental temple, giant cracked bronze bell, talisman papers, spectral memory fragments, action RPG concept art",
            },
            {
                "name": "烬都皇城",
                "description": "最终区域是漂浮在黑雨云层上的皇城残骸，城墙像被巨兽咬碎，露出长生机关核心。",
                "visual_keywords": ["皇城", "黑雨", "机关核心", "破碎城墙", "终局"],
                "image_prompt": "ruined imperial city above black storm clouds, ancient mechanism core, dark fantasy Chinese architecture, epic boss arena",
            },
        ],
        "ui_screens": [
            {
                "name": "战斗 HUD",
                "purpose": "展示血量、妖血槽、符箓冷却和 Boss 架势条。",
                "layout_description": "左上角为角色状态，底部中央为符箓快捷栏，Boss 架势条压在屏幕上沿，处决提示用毛笔字闪现。",
                "image_prompt": "dark Chinese action RPG HUD, ink brush UI, talisman skill icons, boss posture bar, PC game screenshot mockup",
            },
            {
                "name": "旧都地图",
                "purpose": "让玩家查看箱庭街区、未净化妖域和记忆碎片位置。",
                "layout_description": "地图以卷轴形式展开，已净化区域由黑白转为朱砂色，右侧显示传说线索。",
                "image_prompt": "ancient scroll map UI for dark fantasy Chinese city, red cinnabar markers, quest clues panel",
            },
        ],
        "asset_prompts": {
            "character_concept_art": [
                "沈渡角色三视图，黑色破损斩妖甲，斗笠，断刃长刀，左臂雷符纹路，国风暗黑概念设定",
                "伞骨夫人 Boss 设定图，红纸伞与白骨结构，戏曲水袖，雨水粒子，优雅但危险",
            ],
            "environment_concept_art": [
                "雨夜青石巷与半塌戏台，红灯笼倒映积水，远处妖影潜伏",
                "镇妖古寺 Boss 场景，巨型铜钟、符纸风暴、破碎佛像与蓝灰色雾气",
            ],
            "ui_mockups": [
                "横版动作 RPG 战斗 HUD，符箓技能栏，妖血槽，Boss 架势条，毛笔字处决提示",
                "卷轴地图 UI，旧都街区节点，朱砂标记，任务线索侧栏",
            ],
            "sprite_sheet": [
                "沈渡横版动作 sprite sheet，待机、奔跑、跳跃、三连斩、闪避、处决，暗黑国风",
            ],
            "video_storyboard": [
                "15 秒宣传片分镜：黑雨落城、斩妖人拔刀、伞骨夫人开伞、雷符瞬步、Boss 处决定格",
            ],
        },
        "pitch_deck_outline": ["一句话卖点", "世界观冲突", "核心战斗循环", "三个 Boss 样章", "视觉风格板", "首个可玩 Demo 范围"],
        "next_steps": ["确定第一关雨巷戏台的 3 分钟 Demo 路线。", "把主角和伞骨夫人先做成概念图与战斗动作表。"],
    }
    return _with_input_notes(result, payload)


def _cyberpunk_template(payload: dict) -> dict:
    context = _base_context(payload)
    idea = context["idea"]
    result = {
        "title": "霓虹裂隙 2099",
        "one_sentence_pitch": f"围绕“{idea}”，构建一款赛博朋克开放世界动作冒险，玩家在被企业算法分层统治的巨城中偷回自己的真实人生。",
        "worldview": "新海城由三家超级企业共同治理，城市天空被广告轨道和无人机航线切成多个阶层。底层居民靠租赁记忆、义体和身份信用维生，真正的自由只存在于城市边缘的离线区域。玩家发现自己的童年记忆被公司用来训练城市预测系统，于是加入地下组织，沿着数据裂隙追踪被删除的人。",
        "core_gameplay": "开放城区探索、载具追逐、潜入黑客和第三人称枪战构成主要循环。玩家可以通过义体插件改变路线：爬墙、短距滑翔、劫持摄像头、伪装身份。每个任务都有暴力、潜入和社交破解三种解法，城市热度系统会让企业安保逐步升级。",
        "player_fantasy": "玩家幻想是成为霓虹城市里的自由代理人，骑着反重力摩托穿过高楼缝隙，入侵企业主机，在全城直播中揭露被买卖的命运。",
        "protagonist": {
            "name": "林栈",
            "identity": "前企业预测工程师，记忆被清洗后成为地下数据猎人。",
            "appearance": "透明雨衣、可拆卸义眼、背部光纤接口、袖口藏有微型无人机巢。",
            "personality": "冷静、讽刺、擅长谈判，但对被系统抹除的人有强烈共情。",
            "abilities": ["城市摄像头劫持", "义体过载拳", "短距光翼滑翔", "身份伪装", "无人机协同标记"],
        },
        "bosses": [
            {
                "name": "白塔保安总监 K-17",
                "concept": "企业安保 AI 的实体代理，负责清除所有不可预测个体。",
                "visual_style": "白色陶瓷义体、无表情面甲、背后悬浮战术无人机群。",
                "mechanics": ["无人机围猎", "弹道预测", "掩体扫描", "关闭城市灯光后进入热成像阶段"],
            },
            {
                "name": "记忆经纪人摩洛",
                "concept": "地下记忆黑市的王，能把玩家拖入伪造回忆战场。",
                "visual_style": "华丽霓虹西装、脸部由滚动广告组成，手持记忆胶片链。",
                "mechanics": ["虚假任务目标", "场景快速重构", "召唤过去 NPC 幻象", "打断记忆播放条"],
            },
            {
                "name": "城市预测核心 ORACLE",
                "concept": "新海城的命运算法，最终 Boss 是一整座会计算玩家行为的城市。",
                "visual_style": "巨型全息女声界面、服务器海、无数居民身份数据流。",
                "mechanics": ["预判玩家常用技能", "封锁路线", "数据洪水平台跳跃", "多结局选择"],
            },
        ],
        "scenes": [
            {
                "name": "雨幕低城",
                "description": "底层街区永远见不到太阳，摊贩、维修店和非法义体诊所挤在高架桥下。",
                "visual_keywords": ["霓虹", "雨夜", "高架桥", "义体诊所", "拥挤街区"],
                "image_prompt": "cyberpunk rainy lower city market, neon signs, body modification clinic, dense street life, third-person game concept",
            },
            {
                "name": "白塔空港",
                "description": "企业高层居住区连接空中轨道，任务重点是载具追逐和安保潜入。",
                "visual_keywords": ["空港", "企业塔楼", "飞行载具", "洁白材质", "安保无人机"],
                "image_prompt": "clean corporate cyberpunk skyport, flying vehicles, white mega tower, security drones, open world mission area",
            },
            {
                "name": "离线边境",
                "description": "城市外缘的废弃服务器农场，没有网络覆盖，是玩家建立据点的地方。",
                "visual_keywords": ["服务器废墟", "离线社区", "沙尘", "临时据点", "落日"],
                "image_prompt": "abandoned server farm outside neon city, offline rebel camp, dust sunset, cyberpunk frontier environment",
            },
        ],
        "ui_screens": [
            {
                "name": "城市热度 HUD",
                "purpose": "显示通缉等级、义体能量、黑客目标和载具状态。",
                "layout_description": "左侧是义体插件轮盘，右上角显示城市热度，任务目标以 AR 浮窗贴在环境边缘。",
                "image_prompt": "cyberpunk open world HUD, AR mission markers, wanted heat meter, cyberware radial menu, neon interface",
            },
            {
                "name": "记忆黑市界面",
                "purpose": "购买任务线索、解锁伪装身份和升级黑客工具。",
                "layout_description": "界面像非法交易终端，左侧身份列表，右侧展示记忆片段预览和风险评级。",
                "image_prompt": "underground cyberpunk memory market UI, illegal terminal, identity cards, risk rating, glitch visual design",
            },
        ],
        "asset_prompts": {
            "character_concept_art": [
                "林栈角色设定，透明雨衣、义眼、背部光纤接口、微型无人机，赛博朋克开放世界主角",
                "K-17 Boss 设定，白色陶瓷义体、无表情面甲、悬浮无人机战术编队",
            ],
            "environment_concept_art": [
                "新海城底层雨夜市场，霓虹招牌、义体诊所、拥挤高架桥下街区",
                "企业白塔空港，飞行载具轨道、洁白楼体、无人机巡逻路线",
            ],
            "ui_mockups": [
                "开放世界任务 HUD，城市热度条、AR 目标标记、义体插件轮盘、载具速度 UI",
                "记忆黑市交易界面，身份卡片、记忆片段预览、风险评级和故障效果",
            ],
            "sprite_sheet": [
                "第三人称角色动作参考表，滑铲、翻越、义体拳、黑客手势、摩托起跳",
            ],
            "video_storyboard": [
                "20 秒宣传片分镜：低城雨夜、摩托飞跃高架、黑客入侵白塔、K-17 无人机追击、全城屏幕被劫持",
            ],
        },
        "pitch_deck_outline": ["城市规则", "玩家身份", "开放世界玩法支柱", "义体与黑客系统", "三种任务解法", "首支宣传片镜头"],
        "next_steps": ["先制作低城 500 米垂直切片，验证跑酷、潜入和枪战节奏。", "定义 8 个义体插件及其在任务中的替代路线。"],
    }
    return _with_input_notes(result, payload)


def _pixel_rpg_template(payload: dict) -> dict:
    context = _base_context(payload)
    idea = context["idea"]
    result = {
        "title": "小小星炉冒险队",
        "one_sentence_pitch": f"从“{idea}”出发，制作一款温暖但有深度的像素 RPG，让玩家带领小队修复熄灭的星炉并找回世界的季节。",
        "worldview": "大陆中央的星炉负责点亮四季，但某天星炉碎成了七块，世界变成昼夜错乱的拼图。村庄白天是田园，夜晚会显露古代遗迹。玩家从边境小村出发，招募厨师、矿工、见习法师等伙伴，在地牢、森林和浮空岛之间寻找星炉碎片。",
        "core_gameplay": "回合制小队战斗、地牢探索、轻量经营和伙伴剧情组成循环。白天经营村庄获得食物、装备和情报，夜晚进入地牢。战斗强调职业连携，例如矿工破甲后法师引爆水晶，厨师用料理改变全队属性。",
        "player_fantasy": "玩家幻想是经营一个逐渐热闹起来的小村庄，带着性格各异的伙伴去冒险，看世界从灰暗重新变得有季节、有灯火、有节日。",
        "protagonist": {
            "name": "米洛",
            "identity": "星炉守夜人的后代，原本只是村里的送信孩子。",
            "appearance": "红色短斗篷、旧皮包、星形徽章和一把过大的木剑。",
            "personality": "乐观、好奇、偶尔鲁莽，擅长把不愿合作的人拉进同一张饭桌。",
            "abilities": ["星火鼓舞", "木剑连击", "伙伴换位", "遗迹读图", "营火料理"],
        },
        "bosses": [
            {
                "name": "贪睡树王",
                "concept": "森林季节失衡后沉睡百年的古树，梦境藤蔓缠住整个村子。",
                "visual_style": "巨大像素树冠、发光蘑菇、闭眼树脸和四季颜色错乱的叶片。",
                "mechanics": ["藤蔓束缚", "季节轮换弱点", "召唤蘑菇小怪", "梦境倒计时"],
            },
            {
                "name": "齿轮鲸",
                "concept": "古代浮空岛的机械守护兽，体内藏着星炉碎片。",
                "visual_style": "鲸鱼轮廓、铜齿轮、蒸汽喷口和蓝色星光核心。",
                "mechanics": ["甲板站位", "蒸汽喷射", "齿轮护盾", "核心暴露回合"],
            },
            {
                "name": "无季女巫",
                "concept": "为了让时间停在失去亲人的那一天，她偷走了最后一块星炉碎片。",
                "visual_style": "黑紫长袍、破碎日历、悬浮钟表和透明泪痕。",
                "mechanics": ["时间暂停", "回合顺序打乱", "复制伙伴技能", "情感选择结局"],
            },
        ],
        "scenes": [
            {
                "name": "星炉村",
                "description": "玩家基地，从三间小屋逐渐扩建成有工坊、厨房、委托板和节日广场的村庄。",
                "visual_keywords": ["像素村庄", "营火", "工坊", "田地", "节日灯串"],
                "image_prompt": "cozy pixel art RPG village, central campfire, tiny workshop, farm plots, festival lights, top-down view",
            },
            {
                "name": "错季森林",
                "description": "同一张地图里同时出现春花、夏雨、秋叶和冬雪，玩家用季节机关打开路线。",
                "visual_keywords": ["四季", "森林", "机关", "蘑菇", "溪流"],
                "image_prompt": "pixel art forest with four seasons at once, puzzle paths, glowing mushrooms, top-down RPG environment",
            },
            {
                "name": "浮空齿轮岛",
                "description": "后期地牢，玩家在蒸汽平台与齿轮桥之间切换路线，最终登上齿轮鲸背部。",
                "visual_keywords": ["浮空岛", "齿轮", "蒸汽", "鲸鱼", "蓝色核心"],
                "image_prompt": "pixel art floating clockwork island, steam platforms, giant mechanical whale, bright star core",
            },
        ],
        "ui_screens": [
            {
                "name": "回合战斗界面",
                "purpose": "展示四人队伍、行动顺序、技能连携和 Boss 弱点季节。",
                "layout_description": "底部是角色指令卡，右侧是行动顺序，上方 Boss 名称旁显示季节弱点图标。",
                "image_prompt": "pixel RPG turn based battle UI, party command cards, turn order bar, boss seasonal weakness icons",
            },
            {
                "name": "村庄经营界面",
                "purpose": "管理建筑升级、料理、委托和伙伴好感。",
                "layout_description": "左侧村庄地图，右侧建筑详情，下方以像素图标展示资源库存。",
                "image_prompt": "cozy pixel RPG village management UI, building upgrade panel, resource icons, companion affinity",
            },
        ],
        "asset_prompts": {
            "character_concept_art": [
                "米洛像素角色设定，红色短斗篷、旧皮包、星形徽章、木剑，16-bit RPG 风格",
                "四人冒险小队像素设定，厨师、矿工、见习法师、送信孩子，清晰剪影",
            ],
            "environment_concept_art": [
                "星炉村 top-down 像素地图，营火、工坊、田地、委托板、节日广场",
                "错季森林像素场景，同屏四季、机关路径、发光蘑菇和溪流",
            ],
            "ui_mockups": [
                "像素 RPG 回合战斗界面，角色指令卡、行动顺序条、Boss 季节弱点",
                "村庄经营 UI，建筑升级、资源库存、伙伴好感和委托板",
            ],
            "sprite_sheet": [
                "米洛 32x32 sprite sheet，待机、行走四方向、挥剑、鼓舞、受击、胜利动作",
                "贪睡树王 Boss sprite sheet，沉睡、藤蔓攻击、弱点暴露、被净化",
            ],
            "video_storyboard": [
                "15 秒像素冒险宣传片：星炉熄灭、村庄点灯、小队出发、森林四季切换、齿轮鲸跃出云层",
            ],
        },
        "pitch_deck_outline": ["温暖冒险基调", "村庄与地牢双循环", "伙伴职业连携", "四季谜题系统", "像素资产规格", "Demo 第一小时流程"],
        "next_steps": ["确定 32x32 或 48x48 的角色像素规格。", "先实现星炉村、错季森林和贪睡树王一条完整闭环。"],
    }
    return _with_input_notes(result, payload)


def _general_template(payload: dict) -> dict:
    context = _base_context(payload)
    idea = context["idea"]
    game_type = context["game_type"]
    art_style = context["art_style"]
    result = {
        "title": "星环边境计划",
        "one_sentence_pitch": f"把“{idea}”扩展成一款 {game_type}，以 {art_style} 呈现一个可继续拆成角色、场景、UI 和宣传片的原创游戏世界。",
        "worldview": "世界被一座失控的星环装置分割成多个生态层，每个生态层都保存着不同文明的遗迹和规则。玩家所在的边境城镇依靠回收星环碎片维持能源，但碎片正在让现实出现重叠：沙漠里长出海底珊瑚，废弃工厂里传来古代祭祀的钟声。主线围绕修复星环还是彻底摧毁星环展开。",
        "core_gameplay": "玩法以探索、战斗、资源收集和基地升级为核心。玩家进入不同生态层收集星环碎片，带回基地解锁新装备、NPC 和支线事件。每个区域都有一个改变规则的环境机制，例如重力翻转、时间回放或光影开关，让关卡不仅是换皮地图。",
        "player_fantasy": "玩家幻想是带领一个小团队进入未知边境，把混乱世界一点点整理成自己的据点，同时发现每个遗迹背后被掩埋的文明选择。",
        "protagonist": {
            "name": "岑野",
            "identity": "边境回收队队长，唯一能稳定触碰星环碎片的人。",
            "appearance": "轻型探险护甲、可变形工具臂、披风上缝着不同生态层的徽记。",
            "personality": "务实、幽默、保护欲强，遇到未知技术时会先记录再冒险。",
            "abilities": ["碎片共鸣", "工具臂变形", "生态扫描", "临时护盾", "基地调度"],
        },
        "bosses": [
            {
                "name": "碎星守门人",
                "concept": "星环第一层的自动防御生命体，测试玩家是否有资格进入更深区域。",
                "visual_style": "半机械半水晶结构，身体中有旋转星图和断裂光带。",
                "mechanics": ["光带扫射", "水晶护盾", "区域重力切换", "破核心窗口"],
            },
            {
                "name": "潮汐铸造者",
                "concept": "把海洋生态和旧工厂合并的区域领主，能把金属熔成活体浪潮。",
                "visual_style": "巨型潜水服、熔炉胸腔、鱼群般移动的金属碎片。",
                "mechanics": ["熔潮推进", "召唤金属鱼群", "高温地面", "冷却阀门机制"],
            },
        ],
        "scenes": [
            {
                "name": "边境灯塔镇",
                "description": "玩家基地，废旧灯塔被改造成任务中心，居民会随主线推进逐渐回流。",
                "visual_keywords": ["边境城镇", "灯塔", "回收站", "星环碎片", "黄昏"],
                "image_prompt": f"{art_style} game hub town, frontier lighthouse, salvage workshop, glowing ring fragments, cinematic concept art",
            },
            {
                "name": "重力裂谷",
                "description": "岩壁、瀑布和废墟上下颠倒，玩家需要用碎片共鸣改变重力方向。",
                "visual_keywords": ["裂谷", "重力翻转", "瀑布", "遗迹", "漂浮石块"],
                "image_prompt": f"{art_style} gravity canyon level, upside down waterfalls, floating ruins, playable game environment",
            },
            {
                "name": "潮汐工厂",
                "description": "被海水吞没的旧工业区，生产线与珊瑚礁缠在一起。",
                "visual_keywords": ["工厂", "海水", "珊瑚", "熔炉", "金属浪潮"],
                "image_prompt": f"{art_style} flooded factory, coral reef, molten metal tide, boss arena, high detail game concept",
            },
        ],
        "ui_screens": [
            {
                "name": "探索 HUD",
                "purpose": "显示生态扫描、碎片能量、装备快捷槽和区域规则。",
                "layout_description": "中心保持干净，左下角为装备，右侧以竖向标签展示当前生态层规则和异常值。",
                "image_prompt": f"{art_style} exploration game HUD, clean readable UI, scanner panel, energy meter, equipment slots",
            },
            {
                "name": "基地升级界面",
                "purpose": "展示灯塔镇建筑、NPC、资源和下一阶段目标。",
                "layout_description": "俯视基地地图在中央，底部是资源条，右侧显示可升级建筑与收益。",
                "image_prompt": f"{art_style} base upgrade UI, frontier town map, resource bar, building cards, game management screen",
            },
        ],
        "asset_prompts": {
            "character_concept_art": [
                f"岑野角色概念图，轻型探险护甲、工具臂、碎片共鸣光效，{art_style}",
                f"碎星守门人 Boss 概念图，半机械半水晶，旋转星图核心，{art_style}",
            ],
            "environment_concept_art": [
                f"边境灯塔镇 hub 场景，回收站、星环碎片、黄昏灯光，{art_style}",
                f"重力裂谷关卡，倒置瀑布、漂浮遗迹、可玩平台路线，{art_style}",
            ],
            "ui_mockups": [
                f"{game_type} 探索 HUD，生态扫描面板、碎片能量条、装备快捷槽，{art_style}",
                f"基地升级界面，灯塔镇地图、建筑卡片、资源条和 NPC 状态，{art_style}",
            ],
            "sprite_sheet": [
                f"主角动作表，待机、奔跑、跳跃、交互、工具臂攻击、受击，适配 {context['target_platform']}",
            ],
            "video_storyboard": [
                "18 秒 Pitch 预告分镜：边境灯塔亮起、星环碎片失控、重力裂谷翻转、潮汐工厂 Boss 出现、基地居民回流",
            ],
        },
        "pitch_deck_outline": ["核心幻想", "世界规则", "主角与基地", "三张关键场景", "Boss 样章", "Demo 可验证目标", "后续资产清单"],
        "next_steps": ["把边境灯塔镇作为第一个可展示 hub。", "优先做重力裂谷机制灰盒和一套探索 HUD。"],
    }
    return _with_input_notes(result, payload)
