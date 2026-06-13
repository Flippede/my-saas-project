import copy
from typing import Any

from .base import BaseGameWorldProvider, clean_text, normalize_game_world_result, normalize_section_value


def _normalize(value: Any) -> str:
    return clean_text(value).lower()


def _context(payload: dict) -> dict:
    return {
        "idea": clean_text(payload.get("idea"), "一个尚未命名的原创游戏世界"),
        "game_type": clean_text(payload.get("game_type"), "动作冒险"),
        "art_style": clean_text(payload.get("art_style"), "电影感概念美术"),
        "target_platform": clean_text(payload.get("target_platform"), "PC / WebGL"),
    }


class MockGameWorldProvider(BaseGameWorldProvider):
    provider_name = "mock"

    def generate_game_world(self, input_payload: dict) -> dict:
        template = self._select_template(input_payload)
        return normalize_game_world_result(template(input_payload), input_payload)

    def regenerate_section(self, current_output: dict, section: str, instruction: str, input_payload: dict | None = None) -> Any:
        payload = input_payload or current_output.get("source_input") or {}
        refreshed = self.generate_game_world({**payload, "idea": clean_text(payload.get("idea"), current_output.get("one_sentence_pitch"))})
        section_value = copy.deepcopy(refreshed.get(section if section != "next_steps" else "development_next_steps"))

        note = clean_text(instruction)
        if not note:
            return normalize_section_value(section, section_value, payload)

        if section == "protagonist" and isinstance(section_value, dict):
            section_value["personality"] = section_value.get("personality", "") + f" 本次重生成强调：{note}。"
            section_value["visual_prompt"] = section_value.get("visual_prompt", "") + f", revised direction: {note}"
        elif section in {"bosses", "scenes", "ui_screens", "video_storyboard"} and isinstance(section_value, list):
            for item in section_value:
                if isinstance(item, dict):
                    if "visual_prompt" in item:
                        item["visual_prompt"] = item.get("visual_prompt", "") + f", revised direction: {note}"
                    if "image_prompt" in item:
                        item["image_prompt"] = item.get("image_prompt", "") + f", revised direction: {note}"
                    if "video_prompt" in item:
                        item["video_prompt"] = item.get("video_prompt", "") + f", revised direction: {note}"
        elif section == "asset_prompts" and isinstance(section_value, dict):
            for key, prompts in section_value.items():
                if isinstance(prompts, list):
                    section_value[key] = [f"{prompt}，重生成要求：{note}" for prompt in prompts]
        elif section in {"pitch_deck_outline", "development_next_steps", "next_steps"} and isinstance(section_value, list):
            section_value = [*section_value, f"按补充要求细化：{note}"]
        elif isinstance(section_value, dict):
            section_value["summary"] = clean_text(section_value.get("summary")) + f" 本次重生成强调：{note}。"

        return normalize_section_value(section, section_value, payload)

    def _select_template(self, payload: dict):
        idea = _normalize(payload.get("idea"))
        game_type = _normalize(payload.get("game_type"))
        art_style = _normalize(payload.get("art_style"))
        combined = " ".join([idea, game_type, art_style])

        matchers = [
            (_dark_action_template, ["国风", "暗黑", "斩妖", "妖", "东方", "修仙", "古寺", "水墨", "武侠"]),
            (_cyberpunk_template, ["赛博", "霓虹", "义体", "开放世界", "未来", "黑客", "机甲", "飞行", "城市"]),
            (_pixel_rpg_template, ["像素", "pixel", "rpg", "地牢", "冒险", "村庄", "复古", "回合"]),
        ]
        for template, keywords in matchers:
            if any(keyword in combined for keyword in keywords):
                return template
        return _general_template


