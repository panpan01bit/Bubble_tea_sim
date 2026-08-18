"use strict";

const TOTAL_START_CASH = 1000;
const BASE_UNIT_COST = 4;
const FIXED_COST = 120;
const TEACHER_STORAGE_KEY = "bubble-tea-classroom-v2";
const STUDENT_TOKEN_KEY = "bubble-tea-student-token-v2";

const EVENTS = [
  { id: "heatwave", name: "高温需求上行", type: "需求", category: "normal", newsCategory: "天气 · 城市", headline: "气象台连续第三日发布橙色高温预警", bulletin: "未来一周午后体感温度预计超过 38℃。校医院提醒减少长时间户外活动，校内制冰机和冷藏柜报修量较上周明显增加。", desc: "高温刺激冰饮消费，本轮市场总需求增加 25%。", prompt: "你从哪些细节判断需求会上升？高温同时会不会带来运营风险？", market: 1.25, marketing: 1, cost: 0, sensitivity: 0, fixed: 0, spoilage: 0 },
  { id: "rainstorm", name: "线下客流收缩", type: "需求", category: "normal", newsCategory: "天气 · 出行", headline: "本市启动防汛Ⅲ级响应，多条公交线路临时绕行", bulletin: "气象部门预计傍晚降雨最强，校方已将两场室外社团活动改为线上，南门步行街部分低洼路段正在设置挡水板。", desc: "强降雨压低到店客流，本轮市场总需求减少 30%。", prompt: "顾客还在，但消费场景发生了什么变化？", market: .70, marketing: 1, cost: 0, sensitivity: 0, fixed: 0, spoilage: 0 },
  { id: "influencer", name: "传播效率放大", type: "营销", category: "normal", newsCategory: "校园 · 媒体", headline: "校园生活类短视频本周播放量环比增长 160%", bulletin: "学生会发起“发现校园小店”内容征集，平台数据显示带定位的探店内容互动率最高，多家小店开始更新账号和门店照片。", desc: "校园内容进入流量窗口，本轮营销带来的获客效果提高 70%。", prompt: "新闻没有说一定会带来顾客，为什么营销效率仍可能变化？", market: 1.08, marketing: 1.7, cost: 0, sensitivity: 0, fixed: 0, spoilage: 0 },
  { id: "milk-price", name: "乳品成本传导", type: "供应", category: "black", newsCategory: "气候 · 农业", headline: "北方主要牧区降水量较常年同期偏低四成", bulletin: "当地饲草拍卖均价升至近三年高位，多家规模牧场开始调整奶牛日粮结构。乳企近期密集与上游重新确认第四季度采购排期。", desc: "饲草减产向乳品供应链传导，本轮每杯原料成本增加 ¥1.5。", prompt: "从草场到一杯奶茶，中间经历了怎样的成本传导链？", market: 1, marketing: 1, cost: 1.5, sensitivity: 0, fixed: 0, spoilage: 0 },
  { id: "price-war", name: "价格竞争加剧", type: "竞争", category: "normal", newsCategory: "商圈 · 招聘", headline: "南门原文具店围挡出现餐饮设备进场记录", bulletin: "施工方透露该铺位将配置制冰、封口与外卖取餐设备。招聘平台同时出现 12 个“饮品店开业储备”兼职岗位，培训期为三天。", desc: "新饮品竞争者进入商圈，消费者对高价更加敏感。", prompt: "哪些信息暗示竞争格局可能变化？降价是不是唯一回应？", market: 1.04, marketing: 1, cost: 0, sensitivity: .035, fixed: 0, spoilage: 0 },
  { id: "sports-day", name: "场景需求扩张", type: "需求", category: "normal", newsCategory: "校园 · 活动", headline: "校体育场下周延长开放，志愿者排班增至 240 人次", bulletin: "今年院系联赛报名人数创新高，赛事集中在午后进行。后勤处正在协调临时遮阳棚，并增加操场周边垃圾清运频次。", desc: "集中活动扩大即饮消费场景，本轮市场需求增加 35%，营销效率提高 15%。", prompt: "报名人数、时间和后勤安排分别透露了什么需求信号？", market: 1.35, marketing: 1.15, cost: 0, sensitivity: 0, fixed: 0, spoilage: 0 },
  { id: "power-cut", name: "冷链损耗", type: "运营", category: "black", newsCategory: "基础设施 · 运维", headline: "供电公司将对南门片区进行夜间线路切换", bulletin: "通知称切换时间可能因施工进度延长。商户群里有人询问备用电源租赁，附近便利店已提前转移部分冷藏商品。", desc: "线路切换影响冷藏，本轮已购原料有 25% 无法出售。", prompt: "为什么一条供电通知会影响库存策略，而不只是固定成本？", market: .95, marketing: 1, cost: 0, sensitivity: 0, fixed: 0, spoilage: .25 },
  { id: "food-rumor", name: "消费信任波动", type: "声誉", category: "black", newsCategory: "社交媒体 · 消费", headline: "本地论坛“现制饮品配料表”话题进入热榜", bulletin: "讨论最初来自一张来源不明的原料桶照片。帖子未点名具体门店，但评论区开始追问糖浆、植脂末和保存日期，相关搜索量持续上升。", desc: "品类信任受到影响，市场需求减少 18%；有效沟通更能修复顾客信心。", prompt: "当舆情没有点名企业时，主动回应还是保持沉默更合理？", market: .82, marketing: 1.45, cost: 0, sensitivity: 0, fixed: 0, spoilage: 0 },
  { id: "plastic-rule", name: "包装合规成本", type: "政策", category: "black", newsCategory: "政策 · 环保", headline: "一次性饮品包装管理意见结束公开征求", bulletin: "行业协会通知会员关注月底发布会。多家包装供应商开始清理旧规格库存，可降解杯盖询价量在三日内快速上升。", desc: "新包装要求落地，本轮每家公司增加 ¥45 合规成本。", prompt: "供应商行为为什么可能比正式文件更早释放政策信号？", market: 1, marketing: 1, cost: 0, sensitivity: 0, fixed: 45, spoilage: 0 },
  { id: "fruit-logistics", name: "水果供应收紧", type: "供应", category: "black", newsCategory: "物流 · 农业", headline: "南方强对流天气导致两条省际高速间歇封闭", bulletin: "柑橘主产区部分仓库暂停装车，冷链司机群显示平均等待时间已超过 18 小时。批发市场到货档口数量较昨日减少。", desc: "水果与冷链供应趋紧，本轮每杯综合原料成本增加 ¥0.8，市场供应略有收缩。", prompt: "交通信息如何一步步传导到果茶菜单和采购价格？", market: .96, marketing: 1, cost: .8, sensitivity: 0, fixed: 0, spoilage: 0 },
  { id: "saving-trend", name: "消费趋于谨慎", type: "需求", category: "normal", newsCategory: "校园 · 消费", headline: "校园二手平台交易量创新高，“一周省钱挑战”走红", bulletin: "平台称教材、日用品和餐券转让增幅最大。多个学生社群开始分享月度预算模板，食堂平价套餐搜索次数同步上升。", desc: "学生消费更加谨慎，本轮市场需求减少 5%，并对高价更敏感。", prompt: "宏观的消费情绪会如何影响不同定价路线？", market: .95, marketing: 1, cost: 0, sensitivity: .028, fixed: 0, spoilage: 0 },
  { id: "night-market", name: "夜间场景增长", type: "机会", category: "normal", newsCategory: "校园 · 社团", headline: "社团联合会新增三晚户外展示时段", bulletin: "首批摊位申请数量超过原计划两倍，舞台节目单延长至 21:30。后勤处要求参与商户自行解决照明和垃圾分类。", desc: "夜间消费场景扩大，本轮市场需求增加 28%，但运营支出增加 ¥15。", prompt: "新增客流和新增运营负担，应该如何同时计入决策？", market: 1.28, marketing: 1.1, cost: 0, sensitivity: 0, fixed: 15, spoilage: 0 },
  { id: "exam-week", name: "消费场景迁移", type: "需求", category: "normal", newsCategory: "校园 · 教务", headline: "图书馆座位预约开放时间提前至早上六点", bulletin: "期中考试安排集中发布，晚间自习室延长开放。校内运动场预约量下降，外卖平台“送到楼下”备注明显增多。", desc: "线下闲逛型消费减少，本轮市场需求下降 14%，营销效率略有减弱。", prompt: "学生没有消失，但时间和活动半径发生了什么变化？", market: .86, marketing: .9, cost: 0, sensitivity: .012, fixed: 0, spoilage: 0 },
  { id: "fuel-price", name: "履约成本上升", type: "成本", category: "normal", newsCategory: "能源 · 物流", headline: "成品油价格调整窗口开启，同城配送平台更新计价说明", bulletin: "新说明增加了高峰与远距离附加项。包装批发商通知，小批量订单的免费配送门槛将在下周调整。", desc: "配送与采购履约费用上升，本轮固定成本增加 ¥30，每杯原料成本增加 ¥0.3。", prompt: "为什么能源价格既可能影响固定支出，也可能影响单杯成本？", market: 1, marketing: 1, cost: .3, sensitivity: 0, fixed: 30, spoilage: 0 },
  { id: "algorithm-shift", name: "线上触达减弱", type: "营销", category: "normal", newsCategory: "平台 · 算法", headline: "本地生活平台调整内容推荐规则", bulletin: "新规则提高长期互动和收藏的权重，单次曝光型内容的自然流量明显波动。多家校园商户反馈昨日发布内容触达低于平时。", desc: "平台规则变化降低短期投放效率，本轮营销效果减少 25%。", prompt: "当渠道规则改变，继续增加同一种营销投入是否合理？", market: 1, marketing: .75, cost: 0, sensitivity: 0, fixed: 0, spoilage: 0 }
];

