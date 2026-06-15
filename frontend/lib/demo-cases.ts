export type DemoCase = {
  slug: string
  title: string
  subtitle: string
  genre: string
  artStyle: string
  targetPlatform: string
  oneSentencePitch: string
  originalIdea: string
  worldview: {
    summary: string
    setting: string
    conflict: string
    factions: string[]
    toneKeywords: string[]
  }
  coreGameplay: {
    summary: string
    loop: string
    combat: string
    progression: string
    uniqueHook: string
  }
  protagonist: {
    name: string
    identity: string
    appearance: string
    abilities: string[]
    visualPrompt: string
  }
  bosses: Array<{
    name: string
    concept: string
    visualStyle: string
    mechanics: string[]
    visualPrompt: string
  }>
  scenes: Array<{
    name: string
    description: string
    visualKeywords: string[]
    imagePrompt: string
  }>
  uiScreens: Array<{
    name: string
    purpose: string
    layoutDescription: string
    imagePrompt: string
  }>
  videoStoryboard: Array<{
    shot: number
    duration: string
    camera: string
    visual: string
    action: string
    caption: string
    videoPrompt: string
  }>
  assetPrompts: {
    characterConceptArt: string[]
    environmentConceptArt: string[]
    uiMockups: string[]
    spriteSheet: string[]
    videoStoryboard: string[]
  }
  pitchDeckOutline: string[]
  nextSteps: string[]
}