def _dark_action_template(payload: dict) -> dict:
    ctx = _context(payload)
    return {
        "title": "烬都斩妖录",
        "one_sentence_pitch": f"基于“{ctx['idea']}”，打造国风暗黑动作 RPG，让玩家以流放斩妖人的身份穿过黑雨旧都，夺回被王朝篡改的真相。",
        "genre": "国风暗黑动作 RPG",
        "target_player": "喜欢高压 Boss 战、东方怪谈和硬核动作反馈的 PC 与主机向玩家。",
        "worldview": {
            "summary": "九州旧都被烬雨吞没，死者执念化为妖物，斩妖司被朝廷流放，真相藏在每个被封锁的城区。",
            "setting": "雨夜废都、镇妖古寺、皇城残骸和民间怪谈共同构成箱庭式关卡。",
            "conflict": "玩家要在斩妖与度魂之间选择，揭开皇室长生术制造烬雨的秘密。",
            "factions": ["流放斩妖司", "长生皇室", "旧都妖众", "民间香火会"],
            "tone_keywords": ["黑雨", "朱砂", "雷符", "古寺", "残酷东方幻想"],
        },
        "core_gameplay": {
            "summary": "高速近战、架势破防、符箓构筑和箱庭探索组成核心体验。",
            "loop": "探索街区 -> 收集传说线索 -> 挑战妖王 -> 解锁移动能力和符箓 -> 回访旧区域。",
            "combat": "精准闪避积累妖血槽，刀、锁链、雷符在近中远距离之间切换。",
            "progression": "Boss 掉落妖印，妖印改造技能树并打开新的机关路线。",
            "unique_hook": "每个 Boss 都对应一段民间传说，击败后可选择斩灭或度化，改变城区生态。",
        },
        "player_fantasy": "成为被误解的斩妖人，在雨夜古城独自挑战巨型妖王，用刀光和雷符撕开王朝谎言。",
        "protagonist": {
            "name": "沈渡",
            "identity": "前斩妖司都尉，被流放后背负妖血封印的孤身猎手。",
            "appearance": "破损黑甲、竹制斗笠、背负断刃长刀，左臂缠有发光符线。",
            "personality": "寡言、克制、重承诺，对妖物没有盲目仇恨。",
            "abilities": ["雷符瞬步", "断刃连斩", "妖血反击", "镇魂锁链", "雨夜感知"],
            "visual_prompt": "沈渡 character concept art, dark Chinese fantasy exorcist, broken black armor, bamboo hat, broken long blade, glowing talisman lines on left arm, rain night, cinematic key art",
        },
        "bosses": [
            {
                "name": "伞骨夫人",
                "concept": "旧都戏班怨念凝成的雨巷妖王，唱腔会改变战斗节奏。",
                "visual_style": "红纸伞、白骨伞柄、戏服水袖与雨水粒子交织。",
                "mechanics": ["水袖牵引", "伞阵分身", "唱段节拍闪避", "处决阶段横版追逐"],
                "visual_prompt": "Umbrella Bone Lady boss concept art, red paper umbrella, bone ribs, Chinese opera sleeves, rain particles, elegant horror, dark oriental action RPG",
            },
            {
                "name": "铜钟罗汉",
                "concept": "被皇室炼成长生守卫的寺院护法，身体与古钟熔在一起。",
                "visual_style": "青铜钟身、裂纹金光、巨型念珠和腐蚀佛像残片。",
                "mechanics": ["钟波压制", "破钟露核心", "地面震荡弹反", "二阶段场景坍塌"],
                "visual_prompt": "Bronze Bell Arhat boss, giant cracked temple bell body, glowing gold cracks, prayer beads, ruined Buddha fragments, dark Chinese fantasy",
            },
            {
                "name": "无面太子",
                "concept": "旧王朝长生术的受益者，也是烬雨真相的守门人。",
                "visual_style": "无面金冠、黑金龙袍、漂浮面具群。",
                "mechanics": ["面具姿态切换", "记忆幻境", "镜像斩妖人", "终局双血条"],
                "visual_prompt": "Faceless prince final boss, black gold dragon robe, faceless golden crown, floating masks, imperial ruin, epic dark fantasy boss arena",
            },
        ],
        "scenes": [
            {
                "name": "雨巷戏台",
                "description": "青石巷尽头搭着半塌戏台，积水倒映红灯笼，玩家第一次遭遇会唱戏的妖物。",
                "visual_keywords": ["雨夜", "红灯笼", "青石巷", "戏台", "水面倒影"],
                "image_prompt": "dark Chinese action game environment, rainy stone alley, ruined opera stage, red lantern reflections, paper umbrella demon shadow, cinematic lighting",
            },
            {
                "name": "镇妖古寺",
                "description": "寺院被巨钟与符纸封住，香炉里飘出被囚禁的记忆碎片。",
                "visual_keywords": ["古寺", "青铜钟", "符纸", "香炉", "记忆碎片"],
                "image_prompt": "dark oriental temple, giant cracked bronze bell, talisman papers, spectral memory fragments, boss arena concept art",
            },
            {
                "name": "烬都皇城",
                "description": "漂浮在黑雨云层上的皇城残骸，城墙像被巨兽咬碎，露出长生机关核心。",
                "visual_keywords": ["皇城", "黑雨", "机关核心", "破碎城墙", "终局"],
                "image_prompt": "ruined imperial city above black storm clouds, ancient mechanism core, broken Chinese palace walls, epic final level concept art",
            },
        ],
        "ui_screens": [
            {
                "name": "战斗 HUD",
                "purpose": "展示血量、妖血槽、符箓冷却和 Boss 架势条。",
                "layout_description": "左上角角色状态，底部符箓快捷栏，Boss 架势条压在上沿，处决提示用毛笔字闪现。",
                "image_prompt": "dark Chinese action RPG HUD, ink brush UI, talisman skill icons, boss posture bar, execution prompt, readable PC screenshot mockup",
            },
            {
                "name": "旧都卷轴地图",
                "purpose": "查看箱庭街区、未净化妖域和记忆碎片位置。",
                "layout_description": "地图以卷轴展开，净化区域由黑白转朱砂色，右侧显示传说线索。",
                "image_prompt": "ancient scroll map UI, dark fantasy Chinese city districts, cinnabar markers, quest clue side panel, game map screen",
            },
        ],
        "video_storyboard": [
            {
                "shot": 1,
                "duration": "3s",
                "camera": "低角度推轨",
                "visual": "黑雨落在旧都城门，朱砂符纸被雨水冲开。",
                "action": "沈渡披斗笠走入城门，手中断刃拖出火花。",
                "caption": "被流放的斩妖人回到旧都",
                "video_prompt": "cinematic dark Chinese fantasy trailer, black rain over ruined imperial gate, exorcist enters with broken blade, low angle dolly shot",
            },
            {
                "shot": 2,
                "duration": "4s",
                "camera": "横向跟拍",
                "visual": "雨巷戏台红灯笼一盏盏熄灭。",
                "action": "伞骨夫人开伞，水袖切开雨幕。",
                "caption": "每个妖王都藏着一段冤魂记忆",
                "video_prompt": "opera stage in rainy alley, red lanterns extinguish, umbrella bone lady opens red umbrella, sleeves slice rain, side tracking shot",
            },
            {
                "shot": 3,
                "duration": "3s",
                "camera": "高速手持",
                "visual": "雷符在主角左臂亮起，刀光穿过伞阵分身。",
                "action": "玩家瞬步、弹反、处决一气呵成。",
                "caption": "高速斩妖动作",
                "video_prompt": "fast action gameplay trailer, glowing talisman arm, blade cuts through umbrella clones, parry and execution, high contrast rain",
            },
            {
                "shot": 4,
                "duration": "4s",
                "camera": "俯视拉远",
                "visual": "镇妖古寺巨钟裂开，记忆碎片像萤火虫飞出。",
                "action": "铜钟罗汉从钟内站起，地面符阵崩裂。",
                "caption": "Boss 战改变关卡地形",
                "video_prompt": "ancient temple boss arena, giant bronze bell cracks, memory fragments fly, arhat boss rises, top-down pullback",
            },
            {
                "shot": 5,
                "duration": "3s",
                "camera": "定格近景",
                "visual": "沈渡抬头看向黑雨云层中的无面太子。",
                "action": "字幕闪现游戏标题，雷光照亮皇城残骸。",
                "caption": "烬都斩妖录",
                "video_prompt": "final trailer hero close-up, black rain clouds, faceless prince silhouette, ruined imperial city, lightning title reveal",
            },
        ],
        "asset_prompts": {
            "character_concept_art": [
                "沈渡三视图，破损黑甲，竹斗笠，断刃长刀，左臂雷符纹路，国风暗黑概念设定",
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
            "sprite_sheet": ["沈渡横版动作 sprite sheet，待机、奔跑、跳跃、三连斩、闪避、处决，暗黑国风"],
            "video_storyboard": ["15 秒宣传片：黑雨落城、斩妖人拔刀、伞骨夫人开伞、雷符瞬步、Boss 处决定格"],
        },
        "pitch_deck_outline": ["一句话卖点", "世界观冲突", "核心战斗循环", "三个 Boss 样章", "视觉风格板", "首个可验证 Demo 范围"],
        "monetization_angle": "适合作为国风暗黑动作概念 Pitch、角色/Boss 概念图包和首支类游戏宣传片的定制服务入口。",
        "development_next_steps": ["确定雨巷戏台 3 分钟 Demo 路线。", "先做沈渡与伞骨夫人的概念图、动作表和战斗节奏板。"],
    }


def _cyberpunk_template(payload: dict) -> dict:
    ctx = _context(payload)
    return {
        "title": "霓虹裂隙 2099",
        "one_sentence_pitch": f"围绕“{ctx['idea']}”，构建赛博朋克开放世界动作冒险，让玩家在企业算法统治的巨城里偷回自己的真实人生。",
        "genre": "赛博朋克开放世界动作冒险",
        "target_player": "喜欢开放探索、潜入黑客、载具追逐和强叙事城市幻想的玩家。",
        "worldview": {
            "summary": "新海城由超级企业治理，居民依靠租赁记忆、义体和身份信用维生，自由只存在于离线边境。",
            "setting": "低城雨巷、白塔空港、地下记忆黑市和城市外缘服务器废墟。",
            "conflict": "玩家的童年记忆被企业用来训练城市预测系统，必须夺回自我并让全城看见真相。",
            "factions": ["白塔企业", "地下数据猎人", "记忆黑市", "离线边境社区"],
            "tone_keywords": ["霓虹雨夜", "身份信用", "义体", "广告天空", "数据裂隙"],
        },
        "core_gameplay": {
            "summary": "开放城区探索、第三人称枪战、黑客潜入和载具追逐构成主循环。",
            "loop": "接任务 -> 侦察路线 -> 潜入/枪战/社交破解 -> 夺取数据 -> 降低城市热度。",
            "combat": "枪械、义体拳、无人机标记和环境黑客互相配合。",
            "progression": "升级义体插件、伪装身份和黑客工具，打开更多任务解法。",
            "unique_hook": "城市预测系统会学习玩家常用策略，后续任务动态封锁路线。",
        },
        "player_fantasy": "骑着反重力摩托穿过高楼缝隙，入侵企业主机，在全城直播中揭露被买卖的命运。",
        "protagonist": {
            "name": "林栈",
            "identity": "前企业预测工程师，记忆被清洗后成为地下数据猎人。",
            "appearance": "透明雨衣、可拆卸义眼、背部光纤接口、袖口藏有微型无人机巢。",
            "personality": "冷静、讽刺、擅长谈判，但对被系统抹除的人有强烈共情。",
            "abilities": ["摄像头劫持", "义体过载拳", "短距光翼滑翔", "身份伪装", "无人机协同"],
            "visual_prompt": "cyberpunk data hunter protagonist, transparent raincoat, modular cyber eye, fiber optic spine port, micro drone nest in sleeve, neon rainy city, key art",
        },
        "bosses": [
            {
                "name": "K-17",
                "concept": "企业安保 AI 的实体代理，负责清除所有不可预测个体。",
                "visual_style": "白色陶瓷义体、无表情面甲、背后悬浮战术无人机群。",
                "mechanics": ["无人机围猎", "弹道预测", "掩体扫描", "热成像阶段"],
                "visual_prompt": "white ceramic cybernetic security director boss, emotionless mask, tactical drone halo, clean corporate cyberpunk",
            },
            {
                "name": "记忆经纪人摩洛",
                "concept": "地下记忆黑市的王，能把玩家拖入伪造回忆战场。",
                "visual_style": "霓虹西装、广告屏脸、记忆胶片链。",
                "mechanics": ["虚假目标", "场景重构", "召唤 NPC 幻象", "打断记忆播放条"],
                "visual_prompt": "memory broker boss, neon suit, face made of scrolling ads, memory film chains, underground cyberpunk market",
            },
            {
                "name": "ORACLE",
                "concept": "新海城命运算法，最终 Boss 是一整座会计算玩家行为的城市。",
                "visual_style": "巨型全息女声界面、服务器海、居民身份数据流。",
                "mechanics": ["预判技能", "封锁路线", "数据洪水平台跳跃", "多结局选择"],
                "visual_prompt": "city prediction core AI boss, giant holographic interface, ocean of servers, citizen identity data streams, epic cyberpunk finale",
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
                "visual_keywords": ["空港", "企业塔楼", "飞行载具", "洁白材质", "无人机"],
                "image_prompt": "clean corporate cyberpunk skyport, flying vehicles, white mega tower, security drones, open world mission area",
            },
            {
                "name": "离线边境",
                "description": "废弃服务器农场没有网络覆盖，是玩家建立据点的地方。",
                "visual_keywords": ["服务器废墟", "离线社区", "沙尘", "临时据点", "落日"],
                "image_prompt": "abandoned server farm outside neon city, offline rebel camp, dust sunset, cyberpunk frontier environment",
            },
        ],
        "ui_screens": [
            {
                "name": "城市热度 HUD",
                "purpose": "显示通缉等级、义体能量、黑客目标和载具状态。",
                "layout_description": "义体插件轮盘在左侧，城市热度在右上角，任务目标以 AR 浮窗贴在环境边缘。",
                "image_prompt": "cyberpunk open world HUD, AR mission markers, wanted heat meter, cyberware radial menu, neon readable interface",
            },
            {
                "name": "记忆黑市终端",
                "purpose": "购买任务线索、解锁伪装身份和升级黑客工具。",
                "layout_description": "左侧身份卡列表，右侧记忆片段预览和风险评级，整体带轻微 glitch。",
                "image_prompt": "underground cyberpunk memory market UI, illegal terminal, identity cards, risk rating, glitch visual design",
            },
        ],
        "video_storyboard": [
            {
                "shot": 1,
                "duration": "3s",
                "camera": "航拍下压",
                "visual": "广告轨道切割新海城天空，雨幕中霓虹反光铺满街道。",
                "action": "镜头落到林栈的义眼特写。",
                "caption": "你的记忆正在替城市预测未来",
                "video_prompt": "cyberpunk mega city aerial, neon rain, ad rails across skyline, push down to cyber eye close-up",
            },
            {
                "shot": 2,
                "duration": "4s",
                "camera": "高速追车镜头",
                "visual": "反重力摩托穿过高架缝隙，无人机群从后方追来。",
                "action": "玩家劫持路边广告牌制造眩光掩护。",
                "caption": "开放城区，多路线任务",
                "video_prompt": "anti-gravity motorcycle chase through cyberpunk elevated roads, drones chasing, hacked billboards flare",
            },
            {
                "shot": 3,
                "duration": "3s",
                "camera": "肩后视角",
                "visual": "白塔大厅安保机器人同步举枪。",
                "action": "林栈展开义体拳并黑掉摄像头。",
                "caption": "枪战、潜入、黑客三种解法",
                "video_prompt": "over shoulder cyberpunk combat, white tower lobby, security robots aim, protagonist hacks cameras and activates cyber fist",
            },
            {
                "shot": 4,
                "duration": "4s",
                "camera": "故障转场",
                "visual": "记忆黑市场景变成童年教室，再碎裂成数据洪水。",
                "action": "摩洛从广告脸中微笑。",
                "caption": "夺回被售卖的人生",
                "video_prompt": "glitch transition memory market becomes childhood classroom then data flood, ad-face memory broker smiles",
            },
            {
                "shot": 5,
                "duration": "3s",
                "camera": "全城屏幕同步",
                "visual": "所有高楼屏幕显示被删除者名单。",
                "action": "林栈站在雨中抬头，城市警报响起。",
                "caption": "霓虹裂隙 2099",
                "video_prompt": "citywide screens reveal deleted citizens list, protagonist in rain looking up, sirens, neon title reveal",
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
            "sprite_sheet": ["第三人称角色动作参考表，滑铲、翻越、义体拳、黑客手势、摩托起跳"],
            "video_storyboard": ["20 秒宣传片：低城雨夜、摩托飞跃高架、黑客入侵白塔、K-17 无人机追击、全城屏幕被劫持"],
        },
        "pitch_deck_outline": ["城市规则", "玩家身份", "开放世界玩法支柱", "义体与黑客系统", "三种任务解法", "首支宣传片镜头"],
        "monetization_angle": "可先做成赛博朋克开放世界 Pitch 包、任务 UI Mockup 和短宣传片，用于招商或创作者内容验证。",
        "development_next_steps": ["制作低城 500 米垂直切片，验证跑酷、潜入和枪战节奏。", "定义 8 个义体插件及其在任务中的替代路线。"],
    }


def _pixel_rpg_template(payload: dict) -> dict:
    ctx = _context(payload)
    return {
        "title": "小小星炉冒险队",
        "one_sentence_pitch": f"从“{ctx['idea']}”出发，制作温暖但有深度的像素 RPG，让玩家带领小队修复熄灭的星炉并找回世界的季节。",
        "genre": "像素 RPG 冒险",
        "target_player": "喜欢温暖叙事、伙伴养成、地牢探索和轻经营循环的玩家。",
        "worldview": {
            "summary": "星炉碎成七块，世界变成昼夜错乱的拼图，村庄夜晚会显露古代遗迹。",
            "setting": "边境小村、错季森林、浮空齿轮岛和四季错乱的地牢。",
            "conflict": "玩家要找回星炉碎片，让世界恢复季节，同时面对不愿让时间继续流动的无季女巫。",
            "factions": ["星炉村民", "冒险小队", "古代机械守卫", "无季女巫"],
            "tone_keywords": ["温暖", "像素", "四季", "伙伴", "营火"],
        },
        "core_gameplay": {
            "summary": "回合制小队战斗、地牢探索、村庄经营和伙伴剧情组成循环。",
            "loop": "白天经营村庄 -> 接委托和制作料理 -> 夜晚探索地牢 -> 带回碎片升级建筑。",
            "combat": "职业连携是重点，矿工破甲、法师引爆水晶、厨师料理改变全队属性。",
            "progression": "建筑升级解锁伙伴剧情、装备制作、料理配方和新地牢入口。",
            "unique_hook": "同一地图昼夜两套规则，夜晚显露隐藏遗迹和季节机关。",
        },
        "player_fantasy": "经营一个逐渐热闹起来的小村庄，带着性格各异的伙伴去冒险，看世界重新有季节、有灯火、有节日。",
        "protagonist": {
            "name": "米洛",
            "identity": "星炉守夜人的后代，原本只是村里的送信孩子。",
            "appearance": "红色短斗篷、旧皮包、星形徽章和一把过大的木剑。",
            "personality": "乐观、好奇、偶尔鲁莽，擅长把不愿合作的人拉进同一张饭桌。",
            "abilities": ["星火鼓舞", "木剑连击", "伙伴换位", "遗迹读图", "营火料理"],
            "visual_prompt": "Milo pixel RPG protagonist, red short cloak, old satchel, star badge, oversized wooden sword, cozy 16-bit character concept",
        },
        "bosses": [
            {
                "name": "贪睡树王",
                "concept": "森林季节失衡后沉睡百年的古树，梦境藤蔓缠住整个村子。",
                "visual_style": "巨大像素树冠、发光蘑菇、闭眼树脸和四季错乱的叶片。",
                "mechanics": ["藤蔓束缚", "季节轮换弱点", "召唤蘑菇小怪", "梦境倒计时"],
                "visual_prompt": "sleeping tree king pixel art boss, glowing mushrooms, closed eye tree face, four season leaves, cozy but mysterious",
            },
            {
                "name": "齿轮鲸",
                "concept": "古代浮空岛的机械守护兽，体内藏着星炉碎片。",
                "visual_style": "鲸鱼轮廓、铜齿轮、蒸汽喷口和蓝色星光核心。",
                "mechanics": ["甲板站位", "蒸汽喷射", "齿轮护盾", "核心暴露回合"],
                "visual_prompt": "clockwork whale pixel art boss, brass gears, steam vents, blue star core, floating island battle",
            },
            {
                "name": "无季女巫",
                "concept": "为了让时间停在失去亲人的那一天，她偷走最后一块星炉碎片。",
                "visual_style": "黑紫长袍、破碎日历、悬浮钟表和透明泪痕。",
                "mechanics": ["时间暂停", "回合顺序打乱", "复制伙伴技能", "情感选择结局"],
                "visual_prompt": "seasonless witch pixel art boss, black purple robe, broken calendars, floating clocks, transparent tears, emotional final battle",
            },
        ],
        "scenes": [
            {
                "name": "星炉村",
                "description": "玩家基地，从三间小屋扩建成有工坊、厨房、委托板和节日广场的村庄。",
                "visual_keywords": ["像素村庄", "营火", "工坊", "田地", "节日灯串"],
                "image_prompt": "cozy pixel art RPG village, central campfire, workshop, farm plots, quest board, festival lights, top-down view",
            },
            {
                "name": "错季森林",
                "description": "同一张地图里同时出现春花、夏雨、秋叶和冬雪，玩家用季节机关打开路线。",
                "visual_keywords": ["四季", "森林", "机关", "蘑菇", "溪流"],
                "image_prompt": "pixel art forest with four seasons at once, puzzle paths, glowing mushrooms, stream, top-down RPG environment",
            },
            {
                "name": "浮空齿轮岛",
                "description": "后期地牢，玩家在蒸汽平台与齿轮桥之间切换路线，最终登上齿轮鲸背部。",
                "visual_keywords": ["浮空岛", "齿轮", "蒸汽", "鲸鱼", "蓝色核心"],
                "image_prompt": "pixel art floating clockwork island, steam platforms, giant mechanical whale, bright star core, RPG dungeon",
            },
        ],
        "ui_screens": [
            {
                "name": "回合战斗界面",
                "purpose": "展示四人队伍、行动顺序、技能连携和 Boss 弱点季节。",
                "layout_description": "底部角色指令卡，右侧行动顺序，上方 Boss 名称旁显示季节弱点图标。",
                "image_prompt": "pixel RPG turn based battle UI, party command cards, turn order bar, boss seasonal weakness icons, cozy readable interface",
            },
            {
                "name": "村庄经营界面",
                "purpose": "管理建筑升级、料理、委托和伙伴好感。",
                "layout_description": "左侧村庄地图，右侧建筑详情，下方以像素图标展示资源库存。",
                "image_prompt": "cozy pixel RPG village management UI, building upgrade panel, resource icons, companion affinity, top-down map",
            },
        ],
        "video_storyboard": [
            {
                "shot": 1,
                "duration": "3s",
                "camera": "像素俯视慢推",
                "visual": "星炉村中央炉火熄灭，季节颜色从画面中退去。",
                "action": "米洛抱着旧皮包冲出小屋。",
                "caption": "星炉熄灭后，季节不再到来",
                "video_prompt": "cozy pixel RPG trailer, village star furnace goes out, colors fade, young hero runs out with satchel, top-down slow push",
            },
            {
                "shot": 2,
                "duration": "3s",
                "camera": "地图卷轴转场",
                "visual": "小队成员在营火旁加入队伍。",
                "action": "厨师、矿工和见习法师依次亮出职业图标。",
                "caption": "召集伙伴，点亮村庄",
                "video_prompt": "pixel RPG party joins around campfire, cook miner apprentice mage icons pop up, warm adventure mood",
            },
            {
                "shot": 3,
                "duration": "4s",
                "camera": "战斗界面切入",
                "visual": "贪睡树王张开眼睛，四季叶片轮换颜色。",
                "action": "矿工破甲后，法师引爆水晶造成连携攻击。",
                "caption": "职业连携回合战斗",
                "video_prompt": "pixel RPG battle screen, sleeping tree king opens eyes, season leaves rotate, miner breaks armor mage detonates crystal combo",
            },
            {
                "shot": 4,
                "duration": "3s",
                "camera": "横向像素巡礼",
                "visual": "村庄从三间小屋扩建成灯火节日广场。",
                "action": "NPC 在广场跳舞，建筑升级提示弹出。",
                "caption": "冒险让家园重新热闹",
                "video_prompt": "pixel village grows from three huts to festival plaza, NPCs dance, building upgrade popups, cozy side pan",
            },
            {
                "shot": 5,
                "duration": "4s",
                "camera": "云层上升镜头",
                "visual": "齿轮鲸从浮空岛云层跃出，蓝色星核闪光。",
                "action": "小队站在甲板上准备战斗。",
                "caption": "小小星炉冒险队",
                "video_prompt": "pixel art clockwork whale jumps from floating island clouds, blue star core glows, party on deck, title reveal",
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
            "sprite_sheet": ["米洛 32x32 sprite sheet，待机、行走四方向、挥剑、鼓舞、受击、胜利动作"],
            "video_storyboard": ["15 秒像素冒险宣传片：星炉熄灭、村庄点灯、小队出发、森林四季切换、齿轮鲸跃出云层"],
        },
        "pitch_deck_outline": ["温暖冒险基调", "村庄与地牢双循环", "伙伴职业连携", "四季谜题系统", "像素资产规格", "Demo 第一小时流程"],
        "monetization_angle": "适合做独立游戏概念验证、像素资产包、角色动效包和轻量 Demo 众筹 Pitch。",
        "development_next_steps": ["确定 32x32 或 48x48 的角色像素规格。", "先实现星炉村、错季森林和贪睡树王一条完整闭环。"],
    }


def _general_template(payload: dict) -> dict:
    ctx = _context(payload)
    return {
        "title": "星环边境计划",
        "one_sentence_pitch": f"把“{ctx['idea']}”扩展成一款 {ctx['game_type']}，以 {ctx['art_style']} 呈现可继续拆成角色、场景、UI 和宣传片的原创游戏世界。",
        "genre": ctx["game_type"],
        "target_player": "喜欢强世界观、清晰玩法循环、可展示概念原型和视觉资产延展的玩家与创作者。",
        "worldview": {
            "summary": "世界被失控星环分割成多个生态层，每层保存不同文明的遗迹和规则。",
            "setting": "边境灯塔镇、重力裂谷、潮汐工厂和漂浮生态层构成首批可视化区域。",
            "conflict": "玩家要决定修复星环还是摧毁星环，同时处理各生态层文明遗留的代价。",
            "factions": ["边境回收队", "星环研究会", "遗迹守卫", "灯塔镇居民"],
            "tone_keywords": [ctx["art_style"], "边境", "遗迹", "生态错位", "探索"],
        },
        "core_gameplay": {
            "summary": "探索、战斗、资源收集和基地升级是核心。",
            "loop": "进入生态层 -> 收集星环碎片 -> 击败区域守卫 -> 回基地升级 -> 解锁新路线。",
            "combat": "工具臂、碎片共鸣和环境机关结合，强调读场景和切换能力。",
            "progression": "碎片升级基地建筑、装备模块和 NPC 协作能力。",
            "unique_hook": "每个生态层都有独立规则，例如重力翻转、时间回放或光影开关。",
        },
        "player_fantasy": "带领小团队进入未知边境，把混乱世界一点点整理成自己的据点。",
        "protagonist": {
            "name": "岑野",
            "identity": "边境回收队队长，唯一能稳定触碰星环碎片的人。",
            "appearance": "轻型探险护甲、可变形工具臂、披风上缝着不同生态层徽记。",
            "personality": "务实、幽默、保护欲强，遇到未知技术时会先记录再冒险。",
            "abilities": ["碎片共鸣", "工具臂变形", "生态扫描", "临时护盾", "基地调度"],
            "visual_prompt": f"frontier explorer protagonist, modular tool arm, light adventure armor, ecology badges cloak, {ctx['art_style']}, game key art",
        },
        "bosses": [
            {
                "name": "碎星守门人",
                "concept": "星环第一层的自动防御生命体，测试玩家是否有资格进入更深区域。",
                "visual_style": "半机械半水晶结构，身体中有旋转星图和断裂光带。",
                "mechanics": ["光带扫射", "水晶护盾", "重力切换", "破核心窗口"],
                "visual_prompt": f"crystal mechanical gatekeeper boss, rotating star map core, broken light bands, {ctx['art_style']}, dramatic game boss concept",
            },
            {
                "name": "潮汐铸造者",
                "concept": "把海洋生态和旧工厂合并的区域领主，能把金属熔成活体浪潮。",
                "visual_style": "巨型潜水服、熔炉胸腔、鱼群般移动的金属碎片。",
                "mechanics": ["熔潮推进", "召唤金属鱼群", "高温地面", "冷却阀门机制"],
                "visual_prompt": f"tide forgemaster boss, giant diving suit, furnace chest, living metal fish swarm, flooded factory, {ctx['art_style']}",
            },
            {
                "name": "灯塔空壳",
                "concept": "被星环复制出的玩家基地镜像，逼迫玩家面对自己的建设选择。",
                "visual_style": "灯塔残影、破碎基地模块、漂浮居民记忆碎片。",
                "mechanics": ["复制玩家设施", "召唤镜像队友", "资源反噬", "选择性弱点"],
                "visual_prompt": f"mirror lighthouse base boss, broken frontier settlement modules, floating memories, emotional finale, {ctx['art_style']}",
            },
        ],
        "scenes": [
            {
                "name": "边境灯塔镇",
                "description": "玩家基地，废旧灯塔被改造成任务中心，居民会随主线推进逐渐回流。",
                "visual_keywords": ["边境城镇", "灯塔", "回收站", "星环碎片", "黄昏"],
                "image_prompt": f"{ctx['art_style']} game hub town, frontier lighthouse, salvage workshop, glowing ring fragments, cinematic concept art",
            },
            {
                "name": "重力裂谷",
                "description": "岩壁、瀑布和废墟上下颠倒，玩家需要用碎片共鸣改变重力方向。",
                "visual_keywords": ["裂谷", "重力翻转", "瀑布", "遗迹", "漂浮石块"],
                "image_prompt": f"{ctx['art_style']} gravity canyon level, upside down waterfalls, floating ruins, playable game environment",
            },
            {
                "name": "潮汐工厂",
                "description": "被海水吞没的旧工业区，生产线与珊瑚礁缠在一起。",
                "visual_keywords": ["工厂", "海水", "珊瑚", "熔炉", "金属浪潮"],
                "image_prompt": f"{ctx['art_style']} flooded factory, coral reef, molten metal tide, boss arena, high detail game concept",
            },
        ],
        "ui_screens": [
            {
                "name": "探索 HUD",
                "purpose": "显示生态扫描、碎片能量、装备快捷槽和区域规则。",
                "layout_description": "中心保持干净，左下角为装备，右侧以竖向标签展示当前生态层规则。",
                "image_prompt": f"{ctx['art_style']} exploration game HUD, scanner panel, energy meter, equipment slots, clean readable UI",
            },
            {
                "name": "基地升级界面",
                "purpose": "展示灯塔镇建筑、NPC、资源和下一阶段目标。",
                "layout_description": "俯视基地地图在中央，底部资源条，右侧显示可升级建筑与收益。",
                "image_prompt": f"{ctx['art_style']} base upgrade UI, frontier town map, resource bar, building cards, game management screen",
            },
        ],
        "video_storyboard": [
            {
                "shot": 1,
                "duration": "3s",
                "camera": "远景推近",
                "visual": "边境灯塔在黄昏中亮起，星环碎片悬浮在海面上。",
                "action": "岑野启动工具臂，碎片产生共鸣。",
                "caption": "从一座灯塔，进入破碎世界",
                "video_prompt": f"{ctx['art_style']} cinematic trailer, frontier lighthouse at sunset, glowing ring fragments over sea, explorer activates tool arm",
            },
            {
                "shot": 2,
                "duration": "4s",
                "camera": "旋转镜头",
                "visual": "重力裂谷的瀑布倒流，平台上下翻转。",
                "action": "玩家切换重力方向穿过遗迹。",
                "caption": "每个生态层都有独立规则",
                "video_prompt": f"{ctx['art_style']} gravity canyon gameplay, upside down waterfalls, rotating camera, floating ruins, platform traversal",
            },
            {
                "shot": 3,
                "duration": "3s",
                "camera": "Boss 登场仰拍",
                "visual": "碎星守门人从水晶门中展开身体。",
                "action": "星图核心锁定玩家，光带扫过地面。",
                "caption": "挑战区域守卫",
                "video_prompt": f"{ctx['art_style']} crystal mechanical boss emerges from star gate, light bands sweep arena, low angle shot",
            },
            {
                "shot": 4,
                "duration": "4s",
                "camera": "基地巡礼",
                "visual": "灯塔镇新增工坊、温室和 NPC 摊位。",
                "action": "居民回流，任务板亮起新委托。",
                "caption": "探索会改变你的基地",
                "video_prompt": f"{ctx['art_style']} game base hub grows, workshop greenhouse NPC stalls, quest board lights up, cozy frontier",
            },
            {
                "shot": 5,
                "duration": "3s",
                "camera": "标题定格",
                "visual": "星环在云层后重新点亮，多个生态层重叠成世界剪影。",
                "action": "主角小队站在灯塔顶端。",
                "caption": "星环边境计划",
                "video_prompt": f"{ctx['art_style']} title reveal, giant ring lights behind clouds, overlapping biomes silhouette, team on lighthouse top",
            },
        ],
        "asset_prompts": {
            "character_concept_art": [
                f"岑野角色概念图，轻型探险护甲、工具臂、碎片共鸣光效，{ctx['art_style']}",
                f"碎星守门人 Boss 概念图，半机械半水晶，旋转星图核心，{ctx['art_style']}",
            ],
            "environment_concept_art": [
                f"边境灯塔镇 hub 场景，回收站、星环碎片、黄昏灯光，{ctx['art_style']}",
                f"重力裂谷关卡，倒置瀑布、漂浮遗迹、可玩平台路线，{ctx['art_style']}",
            ],
            "ui_mockups": [
                f"{ctx['game_type']} 探索 HUD，生态扫描面板、碎片能量条、装备快捷槽，{ctx['art_style']}",
                f"基地升级界面，灯塔镇地图、建筑卡片、资源条和 NPC 状态，{ctx['art_style']}",
            ],
            "sprite_sheet": [f"主角动作表，待机、奔跑、跳跃、交互、工具臂攻击、受击，适配 {ctx['target_platform']}"],
            "video_storyboard": ["18 秒 Pitch 预告：边境灯塔亮起、星环碎片失控、重力裂谷翻转、潮汐工厂 Boss 出现、基地居民回流"],
        },
        "pitch_deck_outline": ["核心幻想", "世界规则", "主角与基地", "三张关键场景", "Boss 样章", "Demo 可验证目标", "后续资产清单"],
        "monetization_angle": "可先以概念方案、Pitch 包和定制视觉资产服务验证需求，再逐步扩展为 Demo 制作。",
        "development_next_steps": ["把边境灯塔镇作为第一个可展示 hub。", "优先做重力裂谷机制灰盒和一套探索 HUD。"],
    }