const BUSINESS_KNOWLEDGE = [
  { category: "经营基础", title: "机会成本", definition: "选择一个方案时，被放弃的最佳替代方案所能带来的价值，就是这次选择的机会成本。它不一定出现在账单上，但会影响决策质量。", example: "把 ¥100 投入营销，就意味着这 ¥100 不能同时用于多进 25 杯原料；被放弃的潜在销售，就是营销决策的一部分成本。", question: "你们本轮投入最多的资源，原本还可以用在哪里？" },
  { category: "成本管理", title: "盈亏平衡点", definition: "当总收入刚好等于总成本时，企业不赚也不亏。达到这一点所需要的销量，就是盈亏平衡销量。", example: "若每杯售价 ¥14、原料 ¥4、固定与营销支出共 ¥180，那么至少要卖出 18 杯左右才能覆盖成本。", question: "按你们现在的定价，本轮至少要卖出多少杯才不亏？" },
  { category: "市场营销", title: "价格弹性", definition: "价格弹性描述顾客需求对价格变化有多敏感。弹性越高，小幅涨价就越可能带来明显的销量下降。", example: "考试周或低价竞品入场时，学生通常更在意价格；同样涨价 ¥2，流失的顾客可能比平时更多。", question: "你们的顾客为什么愿意接受更高或更低的价格？" },
  { category: "财务思维", title: "利润不等于现金流", definition: "利润衡量一段时间的经营成果，现金流关注钱何时真正流入或流出。企业有利润，也可能因为现金周转不及时而陷入困境。", example: "本游戏是即时收款，所以利润与现金变化接近；真实奶茶店还可能先付房租和货款、后收到平台结算。", question: "如果外卖平台 30 天后才结算，本轮决策需要怎样改变？" },
  { category: "决策科学", title: "沉没成本", definition: "已经发生且无法收回的成本叫沉没成本。理性决策应该关注未来的新增收益与成本，而不是为了“不浪费过去投入”继续加码。", example: "已经花掉的宣传费无法收回。如果活动效果很差，不应只因为前面投了很多钱就继续追加预算。", question: "你们有没有因为上一轮投入很多，而影响这一轮的判断？" },
  { category: "供应链", title: "安全库存", definition: "为应对需求波动或供应延迟而额外保留的库存叫安全库存。它能降低缺货风险，但也会占用资金并增加损耗。", example: "多备鲜奶可能抓住突发客流，但当天卖不完就报废；这正是服务水平和库存成本之间的权衡。", question: "如果损耗成本降低一半，你们会增加多少进货？" },
  { category: "竞争战略", title: "差异化优势", definition: "企业通过产品、体验、品牌或服务形成顾客愿意选择、且竞争者不易复制的独特价值，这就是差异化优势。", example: "高价并不自动代表高端。只有口味、包装、服务或品牌故事能支撑溢价时，高价路线才更可持续。", question: "除了降价，你们的公司还能靠什么赢得顾客？" },
  { category: "市场营销", title: "边际收益递减", definition: "当其他条件不变时，持续增加某项投入，后来每增加一单位所带来的新增收益往往会越来越少。", example: "从零开始投入第一笔营销费可能很有效，但预算从 ¥180 增加到 ¥200，不一定还能带来同等比例的新顾客。", question: "你们认为营销预算从什么时候开始“不太划算”？" },
  { category: "商业模型", title: "单位经济模型", definition: "把收入与变动成本拆到每一位顾客或每一件产品上，可以判断企业每完成一单是否真正创造价值。", example: "单杯贡献毛利约等于售价减去单杯原料成本。贡献毛利越高，覆盖固定成本所需的销量越少。", question: "你们每多卖一杯，能为覆盖固定成本贡献多少钱？" },
  { category: "竞争战略", title: "规模经济", definition: "随着产量增加，固定成本被更多产品分摊，平均成本可能下降，这种现象叫规模经济。但扩大规模也可能带来管理与库存风险。", example: "现实中大批采购可能降低原料单价；但本游戏的鲜奶会报废，盲目追求销量仍可能造成亏损。", question: "什么条件满足后，扩大经营规模才真正有利？" },
  { category: "风险管理", title: "情景分析", definition: "分别假设乐观、正常和悲观三种情况，再观察决策结果，可以帮助企业理解风险边界，而不是只押注一个预测。", example: "进货前可以分别估计客流增加 30%、保持不变和减少 30% 时的销量、损耗与现金余额。", question: "你们当前决策在最坏情况下还能承受多大亏损？" },
  { category: "市场洞察", title: "市场细分", definition: "把需求、偏好或行为相近的顾客划为一组，并为其中最值得服务的群体设计产品和营销，这就是市场细分。", example: "赶时间的学生、追求低糖的学生和喜欢拍照分享的学生，可能重视完全不同的产品价值。", question: "你们最想服务哪一类学生？他们最在意什么？" }
];