export const demoCases: DemoCase[] = [
  {
    slug: "dark-myth-action",
    title: "烬山夜行",
    subtitle: "国风暗黑动作游戏",
    genre: "横版动作 / Boss Rush / 轻度魂系",
    artStyle: "国风暗黑、雨夜水墨、青铜符箓、电影感高对比",
    targetPlatform: "PC / Steam 概念验证，后续可扩展主机与云试玩",
    oneSentencePitch: "被流放的斩妖人带着半枚雷符回到烬山，在雨夜古寺与吞食山神的妖王决战。",
    originalIdea: "一个国风暗黑动作游戏，主角是被流放的斩妖人，回到被妖雾吞没的故乡，一路挑战古寺、山道、地宫里的强大 Boss。",
    worldview: {
      summary:
        "烬山曾是镇妖司封印山神残骸的圣地，十年前一场天雷劈开封印，妖雾顺着古道扩散，村落、寺院和矿洞逐渐被异化。玩家扮演被逐出师门的斩妖人，在一夜大雨中重返故乡，追查自己为何与妖雾共鸣。",
      setting:
        "架空晚唐风格山地边城，场景由雨夜山门、破败古寺、悬棺栈道、青铜地宫和山神心脏组成。所有建筑都带有符纸、铜铃、残破木构与被黑雾侵蚀的纹样。",
      conflict:
        "镇妖司想重新封山掩盖旧案，山民想逃出妖雾，妖物则在山神残骸中寻找新的王。主角必须决定是重建封印，还是彻底斩断镇妖司与妖雾的交易。",
      factions: ["镇妖司残部", "烬山山民", "古寺僧兵", "雾中妖族", "山神残骸"],
      toneKeywords: ["雨夜", "雷符", "古寺", "斩妖", "铜绿", "压迫感", "宿命"],
    },
    coreGameplay: {
      summary:
        "以精准闪避、符刃连段和 Boss 机制识别为核心，关卡长度较短但战斗密度高，适合展示强烈视觉风格和短视频切片。",
      loop:
        "进入区域，探索岔路收集符骨，解锁捷径，挑战精英怪，进入 Boss 战，获得新雷符能力，再回到旧区域打开隐藏路线。",
      combat:
        "主角使用长刀和雷符切换轻重攻击。完美闪避会积累雷痕，雷痕可释放破甲斩、引雷反击和短距离影步。Boss 有阶段转换与场景破坏。",
      progression:
        "成长来自符骨镶嵌、招式变体、Boss 掉落的妖核以及可选的诅咒契约。玩家可以选择高风险的妖化强化，换取更高伤害和更少容错。",
      uniqueHook:
        "每个 Boss 都对应一段主角被流放的记忆；击败 Boss 后，场景会从妖雾形态短暂恢复为十年前的真实样貌，形成强烈叙事反差。",
    },
    protagonist: {
      name: "沈烬",
      identity: "被镇妖司除名的斩妖人，左臂被妖雾侵蚀，仍保留半枚祖传雷符。",
      appearance:
        "黑色破旧斗笠、湿透的深青短袍、缠满符纸的左臂、腰间悬铜铃和长刀，行走时有微弱蓝白电弧。",
      abilities: ["雷符影步", "破甲斩", "妖雾感知", "铜铃镇魂", "濒死妖化"],
      visualPrompt:
        "dark Chinese fantasy swordsman, rain soaked bamboo hat, black and deep teal robe, talisman wrapped corrupted left arm, long dao blade with blue lightning, bronze bell accessories, ruined temple background, cinematic concept art, high contrast ink wash, no modern elements",
    },
    bosses: [
      {
        name: "铜面伽蓝",
        concept: "守寺僧兵与青铜佛像融合后的第一位守门 Boss，会用巨大铜臂封锁走位。",
        visualStyle: "半人半佛像，铜绿锈蚀，袈裟碎片与符纸飘动，面具下有黑雾火光。",
        mechanics: ["铜臂横扫制造安全区", "诵经蓄力召唤钟波", "二阶段佛像碎裂露出妖核", "玩家可用雷符打断跪拜回血"],
        visualPrompt:
          "dark oriental temple boss, giant bronze monk statue fused with corrupted warrior, oxidized green copper, torn kasaya, floating talismans, black mist glowing under mask, rainy ruined monastery, dramatic boss arena, game concept art",
      },
      {
        name: "悬棺白蛇",
        concept: "盘踞在悬棺栈道的蛇妖，背负数十具白布棺，象征被封山牺牲的村民。",
        visualStyle: "白蛇身躯缠绕木棺，头部近似戴丧冠的女子，鳞片带水墨晕染。",
        mechanics: ["沿栈道追逐", "棺木坠落改变地形", "毒雾逼迫玩家换位", "尾部弱点需要绕背攻击"],
        visualPrompt:
          "giant white serpent demon carrying hanging coffins, Chinese funeral crown, ink wash scales, cliffside plank road in storm, falling wooden coffins, tragic dark fantasy, cinematic action game boss",
      },
      {
        name: "无首山君",
        concept: "山神残骸诞生的最终妖王，没有头颅，胸腔中悬着雷击后的神木心脏。",
        visualStyle: "兽形巨躯、断颈喷出黑雾、胸口神木心脏发光，背部插满镇妖司旧旗。",
        mechanics: ["踩踏震荡和地裂", "召唤旧旗形成雷区", "三阶段吞噬月光回血", "终局需要在心脏暴露时完成处决"],
        visualPrompt:
          "headless mountain god demon, massive beast body, black mist from severed neck, glowing divine tree heart in chest, old exorcist banners stabbed into back, moonlit mountain summit, Chinese dark fantasy final boss concept art",
      },
    ],
    scenes: [
      {
        name: "雨夜山门",
        description: "玩家进入烬山的第一屏，破木牌坊、泥水、红灯笼和远处古寺轮廓建立整体调性。",
        visualKeywords: ["雨夜", "牌坊", "红灯笼", "黑雾", "远山"],
        imagePrompt:
          "side scrolling game environment, rainy Chinese mountain gate at night, broken wooden paifang, muddy path, red lanterns reflected in puddles, black mist, distant ruined temple silhouette, dark fantasy concept art",
      },
      {
        name: "青铜地宫",
        description: "镇妖司地下封印设施，墙面布满铜质符阵和被撕开的铁链，适合展示探索与 Boss 前压迫感。",
        visualKeywords: ["青铜", "符阵", "铁链", "地宫", "冷光"],
        imagePrompt:
          "ancient bronze underground palace, Chinese talisman arrays carved into walls, broken chains, cold cyan light, dark mist leaking through cracks, game level concept art, cinematic composition",
      },
      {
        name: "山神心脏",
        description: "最终战场，悬空平台围绕跳动的神木心脏旋转，雷云与妖雾在上方对撞。",
        visualKeywords: ["最终战", "神木心脏", "雷云", "悬空平台", "妖雾"],
        imagePrompt:
          "final boss arena on mountain summit, floating stone platforms around a glowing divine tree heart, thunderclouds, black demon mist, Chinese myth action game, epic cinematic key art",
      },
    ],
    uiScreens: [
      {
        name: "Boss 战 HUD",
        purpose: "展示玩家血量、雷痕、妖化风险和 Boss 阶段。",
        layoutDescription:
          "左上为主角血条与雷痕槽，底部为 Boss 名称和分段血条，右侧小型符咒轮盘显示可用技能，整体使用铜绿、暗红和蓝白电光。",
        imagePrompt:
          "dark Chinese action game boss fight UI, segmented boss health bar, talisman skill wheel, lightning energy meter, bronze green and deep red palette, clean readable HUD mockup",
      },
      {
        name: "符骨镶嵌界面",
        purpose: "用于展示成长系统和可复制为资产任务的 UI 方案。",
        layoutDescription:
          "中间为刀身形状的符骨槽，左右分别展示妖核属性和招式变体，背景是半透明宣纸纹理与青铜刻线。",
        imagePrompt:
          "Chinese dark fantasy upgrade menu, blade shaped rune slots, demon core attributes, parchment texture, bronze engraved lines, game UI mockup, high readability",
      },
    ],
    videoStoryboard: [
      {
        shot: 1,
        duration: "3s",
        camera: "低机位推镜",
        visual: "雨水打在破旧牌坊，远处古寺灯笼逐个熄灭。",
        action: "沈烬走入画面，铜铃轻响。",
        caption: "被流放的人，回到被封印的山。",
        videoPrompt:
          "low angle dolly shot, rainy Chinese mountain gate, red lanterns going dark one by one, lone swordsman enters with bronze bell sound, dark fantasy game trailer",
      },
      {
        shot: 2,
        duration: "4s",
        camera: "横向跟拍",
        visual: "主角在古寺廊下闪避铜面伽蓝的巨臂横扫。",
        action: "完美闪避后释放蓝白雷斩。",
        caption: "用雷符，斩开妖雾。",
        videoPrompt:
          "side tracking shot, dark temple corridor, bronze monk boss sweeps giant arm, swordsman perfect dodges and releases blue lightning slash, action game trailer",
      },
      {
        shot: 3,
        duration: "5s",
        camera: "俯拍拉远",
        visual: "山顶平台裂开，无首山君胸口神木心脏亮起。",
        action: "主角举刀冲向心脏，雷云照亮全场。",
        caption: "封印之外，还有真相。",
        videoPrompt:
          "top down pullback shot, mountain summit arena cracking apart, headless mountain demon reveals glowing tree heart, thunderstorm lights the arena, epic final trailer shot",
      },
    ],
    assetPrompts: {
      characterConceptArt: [
        "沈烬三视图，斗笠、深青短袍、符纸左臂、长刀、铜铃配件，国风暗黑动作游戏角色设定，干净背景。",
        "沈烬妖化状态概念图，左臂黑雾扩散，眼部蓝白电光，服装破损但仍有斩妖人轮廓。",
      ],
      environmentConceptArt: [
        "雨夜山门横版关卡主视觉，牌坊、泥水、红灯笼、远处古寺，适合作为宣传图。",
        "青铜地宫探索场景，符阵墙面、断裂铁链、冷色体积光、黑雾裂缝。",
      ],
      uiMockups: [
        "国风暗黑 Boss 战 HUD，底部 Boss 血条、右侧符咒技能轮盘、左上雷痕槽。",
        "符骨镶嵌成长界面，刀身插槽、妖核属性、招式说明、宣纸与青铜纹理。",
      ],
      spriteSheet: [
        "沈烬横版动作 sprite sheet，待机、跑步、跳跃、轻攻击三连、闪避、雷斩、受击、死亡，深色透明背景。",
      ],
      videoStoryboard: [
        "15 秒竖屏宣传片分镜，雨夜山门、古寺 Boss 战、山顶最终战，强调雷符斩妖和国风暗黑氛围。",
      ],
    },
    pitchDeckOutline: [
      "一句话定位：国风暗黑 Boss Rush，把短视频可传播的 Boss 战与可扩展世界观结合。",
      "目标用户：喜欢国风动作、魂系挑战、短流程高强度战斗的 PC 玩家和内容创作者。",
      "核心差异：每个 Boss 同时是战斗关卡、视觉名片和主角记忆碎片。",
      "Demo 范围：一个教学区域、两个完整 Boss、符骨成长界面、15 秒宣传片。",
      "商业路径：Steam 愿望单验证、短视频 Boss 战切片、付费美术包与后续正式立项。",
    ],
    nextSteps: [
      "把雨夜山门和铜面伽蓝做成首个可视化素材包。",
      "基于分镜生成 15 秒竖屏概念宣传片。",
      "制作横版战斗可交互 Demo，验证闪避、雷痕和 Boss 阶段机制。",
      "整理 Pitch Deck，用于独立游戏投资人和发行商沟通。",
    ],
  },
  {
    slug: "cyberpunk-open-world",
    title: "霓虹断层",
    subtitle: "赛博朋克开放世界",
    genre: "第三人称开放世界 / 任务驱动 / 载具追逐",
    artStyle: "高密度霓虹、雨夜城市、义体科技、东方都市广告牌",
    targetPlatform: "PC 概念验证，后续适配云试玩和短视频互动叙事",
    oneSentencePitch: "失忆快递员穿梭在分层霓虹都市，利用被禁用的城市地图破解企业 AI 对现实的重写。",
    originalIdea: "一个赛博朋克开放世界游戏，玩家骑飞行摩托送违禁数据，在霓虹城市里接任务、追车、潜入高塔，对抗控制城市记忆的企业 AI。",
    worldview: {
      summary:
        "新海城被企业 AI「明昼」分割成上城、雨街和地下旧网三层。所有居民的记忆、信用和通行权限都由实时地图计算，地图之外的人会被系统判定为不存在。",
      setting:
        "近未来沿海巨城，空中高速、立体广告、无人机警察、旧城骑楼和地下数据庙宇并存。城市永远下着人工雨，用来冷却上城服务器。",
      conflict:
        "企业想用明昼维持秩序，反抗组织想公开旧网档案，普通人只想保住信用身份。主角发现自己能看到被明昼删除的道路和人。",
      factions: ["明昼企业", "雨街快递帮", "旧网黑客", "无人机警务", "上城董事会"],
      toneKeywords: ["霓虹", "雨街", "义体", "数据幽灵", "飞行摩托", "城市断层", "企业阴谋"],
    },
    coreGameplay: {
      summary:
        "开放城区以高机动载具、垂直探索和任务选择为主。玩家用飞行摩托穿越广告牌与空中车流，再下车进行潜入、枪战或黑客解谜。",
      loop:
        "接取数据委托，规划穿越路线，躲避无人机巡逻，完成追逐或潜入，在旧网节点解锁城市断层，获得新区域与装备。",
      combat:
        "第三人称轻量射击结合义体技能。玩家可使用电磁手枪、折叠刀、诱饵投影和短时黑入，把敌方无人机转化为掩护。",
      progression:
        "成长由义体模块、摩托改装、黑客脚本和阵营声望组成。不同委托会改变城市广告、巡逻密度和可用地下通道。",
      uniqueHook:
        "城市地图本身是玩法核心。玩家能在现实街区和被删除的旧网街区之间切换，看到同一地点的两种版本，用地图漏洞完成任务。",
    },
    protagonist: {
      name: "洛栖",
      identity: "雨街最快的数据快递员，脑内装着一枚无法卸载的旧网导航芯片。",
      appearance:
        "短银发、半透明机能雨衣、发光义眼、轻量外骨骼腿部组件，背后固定折叠数据箱，常骑黑紫色飞行摩托。",
      abilities: ["断层视野", "无人机劫持", "飞行摩托冲刺", "诱饵投影", "短时信用伪装"],
      visualPrompt:
        "cyberpunk courier heroine, short silver hair, translucent tech raincoat, glowing cybernetic eye, lightweight exoskeleton legs, compact data case backpack, black purple hoverbike, neon rainy megacity, third person game key art",
    },
    bosses: [
      {
        name: "白塔审计官",
        concept: "明昼企业的高层安全代理，身体由办公正装和战斗义体组成，像一位冷静的城市法官。",
        visualStyle: "白色西装、透明面罩、背部悬浮数据环，手臂能展开为高能轨道炮。",
        mechanics: ["召唤审计无人机", "锁定玩家信用条限制技能", "把地面投影成禁行区", "二阶段进入空中追逐"],
        visualPrompt:
          "cyberpunk corporate enforcer boss, white suit mixed with combat prosthetics, transparent visor, floating data halo, arm railgun, neon corporate tower arena, sleek high tech concept art",
      },
      {
        name: "雨街百手",
        concept: "地下改装帮派首领，把几十只维修机械臂接入身体，控制整条雨街工坊。",
        visualStyle: "宽大防水斗篷、密集机械臂、焊接火花、涂鸦金属面具，色彩更脏更街头。",
        mechanics: ["机械臂同时封锁多个方向", "抓取环境物投掷", "召唤工坊炮台", "玩家可黑入机械臂互相牵制"],
        visualPrompt:
          "street cyberpunk gang boss with many industrial robotic arms, waterproof cloak, graffiti metal mask, welding sparks, rainy alley workshop, gritty neon concept art",
      },
    ],
    scenes: [
      {
        name: "雨街低空车道",
        description: "飞行摩托的主要展示场景，低空穿过密集招牌、空调外机和无人机巡逻路线。",
        visualKeywords: ["低空车道", "霓虹招牌", "人工雨", "飞行摩托", "无人机"],
        imagePrompt:
          "cyberpunk low altitude traffic lane, neon signs, artificial rain, hoverbikes weaving through dense city blocks, drones, Asian megacity, open world game concept art",
      },
      {
        name: "白塔数据中庭",
        description: "企业总部内部，干净到不真实的白色中庭与外部脏乱雨街形成反差。",
        visualKeywords: ["企业白塔", "数据瀑布", "极简白色", "监控", "冷感"],
        imagePrompt:
          "futuristic corporate data atrium, clean white architecture, vertical data waterfalls, surveillance drones, cold cyan lighting, cyberpunk open world mission area",
      },
      {
        name: "旧网数据庙",
        description: "地下黑客聚集地，把旧服务器、香炉、电子牌位和线缆组合成近未来民间信仰空间。",
        visualKeywords: ["地下", "旧服务器", "电子牌位", "线缆", "民俗科技"],
        imagePrompt:
          "underground cyberpunk data temple, old servers, electronic ancestral tablets, incense smoke mixed with cables, warm neon and dark concrete, unique game environment concept art",
      },
    ],
    uiScreens: [
      {
        name: "城市断层地图",
        purpose: "展示开放世界核心机制：现实地图与旧网地图的切换。",
        layoutDescription:
          "主界面为三层城市地图，滑块切换上城、雨街、地下旧网；任务、通缉热度和无人机巡逻以动态图层显示。",
        imagePrompt:
          "cyberpunk open world map UI, layered city map, toggle between real city and deleted old net, mission markers, drone patrol heat zones, neon cyan magenta interface",
      },
      {
        name: "义体改装界面",
        purpose: "展示角色成长、装备模块和摩托改装。",
        layoutDescription:
          "左侧为洛栖全身扫描，右侧为义体插槽、脚本卡片和摩托性能曲线，强调可读性和科技感。",
        imagePrompt:
          "cyberpunk cyberware upgrade UI, full body scan of courier heroine, module slots, hacking script cards, hoverbike performance graph, sleek game interface mockup",
      },
    ],
    videoStoryboard: [
      {
        shot: 1,
        duration: "4s",
        camera: "高速跟拍",
        visual: "洛栖骑飞行摩托穿过霓虹广告牌和无人机光束。",
        action: "她打开断层视野，一条不存在的蓝色道路浮现。",
        caption: "地图之外，也有人活着。",
        videoPrompt:
          "fast chase shot, cyberpunk courier on hoverbike flying through neon billboards and drone searchlights, blue hidden road appears in augmented vision, game trailer",
      },
      {
        shot: 2,
        duration: "5s",
        camera: "俯拍城市",
        visual: "新海城三层结构展开，现实街道与旧网街区重叠。",
        action: "任务标记从上城坠入地下数据庙。",
        caption: "切换城市的真实版本。",
        videoPrompt:
          "top down cyberpunk megacity map transforming into layered city, real streets overlap deleted old net districts, mission marker falls into underground data temple, stylish trailer shot",
      },
      {
        shot: 3,
        duration: "4s",
        camera: "肩后镜头",
        visual: "白塔审计官在数据中庭展开轨道炮。",
        action: "洛栖黑入无人机，形成临时护盾并冲刺反击。",
        caption: "把系统漏洞变成武器。",
        videoPrompt:
          "over shoulder combat shot, corporate cyberpunk boss unfolds arm railgun in white data atrium, heroine hacks drones into shield and dashes forward, cinematic gameplay trailer",
      },
    ],
    assetPrompts: {
      characterConceptArt: [
        "洛栖角色设定图，银发、透明机能雨衣、义眼、外骨骼腿部、数据箱背包、黑紫飞行摩托。",
        "白塔审计官 Boss 设定，白色西装、透明面罩、数据环、轨道炮义体，冷感企业美学。",
      ],
      environmentConceptArt: [
        "雨街低空车道开放世界主视觉，霓虹、人工雨、飞行摩托、无人机、密集东方都市招牌。",
        "旧网数据庙地下场景，旧服务器、电子牌位、香烟、线缆、暖色霓虹。",
      ],
      uiMockups: [
        "城市断层地图 UI，三层地图、任务标记、巡逻热区、现实与旧网切换滑块。",
        "义体改装界面，角色扫描、义体槽位、黑客脚本卡片、摩托性能曲线。",
      ],
      spriteSheet: [
        "洛栖第三人称动作参考表，奔跑、滑铲、拔枪、黑入手势、跳上飞行摩托、落地翻滚。",
      ],
      videoStoryboard: [
        "20 秒赛博朋克开放世界竖屏宣传分镜，飞行摩托追逐、城市断层地图、白塔 Boss 战。",
      ],
    },
    pitchDeckOutline: [
      "一句话定位：以城市地图切换为核心钩子的赛博朋克开放世界概念。",
      "目标用户：喜欢开放世界探索、赛博朋克美术、追逐任务和轻量黑客玩法的玩家。",
      "核心差异：地图不是菜单，而是改变任务路线、城市现实和战斗策略的系统。",
      "Demo 范围：一个雨街区块、一段飞行摩托追逐、一个白塔潜入任务、两个 UI 样板。",
      "传播素材：飞行摩托穿越霓虹城市、现实与旧网切换、企业 Boss 战三类短视频切片。",
    ],
    nextSteps: [
      "制作雨街低空车道和洛栖飞行摩托的概念素材包。",
      "将城市断层地图拆成可交互 UI 原型，验证地图切换体验。",
      "产出 20 秒追逐类宣传片分镜与动态镜头提示词。",
      "选择一个街区做可探索 Demo，验证垂直移动、追逐和潜入节奏。",
    ],
  },
  {
    slug: "pixel-rpg-adventure",
    title: "蘑菇邮差与星灯森林",
    subtitle: "像素 RPG 冒险游戏",
    genre: "像素 RPG / 叙事冒险 / 轻量回合战斗",
    artStyle: "16-bit 暖色像素、童话森林、手账式 UI、低压治愈",
    targetPlatform: "PC / Steam Deck / Switch 概念方向，移动端可做轻量版本",
    oneSentencePitch: "一名蘑菇邮差在星灯熄灭的森林里送出最后七封信，修复村民记忆并唤醒沉睡的月鲸。",
    originalIdea: "一个像素 RPG 冒险游戏，主角是蘑菇邮差，在森林、矿洞和湖边村庄送信、解谜、战斗，整体温暖但有一点忧伤。",
    worldview: {
      summary:
        "星灯森林靠树梢上的星灯记录所有居民的记忆。某晚星灯逐个熄灭，村民忘记名字、道路和彼此的约定。小邮差咕噜收到最后七封没有寄件人的信，必须把信送到正确的人手里。",
      setting:
        "由苔藓村、萤火矿洞、睡莲湖、风车坡和月鲸梦境组成的小型开放地图。世界以暖色像素表现，白天可探索，夜晚星灯改变路径和怪物。",
      conflict:
        "森林正在遗忘自己。村民害怕真相，影子邮差不断偷走信件，沉睡的月鲸则可能是星灯熄灭的原因，也可能是唯一能修复记忆的存在。",
      factions: ["苔藓村居民", "影子邮差", "萤火矿工", "湖边蛙乐队", "月鲸梦境"],
      toneKeywords: ["温暖", "像素", "送信", "记忆", "星灯", "小冒险", "治愈忧伤"],
    },
    coreGameplay: {
      summary:
        "以送信任务串联探索、对话、轻量解谜和回合战斗。每封信都会改变一个 NPC 的记忆，从而打开新道路或改变村庄状态。",
      loop:
        "接收信件，阅读线索，访问 NPC 和场景，解决小谜题或战斗，送达信件，解锁记忆片段和新区域。",
      combat:
        "轻量回合制，主角使用邮包道具和森林伙伴协作。攻击不是消灭敌人，而是安抚迷路的影子、修补破碎记忆或点亮星灯。",
      progression:
        "成长来自邮包容量、伙伴能力、邮票技能和手账页面。收集旧邮票能解锁新的对话选项和小型地图能力。",
      uniqueHook:
        "信件既是任务道具也是叙事拼图。玩家可以先后以不同顺序送信，影响 NPC 记起的内容和结局插画。",
    },
    protagonist: {
      name: "咕噜",
      identity: "苔藓村最年轻的蘑菇邮差，帽子上的红点会在接近正确收件人时发光。",
      appearance:
        "小小的蘑菇头、绿色邮差披肩、斜挎旧邮包、手持木质邮戳，走路时会掉下像素孢子光点。",
      abilities: ["信件感应", "邮戳护盾", "孢子跳跃", "伙伴召唤", "星灯修补"],
      visualPrompt:
        "cute mushroom mail carrier protagonist, 16-bit pixel art style, green postman cape, vintage mail satchel, wooden stamp staff, glowing red dots on mushroom cap, cozy fantasy forest, sprite character concept",
    },
    bosses: [
      {
        name: "影子邮差",
        concept: "咕噜的影子变成的竞争者，专门偷走没有送达的信。",
        visualStyle: "黑紫色像素剪影、反向邮包、发光空眼睛，移动时拖出残影。",
        mechanics: ["偷取玩家手牌式信件", "复制主角上一回合动作", "场地星灯熄灭后闪避提升", "点亮四角星灯可削弱它"],
        visualPrompt:
          "shadow mail carrier boss, black purple pixel silhouette, reversed mail satchel, glowing empty eyes, afterimage trail, cozy but mysterious 16-bit RPG boss sprite",
      },
      {
        name: "哭泣木偶树",
        concept: "忘记孩子们名字的古树，树枝上挂满未寄出的木偶。",
        visualStyle: "巨大老树、泪滴树脂、木偶吊线、暖色与阴影混合，悲伤但不恐怖。",
        mechanics: ["召唤木偶阻挡路径", "树脂雨降低行动速度", "正确读出信件片段可跳过攻击", "战斗结束后变成村庄邮局"],
        visualPrompt:
          "crying puppet tree boss, giant old tree with resin tears, hanging wooden puppets, warm pixel art palette, sad fairy tale RPG boss arena",
      },
    ],
    scenes: [
      {
        name: "苔藓村邮局",
        description: "主角出发点，圆形蘑菇屋、邮筒、公告板和手账教程集中展示游戏气质。",
        visualKeywords: ["蘑菇屋", "邮筒", "苔藓", "暖光", "村庄"],
        imagePrompt:
          "cozy 16-bit pixel art village post office, mushroom houses, tiny mailbox, mossy ground, warm lantern light, fantasy RPG starting area, top down view",
      },
      {
        name: "萤火矿洞",
        description: "中期探索区，矿车轨道、发光矿石和萤火虫构成解谜空间。",
        visualKeywords: ["矿洞", "萤火虫", "发光矿石", "轨道", "谜题"],
        imagePrompt:
          "16-bit pixel art firefly mine, glowing crystals, minecart tracks, tiny puzzle switches, warm teal and amber lighting, cozy RPG dungeon",
      },
      {
        name: "睡莲湖与月鲸",
        description: "结尾情绪场景，湖面倒映星灯，巨大的月鲸影子在水下缓慢游过。",
        visualKeywords: ["睡莲", "月鲸", "星灯倒影", "湖面", "终章"],
        imagePrompt:
          "pixel art lily pad lake at night, star lantern reflections, giant moon whale silhouette under water, emotional cozy RPG ending scene, 16-bit style",
      },
    ],
    uiScreens: [
      {
        name: "邮差手账",
        purpose: "展示任务、NPC 关系、信件线索和地图标记。",
        layoutDescription:
          "像翻开的纸质手账，左页是信件和邮票，右页是像素地图与 NPC 头像，边角有手绘贴纸和进度标记。",
        imagePrompt:
          "cozy pixel RPG journal UI, open notebook, letters and stamps on left page, pixel map and NPC portraits on right page, handmade stickers, warm readable interface",
      },
      {
        name: "回合战斗界面",
        purpose: "展示安抚式战斗，不强调杀伤。",
        layoutDescription:
          "底部为信件、邮戳、伙伴三类指令按钮，上方展示敌方情绪条和星灯亮度，整体像童话书边框。",
        imagePrompt:
          "16-bit pixel RPG turn based battle UI, command buttons for letters stamp companions, enemy emotion meter, star lantern brightness, fairy tale book border, cozy game mockup",
      },
    ],
    videoStoryboard: [
      {
        shot: 1,
        duration: "4s",
        camera: "俯视缓慢推进",
        visual: "苔藓村邮局亮着暖光，咕噜背起邮包出门。",
        action: "帽子红点闪烁，第一封信自动浮起。",
        caption: "当森林开始遗忘，邮差要把名字送回家。",
        videoPrompt:
          "top down slow push, cozy pixel mushroom village post office glowing warm light, tiny mushroom mail carrier leaves with satchel, first letter floats, wholesome RPG trailer",
      },
      {
        shot: 2,
        duration: "4s",
        camera: "横向切换场景蒙太奇",
        visual: "矿洞、湖边、风车坡快速闪过，NPC 头像逐个恢复颜色。",
        action: "咕噜把信交到不同角色手中。",
        caption: "每一封信，点亮一段记忆。",
        videoPrompt:
          "pixel art montage, firefly mine, lily lake, windmill hill, NPC portraits regain color as letters are delivered, cozy adventure game trailer",
      },
      {
        shot: 3,
        duration: "5s",
        camera: "水面仰拍",
        visual: "星灯倒映在湖面，月鲸从水下升起。",
        action: "所有信件化作星光飞向天空。",
        caption: "把森林的梦，寄给明天。",
        videoPrompt:
          "emotional pixel art lake scene, star lantern reflections, giant moon whale rises from water, letters become starlight flying into sky, cozy RPG finale trailer",
      },
    ],
    assetPrompts: {
      characterConceptArt: [
        "咕噜蘑菇邮差角色设定，16-bit 像素风，绿色披肩、旧邮包、木质邮戳、发光红点帽子。",
        "影子邮差 Boss 像素设定，黑紫剪影、反向邮包、空眼发光、残影移动帧。",
      ],
      environmentConceptArt: [
        "苔藓村邮局像素场景，蘑菇屋、邮筒、公告板、暖色灯光、清晨森林。",
        "睡莲湖终章场景，星灯倒影、月鲸水下剪影、蓝紫夜色、治愈情绪。",
      ],
      uiMockups: [
        "邮差手账 UI，翻开笔记本、信件、邮票、NPC 头像、像素地图、手绘贴纸。",
        "像素 RPG 安抚式回合战斗 UI，情绪条、星灯亮度、信件指令、伙伴按钮。",
      ],
      spriteSheet: [
        "咕噜 16-bit sprite sheet，待机、走路四方向、跳跃、递信、挥邮戳、受惊、开心、睡觉。",
      ],
      videoStoryboard: [
        "18 秒温暖像素 RPG 竖屏宣传分镜，邮局出发、送信蒙太奇、月鲸湖面终章。",
      ],
    },
    pitchDeckOutline: [
      "一句话定位：用送信和记忆修复串联探索的治愈像素 RPG。",
      "目标用户：喜欢 Stardew Valley、To the Moon、Eastward 气质的叙事冒险玩家。",
      "核心差异：信件顺序影响 NPC 记忆、地图变化和结局插画，适合轻量重玩。",
      "Demo 范围：苔藓村、萤火矿洞、影子邮差 Boss、邮差手账 UI、两种结局插画。",
      "商业路径：Steam 小体量精品、Switch 移植潜力、角色周边和像素短视频传播。",
    ],
    nextSteps: [
      "制作咕噜角色 sprite sheet 和苔藓村邮局首批像素资产。",
      "把邮差手账做成交互 UI 原型，验证信件线索和 NPC 关系展示。",
      "做一个 10 分钟可玩 Demo：送出第一封信、进入矿洞、遭遇影子邮差。",
      "生成治愈向宣传短片，用于 Steam 页面和社媒首发。",
    ],
  },
]

export function getDemoCase(slug: string) {
  return demoCases.find((item) => item.slug === slug)
}