const dom = id => document.getElementById(id);
const money = value => `${value < 0 ? "-" : ""}¥${Math.abs(Math.round(value)).toLocaleString("zh-CN")}`;
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const randomBetween = (min, max) => min + Math.random() * (max - min);
const esc = value => String(value ?? "").replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));

let teacherPeer = null;
let teacherState = null;
let teacherConnections = new Map();
let studentPeer = null;
let studentConnection = null;
let studentSnapshot = null;
let studentRenderedRound = -1;
let studentRoomCode = "";
let studentName = "";
let studentToken = "";
let toastTimer = null;
let intentionalExit = false;
let reconnectTimer = null;
let lastKnowledgeIndex = -1;

function showToast(message) {
  const toast = dom("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2300);
}

function showRandomKnowledge() {
  let index = Math.floor(Math.random() * BUSINESS_KNOWLEDGE.length);
  if (BUSINESS_KNOWLEDGE.length > 1 && index === lastKnowledgeIndex) index = (index + 1) % BUSINESS_KNOWLEDGE.length;
  lastKnowledgeIndex = index;
  const item = BUSINESS_KNOWLEDGE[index];
  dom("knowledgeCategory").textContent = item.category;
  dom("knowledgeTitle").textContent = item.title;
  dom("knowledgeDefinition").textContent = item.definition;
  dom("knowledgeExample").textContent = item.example;
  dom("knowledgeQuestion").textContent = item.question;
}

function openKnowledge() {
  showRandomKnowledge();
  dom("knowledgeModal").classList.remove("hidden");
  dom("knowledgeModal").querySelector(".modal-close").focus();
}

function closeKnowledge() {
  dom("knowledgeModal").classList.add("hidden");
}

function switchView(viewId) {
  ["welcomeView", "teacherView", "studentView"].forEach(id => dom(id).classList.toggle("hidden", id !== viewId));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setRoleStep(role) {
  dom("roleStep").classList.add("hidden");
  dom("teacherSetup").classList.toggle("hidden", role !== "teacher");
  dom("studentSetup").classList.toggle("hidden", role !== "student");
  setTimeout(() => (role === "teacher" ? dom("classNameInput") : dom("roomCodeInput")).focus(), 40);
}

function resetRoleStep() {
  dom("roleStep").classList.remove("hidden");
  dom("teacherSetup").classList.add("hidden");
  dom("studentSetup").classList.add("hidden");
}

function randomCode() {
  const chars = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function hostPeerId(code) {
  return `bubble-tea-class-${code.toLowerCase()}`;
}

function getStudentToken(roomCode) {
  const storageKey = `${STUDENT_TOKEN_KEY}:${roomCode}`;
  let token = null;
  try { token = localStorage.getItem(storageKey); } catch (_) { /* continue with an in-memory identity */ }
  if (!token) {
    token = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    try { localStorage.setItem(storageKey, token); } catch (_) { /* reconnect recovery will be unavailable */ }
  }
  return token;
}

function peerAvailable() {
  if (typeof window.Peer === "undefined") {
    showToast("实时连接组件加载失败，请检查网络后刷新");
    return false;
  }
  return true;
}

function nowLabel() {
  return new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}

function addTeacherLog(title, detail) {
  if (!teacherState) return;
  teacherState.logs.unshift({ title, detail, time: nowLabel() });
  teacherState.logs = teacherState.logs.slice(0, 50);
}

function saveTeacherState() {
  if (!teacherState) return;
  try { localStorage.setItem(TEACHER_STORAGE_KEY, JSON.stringify(teacherState)); } catch (_) { /* storage is optional */ }
}

function storedTeacherState() {
  try {
    const value = JSON.parse(localStorage.getItem(TEACHER_STORAGE_KEY) || "null");
    return value && value.roomCode && value.phase !== "finished" ? value : null;
  } catch (_) { return null; }
}

function createTeacherState(className, totalRounds) {
  return {
    version: 2,
    className,
    roomCode: randomCode(),
    totalRounds,
    round: 0,
    phase: "lobby",
    currentEventId: null,
    marketSize: 0,
    teams: [],
    usedEvents: [],
    logs: [{ title: "教室已创建", detail: "等待学生输入教室号并创建公司。", time: nowLabel() }]
  };
}

function setupTeacherPeer(isResume = false, attempt = 0) {
  if (!peerAvailable()) return;
  dom("teacherNetBadge").className = "status-pill";
  dom("teacherNetBadge").innerHTML = "<i></i> 正在创建教室";
  const peer = new Peer(hostPeerId(teacherState.roomCode), { debug: 0 });
  teacherPeer = peer;

  peer.on("open", () => {
    dom("teacherNetBadge").className = "status-pill online";
    dom("teacherNetBadge").innerHTML = "<i></i> 教室在线";
    teacherState.teams.forEach(team => { if (!team.demo) team.connected = false; });
    saveTeacherState();
    renderTeacher();
  });

  peer.on("connection", connection => registerTeacherConnection(connection));

  peer.on("disconnected", () => {
    dom("teacherNetBadge").className = "status-pill offline";
    dom("teacherNetBadge").innerHTML = "<i></i> 正在重连";
    setTimeout(() => { if (teacherPeer && teacherPeer.disconnected && !teacherPeer.destroyed) teacherPeer.reconnect(); }, 1200);
  });

  peer.on("error", error => {
    if (error.type === "unavailable-id" && attempt < 4) {
      peer.destroy();
      if (!isResume) teacherState.roomCode = randomCode();
      renderTeacher();
      setTimeout(() => setupTeacherPeer(isResume, attempt + 1), isResume ? 1400 : 300);
      return;
    }
    dom("teacherNetBadge").className = "status-pill offline";
    dom("teacherNetBadge").innerHTML = "<i></i> 连接异常";
    showToast(error.type === "unavailable-id" ? "原教室号仍被占用，请稍后再恢复" : "教室连接异常，请检查网络");
  });
}

function registerTeacherConnection(connection) {
  let connectionToken = null;
  connection.on("data", message => {
    if (!message || typeof message !== "object") return;
    if (message.type === "join") {
      const token = String(message.token || "").slice(0, 80);
      const name = String(message.name || "").trim().slice(0, 14);
      if (!token || !name) return connection.send({ type: "rejected", reason: "公司名称或设备身份无效" });
      let team = teacherState.teams.find(item => item.id === token);
      if (!team && teacherState.phase !== "lobby") {
        connection.send({ type: "rejected", reason: "比赛已经开始，暂不接受新公司加入" });
        return;
      }
      if (!team) {
        if (teacherState.teams.some(item => item.name.toLowerCase() === name.toLowerCase())) {
          connection.send({ type: "rejected", reason: "这个公司名已被使用，请换一个名称" });
          return;
        }
        team = { id: token, name, cash: TOTAL_START_CASH, connected: true, demo: false, decision: null, history: [], lastResult: null };
        teacherState.teams.push(team);
        addTeacherLog(`${name} 加入教室`, "公司已领取 ¥1,000 启动资金。 ");
      } else {
        team.connected = true;
        addTeacherLog(`${team.name} 已重新连接`, "历史成绩与本轮状态已经恢复。 ");
      }
      connectionToken = token;
      const old = teacherConnections.get(token);
      if (old && old !== connection && old.open) old.close();
      teacherConnections.set(token, connection);
      saveTeacherState();
      renderTeacher();
      broadcastSnapshots();
      return;
    }
    if (message.type === "decision" && connectionToken) receiveDecision(connectionToken, message);
  });

  connection.on("close", () => {
    if (!connectionToken || teacherConnections.get(connectionToken) !== connection) return;
    teacherConnections.delete(connectionToken);
    const team = teacherState?.teams.find(item => item.id === connectionToken);
    if (team) {
      team.connected = false;
      addTeacherLog(`${team.name} 暂时离线`, "重新打开页面并使用同一设备加入，可恢复席位。 ");
      saveTeacherState();
      renderTeacher();
      broadcastSnapshots();
    }
  });
  connection.on("error", () => { /* close event updates the UI */ });
}

function receiveDecision(token, message) {
  if (teacherState.phase !== "deciding" || Number(message.round) !== teacherState.round) return;
  const team = teacherState.teams.find(item => item.id === token);
  if (!team || team.decision) return;
  const raw = message.decision || {};
  const decision = {
    price: clamp(Math.round(Number(raw.price) || 0), 8, 24),
    stock: clamp(Math.round((Number(raw.stock) || 0) / 10) * 10, 0, 200),
    marketing: clamp(Math.round((Number(raw.marketing) || 0) / 10) * 10, 0, 200)
  };
  const baseSpend = decision.stock * BASE_UNIT_COST + decision.marketing + FIXED_COST;
  if (baseSpend > team.cash) {
    const conn = teacherConnections.get(token);
    if (conn?.open) conn.send({ type: "decision-error", reason: "预计支出超过当前现金" });
    return;
  }
  team.decision = decision;
  addTeacherLog(`${team.name} 已锁定决策`, `第 ${teacherState.round} 轮决策已提交，等待统一结算。`);
  saveTeacherState();
  renderTeacher();
  broadcastSnapshots();
}

function publicSnapshotFor(token) {
  const reveal = teacherState.phase === "settled" || teacherState.phase === "finished";
  const event = currentEvent();
  const ranked = rankedTeams();
  const team = teacherState.teams.find(item => item.id === token);
  return {
    type: "snapshot",
    className: teacherState.className,
    roomCode: teacherState.roomCode,
    totalRounds: teacherState.totalRounds,
    round: teacherState.round,
    phase: teacherState.phase,
    news: teacherState.phase === "lobby" ? null : { category: event.newsCategory, headline: event.headline, bulletin: event.bulletin },
    event: reveal ? event : null,
    marketSize: reveal ? teacherState.marketSize : null,
    teams: ranked.map((item, index) => ({
      id: item.id,
      name: item.name,
      cash: item.cash,
      connected: item.connected || item.demo,
      submitted: Boolean(item.decision),
      lastProfit: reveal && item.lastResult ? item.lastResult.profit : null,
      rank: index + 1
    })),
    myTeam: team ? {
      id: team.id, name: team.name, cash: team.cash, decision: team.decision,
      lastResult: reveal ? team.lastResult : null,
      history: teacherState.phase === "finished" ? team.history : []
    } : null
  };
}

function broadcastSnapshots() {
  teacherConnections.forEach((connection, token) => {
    if (connection.open) {
      try { connection.send(publicSnapshotFor(token)); } catch (_) { /* connection may close between checks */ }
    }
  });
}

function currentEvent() {
  return EVENTS.find(event => event.id === teacherState?.currentEventId) || EVENTS[0];
}

function chooseEvent() {
  const unused = EVENTS.filter(event => !teacherState.usedEvents.includes(event.id));
  const preferred = teacherState.round === 3
    ? unused.filter(event => event.category === "black")
    : unused.filter(event => event.category === "normal");
  const pool = preferred.length ? preferred : (unused.length ? unused : EVENTS);
  return pool[Math.floor(Math.random() * pool.length)];
}

function generateDemoDecision(team, index) {
  const profiles = [
    { price: [9, 12], stock: [120, 170], marketing: [20, 70] },
    { price: [15, 19], stock: [70, 120], marketing: [100, 180] },
    { price: [12, 16], stock: [80, 150], marketing: [40, 120] }
  ];
  const profile = profiles[index % profiles.length];
  let stock = Math.round(randomBetween(profile.stock[0], profile.stock[1]) / 10) * 10;
  let marketing = Math.round(randomBetween(profile.marketing[0], profile.marketing[1]) / 10) * 10;
  while (stock * BASE_UNIT_COST + marketing + FIXED_COST > team.cash && stock > 0) stock -= 10;
  while (stock * BASE_UNIT_COST + marketing + FIXED_COST > team.cash && marketing > 0) marketing -= 10;
  return { price: Math.round(randomBetween(profile.price[0], profile.price[1])), stock, marketing };
}

function startRound() {
  teacherState.round += 1;
  teacherState.phase = "deciding";
  teacherState.currentEventId = chooseEvent().id;
  teacherState.marketSize = Math.round(92 * Math.max(1, teacherState.teams.length) * randomBetween(.94, 1.08));
  teacherState.teams.forEach((team, index) => {
    team.decision = team.demo ? generateDemoDecision(team, index) : null;
    team.lastResult = null;
  });
  addTeacherLog(`第 ${teacherState.round} 轮开始`, `预计全市场基础需求约 ${teacherState.marketSize} 杯，等待各公司提交。`);
  saveTeacherState();
  renderTeacher();
  broadcastSnapshots();
}

function settleRound(force = false) {
  if (teacherState.phase !== "deciding") return;
  const missing = teacherState.teams.filter(team => !team.decision);
  if (missing.length && !force) return;
  missing.forEach(team => { team.decision = { price: 14, stock: 0, marketing: 0, auto: true }; });
  const event = currentEvent();
  const scores = teacherState.teams.map(team => {
    const d = team.decision;
    const priceFit = clamp(1.86 - d.price / 13 - event.sensitivity * Math.max(0, d.price - 12), .06, 1.35);
    const marketingLift = 1 + Math.sqrt(d.marketing / 100) * .43 * event.marketing;
    return Math.max(.03, priceFit * marketingLift);
  });
  const scoreTotal = scores.reduce((sum, value) => sum + value, 0);
  const totalDemand = Math.round(teacherState.marketSize * event.market);

  teacherState.teams.forEach((team, index) => {
    const d = team.decision;
    const fairDemand = totalDemand * scores[index] / scoreTotal;
    const demand = Math.max(0, Math.round(fairDemand * randomBetween(.94, 1.06)));
    const usableStock = Math.floor(d.stock * (1 - event.spoilage));
    const sales = Math.min(usableStock, demand);
    const revenue = sales * d.price;
    const cost = d.stock * (BASE_UNIT_COST + event.cost) + d.marketing + FIXED_COST + event.fixed;
    const profit = revenue - cost;
    const result = {
      round: teacherState.round, price: d.price, stock: d.stock, marketing: d.marketing,
      demand, sales, waste: d.stock - sales, revenue, cost, profit, cashAfter: team.cash + profit,
      auto: Boolean(d.auto), eventId: event.id
    };
    team.cash += profit;
    team.lastResult = result;
    team.history.push(result);
  });

  teacherState.phase = teacherState.round >= teacherState.totalRounds ? "finished" : "settled";
  if (!teacherState.usedEvents.includes(event.id)) teacherState.usedEvents.push(event.id);
  const winner = rankedTeams()[0];
  addTeacherLog(`${event.name} · 第 ${teacherState.round} 轮已结算`, `${winner.name} 暂列第一，现金余额 ${money(winner.cash)}。`);
  saveTeacherState();
  renderTeacher();
  broadcastSnapshots();
}

function rankedTeams() {
  return [...(teacherState?.teams || [])].sort((a, b) => b.cash - a.cash || a.name.localeCompare(b.name, "zh-CN"));
}

function phaseCopy() {
  if (!teacherState) return {};
  const missing = teacherState.teams.filter(team => !team.decision).length;
  if (teacherState.phase === "lobby") return { badge: "候场", title: "等待公司入场", desc: "把教室号展示给学生。学生选择“我是学生”后即可加入。", market: "等待开局" };
  if (teacherState.phase === "deciding") return { badge: "研判中", title: `第 ${teacherState.round} 轮 · 新闻研判与决策`, desc: missing ? `商业快讯已同步，还有 ${missing} 支公司正在判断新闻背后的经营影响。` : "所有公司已提交，可以揭示新闻的真实影响并统一结算。", market: "快讯已发布" };
  if (teacherState.phase === "settled") return { badge: "已结算", title: `第 ${teacherState.round} 轮 · 市场已收盘`, desc: `${currentEvent().name} 已揭晓。先用排行榜做一次简短复盘，再进入下一轮。`, market: currentEvent().name };
  return { badge: "已结束", title: "经营赛结束 · 进入课堂复盘", desc: "排行榜已经定格，可导出完整成绩与每轮决策记录。", market: currentEvent().name };
}

function renderTeacher() {
  if (!teacherState) return;
  const copy = phaseCopy();
  const submitted = teacherState.teams.filter(team => team.decision).length;
  dom("teacherClassName").textContent = teacherState.className;
  dom("teacherRoomCode").textContent = teacherState.roomCode;
  dom("teacherStageTitle").textContent = copy.title;
  dom("teacherStageDesc").textContent = copy.desc;
  dom("teacherRoundBig").textContent = teacherState.round;
  dom("teacherRoundTotal").textContent = `/ ${teacherState.totalRounds}`;
  dom("teamCount").textContent = teacherState.teams.length;
  dom("submitCount").textContent = `${submitted} / ${teacherState.teams.length}`;
  dom("marketStatus").textContent = copy.market;
  dom("phaseBadge").textContent = copy.badge;
  dom("lobbyControl").classList.toggle("hidden", teacherState.phase !== "lobby");
  dom("roundControl").classList.toggle("hidden", teacherState.phase !== "deciding");
  dom("settledControl").classList.toggle("hidden", teacherState.phase !== "settled");
  dom("finishedControl").classList.toggle("hidden", teacherState.phase !== "finished");
  dom("startGameButton").disabled = teacherState.teams.length === 0;

  if (teacherState.phase === "deciding") {
    populateEventSelect();
    renderEventPreview();
    const allDone = teacherState.teams.length > 0 && submitted === teacherState.teams.length;
    dom("eventSelect").disabled = submitted > 0;
    dom("settleButton").disabled = !allDone;
    dom("settleButton").innerHTML = allDone ? `揭晓「${esc(currentEvent().name)}」并结算 <span>→</span>` : `等待提交 · ${submitted}/${teacherState.teams.length}`;
    dom("forceSettleButton").classList.toggle("hidden", submitted === teacherState.teams.length || submitted === 0);
  }
  if (teacherState.phase === "settled") {
    const top = rankedTeams()[0];
    dom("teacherRoundSummary").innerHTML = `<strong>${esc(currentEvent().name)} · ${esc(top.name)} 暂列第一</strong><p>${esc(currentEvent().prompt)} 建议请一支盈利公司和一支亏损公司分别解释决策逻辑。</p>`;
    dom("nextRoundButton").innerHTML = `进入第 ${teacherState.round + 1} 轮 <span>→</span>`;
  }
  renderTeacherRoster();
  renderManualAdjust();
  renderLeaderboard(dom("teacherLeaderboard"), rankedTeams().map((team, index) => ({ ...team, rank: index + 1, lastProfit: team.lastResult?.profit })));
  renderTeacherLog();
}

function populateEventSelect() {
  const select = dom("eventSelect");
  if (select.options.length === 0) {
    select.innerHTML = EVENTS.map(event => `<option value="${event.id}">${event.category === "black" ? "深层信号 · " : ""}${esc(event.name)} · ${esc(event.type)}</option>`).join("");
  }
  select.value = teacherState.currentEventId;
}

function renderEventPreview() {
  const event = currentEvent();
  dom("teacherEventPreview").innerHTML = `
    <div class="preview-news"><small>学生看到的快讯 · ${esc(event.newsCategory)}</small><b>${esc(event.headline)}<span>公开信息</span></b><p>${esc(event.bulletin)}</p></div>
    <div class="teacher-answer"><small>教师底牌 · 结算后揭示</small><strong>${esc(event.name)}</strong><p>${esc(event.desc)}</p><em>课堂追问：${esc(event.prompt)}</em></div>`;
}

function renderTeacherRoster() {
  const roster = dom("teacherRoster");
  dom("rosterHint").textContent = teacherState.teams.length ? `${teacherState.teams.length} 支公司` : "等待加入";
  roster.classList.toggle("empty-state", teacherState.teams.length === 0);
  roster.innerHTML = teacherState.teams.length ? teacherState.teams.map(team => `
    <div class="roster-card">
      <span class="avatar">${esc(team.name.slice(0, 1))}</span>
      <div><b>${esc(team.name)}</b><span class="connection-label ${(team.connected || team.demo) ? "" : "offline"}"><i></i>${team.demo ? "演示公司" : team.connected ? "在线" : "已掉线"}</span></div>
      <span class="submission-chip ${team.decision ? "done" : ""}">${team.decision ? "已提交" : teacherState.phase === "lobby" ? money(team.cash) : "待提交"}</span>
    </div>`).join("") : "还没有公司加入";
}

function renderManualAdjust() {
  const form = dom("manualAdjustForm");
  const selectable = (teacherState.phase === "settled" || teacherState.phase === "finished") && teacherState.teams.length > 0;
  form.classList.toggle("hidden", !selectable);
  if (!selectable) return;
  const select = dom("adjustTeamSelect");
  const previous = select.value;
  select.innerHTML = rankedTeams().map(team => `<option value="${esc(team.id)}">${esc(team.name)} · ${money(team.cash)}</option>`).join("");
  if (previous && teacherState.teams.some(team => team.id === previous)) select.value = previous;
}

function applyManualAdjust(amountRaw) {
  const team = teacherState.teams.find(item => item.id === dom("adjustTeamSelect").value);
  if (!team) return showToast("请先选择要调整的公司");
  const amount = Math.round(Number(amountRaw));
  if (!Number.isFinite(amount) || amount === 0) return showToast("请输入一个非零金额（正数增加、负数减少）");
  const before = team.cash;
  team.cash += amount;
  if (!Array.isArray(team.adjustments)) team.adjustments = [];
  team.adjustments.push({ round: teacherState.round, amount, cashAfter: team.cash });
  addTeacherLog(`手工调整 · ${team.name}`, `${money(before)} → ${money(team.cash)}（${amount > 0 ? "+" : ""}${money(amount)}）。`);
  saveTeacherState();
  renderTeacher();
  broadcastSnapshots();
  showToast(`已调整 ${team.name}：${amount > 0 ? "+" : ""}${money(amount)}`);
}

function renderTeacherLog() {
  dom("teacherLog").innerHTML = teacherState.logs.map(item => `<div class="log-entry"><time>${esc(item.time)}</time><b>${esc(item.title)}</b><p>${esc(item.detail)}</p></div>`).join("");
}

function renderLeaderboard(container, teams, myId = null) {
  if (!teams.length) {
    container.classList.add("empty-state");
    container.innerHTML = "开局后显示实时排名";
    return;
  }
  container.classList.remove("empty-state");
  container.innerHTML = teams.map((team, index) => {
    const rank = team.rank || index + 1;
    const profit = team.lastProfit;
    const subtitle = profit == null ? (team.submitted ? "本轮已提交" : "经营准备中") : `本轮 ${profit >= 0 ? "盈利" : "亏损"}`;
    return `<div class="leader-row ${team.id === myId ? "me" : ""}">
      <span class="rank-num">${rank}</span>
      <div class="leader-name"><b>${esc(team.name)}${team.id === myId ? " · 我们" : ""}</b><small>${esc(subtitle)}</small></div>
      <span class="profit ${profit < 0 ? "loss" : ""}">${profit == null ? "—" : `${profit >= 0 ? "+" : ""}${money(profit)}`}</span>
      <strong class="leader-cash">${money(team.cash)}</strong>
    </div>`;
  }).join("");
}

function startStudentConnection(roomCode, name) {
  if (!peerAvailable()) return;
  studentRoomCode = roomCode;
  studentName = name;
  studentToken = getStudentToken(roomCode);
  intentionalExit = false;
  switchView("studentView");
  dom("studentCompanyHeader").textContent = name;
  dom("studentRoom").textContent = roomCode;
  setStudentNetwork("connecting", "正在连接老师");
  studentPeer = new Peer(undefined, { debug: 0 });
  studentPeer.on("open", connectStudentHost);
  studentPeer.on("disconnected", () => {
    setStudentNetwork("offline", "连接中断");
    scheduleStudentReconnect();
  });
  studentPeer.on("error", error => {
    if (error.type === "peer-unavailable") {
      setStudentNetwork("offline", "未找到教室");
      showToast("未找到这个教室，请核对教室号或请老师保持页面开启");
      scheduleStudentReconnect();
    } else {
      setStudentNetwork("offline", "连接异常");
    }
  });
}

function connectStudentHost() {
  if (!studentPeer?.open || intentionalExit) return;
  clearTimeout(reconnectTimer);
  const connection = studentPeer.connect(hostPeerId(studentRoomCode), { reliable: true, serialization: "json" });
  studentConnection = connection;
  connection.on("open", () => {
    setStudentNetwork("online", "已连接老师");
    connection.send({ type: "join", token: studentToken, name: studentName });
  });
  connection.on("data", message => {
    if (!message || typeof message !== "object") return;
    if (message.type === "snapshot") {
      studentSnapshot = message;
      renderStudent();
    } else if (message.type === "rejected") {
      showToast(message.reason || "无法加入教室");
      dom("studentNetBadge").className = "status-pill offline";
      dom("studentNetBadge").innerHTML = `<i></i> ${esc(message.reason || "加入失败")}`;
    } else if (message.type === "decision-error") {
      showToast(message.reason || "决策提交失败");
      setDecisionLocked(false);
    }
  });
  connection.on("close", () => {
    if (intentionalExit) return;
    setStudentNetwork("offline", "与老师断开");
    scheduleStudentReconnect();
  });
}

function scheduleStudentReconnect() {
  clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(() => {
    if (intentionalExit || !studentPeer) return;
    if (studentPeer.disconnected && !studentPeer.destroyed) studentPeer.reconnect();
    else if (studentPeer.open) connectStudentHost();
  }, 1800);
}

function setStudentNetwork(status, text) {
  dom("studentNetBadge").className = `status-pill ${status === "online" ? "online" : status === "offline" ? "offline" : ""}`;
  dom("studentNetBadge").innerHTML = `<i></i> ${esc(text)}`;
}

function renderStudent() {
  const snapshot = studentSnapshot;
  if (!snapshot?.myTeam) return;
  const me = snapshot.myTeam;
  dom("studentCompanyHeader").textContent = me.name;
  dom("studentClassHeader").textContent = snapshot.className;
  dom("studentRoom").textContent = snapshot.roomCode;
  dom("studentRound").textContent = snapshot.round ? `${snapshot.round} / ${snapshot.totalRounds}` : `0 / ${snapshot.totalRounds}`;
  dom("studentCash").textContent = money(me.cash);
  const rank = snapshot.teams.find(team => team.id === me.id)?.rank;
  dom("studentRank").textContent = rank ? `第 ${rank} 名` : "—";
  renderLeaderboard(dom("studentLeaderboard"), snapshot.teams, me.id);
  dom("studentWaiting").classList.toggle("hidden", snapshot.phase !== "lobby");
  dom("studentGame").classList.toggle("hidden", !["deciding", "settled"].includes(snapshot.phase));
  dom("studentFinal").classList.toggle("hidden", snapshot.phase !== "finished");

  if (snapshot.phase === "deciding") renderStudentDecision(snapshot, me);
  if (snapshot.phase === "settled") renderStudentResult(snapshot, me);
  if (snapshot.phase === "finished") renderStudentFinal(snapshot, me);
}

function renderStudentDecision(snapshot, me) {
  dom("roundResultPanel").classList.add("hidden");
  dom("decisionTitle").textContent = `第 ${snapshot.round} 轮经营决策`;
  dom("decisionStateTag").textContent = me.decision ? "已提交" : "待提交";
  if (snapshot.news) {
    dom("studentNewsCategory").textContent = `${snapshot.news.category} · 今日商业快讯`;
    dom("studentNewsHeadline").textContent = snapshot.news.headline;
    dom("studentNewsBody").textContent = `${snapshot.news.bulletin} 请自行判断它可能影响需求、供应、成本、竞争还是运营风险。`;
  }
  if (studentRenderedRound !== snapshot.round) {
    studentRenderedRound = snapshot.round;
    dom("priceInput").value = "14";
    dom("stockInput").value = me.cash < 540 ? "50" : "90";
    dom("marketingInput").value = me.cash < 540 ? "20" : "60";
    updateDecisionBudget();
  }
  setDecisionLocked(Boolean(me.decision));
  if (me.decision) {
    dom("submittedSummary").textContent = `定价 ¥${me.decision.price} · 进货 ${me.decision.stock} 杯 · 营销 ${money(me.decision.marketing)}。等待老师结算。`;
  }
}

function setDecisionLocked(locked) {
  dom("decisionForm").classList.toggle("hidden", locked);
  dom("submittedCard").classList.toggle("hidden", !locked);
}

function renderStudentResult(snapshot, me) {
  setDecisionLocked(true);
  dom("decisionStateTag").textContent = "已结算";
  dom("decisionTitle").textContent = `第 ${snapshot.round} 轮已收盘`;
  dom("submittedSummary").textContent = snapshot.round < snapshot.totalRounds ? "请先复盘本轮结果，等待老师开启下一轮。" : "最后一轮已经完成。";
  dom("roundResultPanel").classList.remove("hidden");
  const event = snapshot.event;
  const result = me.lastResult;
  dom("studentEventReveal").innerHTML = `<span>${esc(event.type)} · MARKET EVENT</span><b>${esc(event.name)}</b><p>${esc(event.desc)}</p>`;
  dom("studentResultStats").innerHTML = [
    ["顾客需求", `${result.demand} 杯`], ["实际售出", `${result.sales} 杯`],
    ["原料损耗", `${result.waste} 杯`], ["销售收入", money(result.revenue)],
    ["本轮总成本", money(result.cost)], ["本轮利润", `${result.profit >= 0 ? "+" : ""}${money(result.profit)}`]
  ].map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join("");
}

function renderStudentFinal(snapshot, me) {
  const myRank = snapshot.teams.find(team => team.id === me.id)?.rank || snapshot.teams.length;
  dom("studentFinalLead").textContent = `${me.name} 最终位列第 ${myRank} 名，现金余额 ${money(me.cash)}。`;
  dom("studentPodium").innerHTML = snapshot.teams.slice(0, 3).map((team, index) => `<div class="podium-item ${["first", "second", "third"][index]}"><div class="podium-bar">${index + 1}</div><b>${esc(team.name)}</b><small>${money(team.cash)}</small></div>`).join("");
  dom("studentCoach").innerHTML = buildCoachComment(me, myRank);
}

function buildCoachComment(team, rank) {
  const history = team.history || [];
  const averagePrice = history.reduce((sum, row) => sum + row.price, 0) / Math.max(1, history.length);
  const totalStock = history.reduce((sum, row) => sum + row.stock, 0);
  const totalWaste = history.reduce((sum, row) => sum + row.waste, 0);
  const marketing = history.reduce((sum, row) => sum + row.marketing, 0);
  const wasteRate = totalStock ? totalWaste / totalStock : 0;
  const pricing = averagePrice >= 16 ? "高端定价" : averagePrice <= 11 ? "低价走量" : "均衡定价";
  const marketingText = marketing >= history.length * 120 ? "营销投入较激进" : marketing <= history.length * 40 ? "营销投入偏保守" : "营销节奏相对均衡";
  const inventoryText = wasteRate > .25 ? `原料损耗率约 ${Math.round(wasteRate * 100)}%，库存管理是最值得优化的环节` : wasteRate < .08 ? "原料损耗控制得非常好" : `原料损耗率约 ${Math.round(wasteRate * 100)}%，仍有优化空间`;
  return `<b>经营画像 · 第 ${rank} 名</b><br>你们采用了<strong>${pricing}</strong>路线，${marketingText}；${inventoryText}。<br><br>复盘时不要只解释“我们赚了多少”，更要说明：当时看到了什么信息、做了什么假设、愿意承担什么风险。`;
}

function updateDecisionBudget() {
  const price = Number(dom("priceInput").value);
  const stock = Number(dom("stockInput").value);
  const marketing = Number(dom("marketingInput").value);
  const total = stock * BASE_UNIT_COST + marketing + FIXED_COST;
  const cash = studentSnapshot?.myTeam?.cash ?? TOTAL_START_CASH;
  dom("priceOutput").textContent = `¥${price} / 杯`;
  dom("stockOutput").textContent = `${stock} 杯`;
  dom("marketingOutput").textContent = money(marketing);
  dom("budgetTotal").textContent = money(total);
  dom("budgetHint").textContent = total > cash ? `超出现金 ${money(total - cash)}，请减少投入` : `剩余 ${money(cash - total)} 作为现金安全垫`;
  dom("budgetTotal").closest(".budget-box").classList.toggle("over", total > cash);
  dom("submitDecisionButton").disabled = total > cash;
}

function copyText(value, successMessage) {
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(value).then(() => showToast(successMessage)).catch(() => fallbackCopy(value, successMessage));
  else fallbackCopy(value, successMessage);
}

function fallbackCopy(value, successMessage) {
  const area = document.createElement("textarea");
  area.value = value;
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  document.execCommand("copy");
  area.remove();
  showToast(successMessage);
}

function invitationUrl() {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("role", "student");
  url.searchParams.set("room", teacherState.roomCode);
  return url.toString();
}

function downloadResults() {
  const rows = [["最终排名", "公司", "轮次", "事件", "定价", "进货", "营销", "需求", "售出", "损耗", "收入", "成本", "利润", "轮后现金"]];
  rankedTeams().forEach((team, rankIndex) => {
    team.history.forEach(result => {
      const event = EVENTS.find(item => item.id === result.eventId);
      rows.push([rankIndex + 1, team.name, result.round, event?.name || "", result.price, result.stock, result.marketing, result.demand, result.sales, result.waste, result.revenue, result.cost, result.profit, result.cashAfter]);
    });
    (team.adjustments || []).forEach(adj => {
      rows.push([rankIndex + 1, team.name, adj.round, "手工调整", "", "", "", "", "", "", "", "", adj.amount, adj.cashAfter]);
    });
  });
  const csv = "\ufeff" + rows.map(row => row.map(csvCell).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${teacherState.className}-${teacherState.roomCode}-经营成绩.csv`;
  link.click();
  URL.revokeObjectURL(url);
  showToast("课堂成绩已导出");
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function exitRoom() {
  if (!window.confirm("确定退出当前教室吗？当前设备上的页面连接会断开。")) return;
  intentionalExit = true;
  clearTimeout(reconnectTimer);
  if (teacherPeer) teacherPeer.destroy();
  if (studentPeer) studentPeer.destroy();
  teacherPeer = null;
  studentPeer = null;
  studentConnection = null;
  teacherConnections.clear();
  teacherState = null;
  studentSnapshot = null;
  history.replaceState({}, "", window.location.pathname);
  switchView("welcomeView");
  resetRoleStep();
}

function handleAction(action) {
  if (action === "show-guide") dom("guideModal").classList.remove("hidden");
  if (action === "close-guide") dom("guideModal").classList.add("hidden");
  if (action === "back-role") resetRoleStep();
  if (action === "copy-code" && teacherState) copyText(teacherState.roomCode, "教室号已复制");
  if (action === "copy-room" && teacherState) copyText(`加入「${teacherState.className}」：${invitationUrl()}\n教室号：${teacherState.roomCode}`, "邀请信息已复制");
  if (action === "leave-room") exitRoom();
  if (action === "start-game" && teacherState?.phase === "lobby" && teacherState.teams.length) startRound();
  if (action === "settle-round") settleRound(false);
  if (action === "force-settle") {
    const missing = teacherState.teams.filter(team => !team.decision).length;
    if (window.confirm(`仍有 ${missing} 支公司未提交。强制结算后，它们本轮将按“停业但仍支付固定成本”处理。继续吗？`)) settleRound(true);
  }
  if (action === "next-round" && teacherState?.phase === "settled") startRound();
  if (action === "download-results") downloadResults();
  if (action === "add-demo-teams") addDemoTeams();
  if (action === "resume-room") resumeRoom();
  if (action === "open-knowledge") openKnowledge();
  if (action === "next-knowledge") showRandomKnowledge();
  if (action === "close-knowledge") closeKnowledge();
}

function addDemoTeams() {
  const demoNames = ["银河制茶局", "薄荷商业社", "珍珠研究所"];
  demoNames.forEach((name, index) => {
    if (!teacherState.teams.some(team => team.name === name)) teacherState.teams.push({ id: `demo-${Date.now()}-${index}`, name, cash: TOTAL_START_CASH, connected: true, demo: true, decision: null, history: [], lastResult: null });
  });
  addTeacherLog("演示公司已入场", "可直接开始，用于教师独立试跑完整流程。 ");
  saveTeacherState();
  renderTeacher();
}

function resumeRoom() {
  const stored = storedTeacherState();
  if (!stored) return showToast("没有可恢复的教室");
  teacherState = stored;
  teacherState.teams.forEach(team => { if (!team.demo) team.connected = false; });
  teacherConnections = new Map();
  switchView("teacherView");
  renderTeacher();
  setupTeacherPeer(true);
}

document.addEventListener("click", event => {
  const roleButton = event.target.closest("[data-role]");
  if (roleButton) setRoleStep(roleButton.dataset.role);
  const actionButton = event.target.closest("[data-action]");
  if (actionButton) handleAction(actionButton.dataset.action);
  if (event.target === dom("guideModal")) dom("guideModal").classList.add("hidden");
  if (event.target === dom("knowledgeModal")) closeKnowledge();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !dom("knowledgeModal").classList.contains("hidden")) closeKnowledge();
});

dom("teacherSetup").addEventListener("submit", event => {
  event.preventDefault();
  const className = dom("classNameInput").value.trim() || "商科体验课";
  teacherState = createTeacherState(className.slice(0, 24), Number(dom("roundCountInput").value));
  teacherConnections = new Map();
  switchView("teacherView");
  renderTeacher();
  setupTeacherPeer(false);
});

dom("studentSetup").addEventListener("submit", event => {
  event.preventDefault();
  const roomCode = dom("roomCodeInput").value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  const companyName = dom("companyNameInput").value.trim().slice(0, 14);
  if (roomCode.length !== 6) return showToast("请输入完整的 6 位教室号");
  if (companyName.length < 2) return showToast("公司名称至少需要 2 个字符");
  startStudentConnection(roomCode, companyName);
});

dom("roomCodeInput").addEventListener("input", event => { event.target.value = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6); });
dom("manualAdjustForm").addEventListener("submit", event => {
  event.preventDefault();
  if (!teacherState || !["settled", "finished"].includes(teacherState.phase)) return showToast("每轮结算后才能手工调整");
  applyManualAdjust(dom("adjustAmountInput").value);
  dom("adjustAmountInput").value = "";
});
dom("eventSelect").addEventListener("change", event => {
  if (teacherState?.phase !== "deciding") return;
  if (teacherState.teams.some(team => team.decision)) return showToast("已有公司提交，本轮新闻已锁定");
  teacherState.currentEventId = event.target.value;
  saveTeacherState();
  renderEventPreview();
  broadcastSnapshots();
});
["priceInput", "stockInput", "marketingInput"].forEach(id => dom(id).addEventListener("input", updateDecisionBudget));

dom("decisionForm").addEventListener("submit", event => {
  event.preventDefault();
  if (!studentConnection?.open || !studentSnapshot || studentSnapshot.phase !== "deciding") return showToast("与老师的连接尚未恢复，请稍候");
  const decision = { price: Number(dom("priceInput").value), stock: Number(dom("stockInput").value), marketing: Number(dom("marketingInput").value) };
  const total = decision.stock * BASE_UNIT_COST + decision.marketing + FIXED_COST;
  if (total > studentSnapshot.myTeam.cash) return showToast("预计支出超过当前现金");
  studentConnection.send({ type: "decision", token: studentToken, round: studentSnapshot.round, decision });
  setDecisionLocked(true);
  dom("submittedSummary").textContent = "正在把决策交给老师…";
});

window.addEventListener("beforeunload", event => {
  if (teacherState && !["finished", "lobby"].includes(teacherState.phase)) {
    event.preventDefault();
    event.returnValue = "";
  }
});

function initialize() {
  const stored = storedTeacherState();
  dom("resumeButton").classList.toggle("hidden", !stored);
  const params = new URLSearchParams(window.location.search);
  if (params.get("role") === "student") {
    setRoleStep("student");
    const room = (params.get("room") || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    dom("roomCodeInput").value = room;
    if (room.length === 6) dom("companyNameInput").focus();
  }
  updateDecisionBudget();
}

initialize();
