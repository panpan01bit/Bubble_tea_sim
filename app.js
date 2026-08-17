"use strict";

const TOTAL_START_CASH = 1000;
const BASE_UNIT_COST = 4;
const FIXED_COST = 120;
const TEACHER_STORAGE_KEY = "bubble-tea-classroom-v2";
const STUDENT_TOKEN_KEY = "bubble-tea-student-token-v2";

const EVENTS = [
  { id: "heatwave", name: "盛夏热浪", type: "机会", category: "normal", desc: "体感温度突破 35℃，冰饮需求集中爆发，市场总客流 +25%。", prompt: "需求突然放大时，备货不足和备货过量，哪个代价更高？", market: 1.25, marketing: 1, cost: 0, sensitivity: 0, fixed: 0, spoilage: 0 },
  { id: "rainstorm", name: "暴雨突袭", type: "风险", category: "normal", desc: "大雨让线下客流锐减，市场总客流 −30%。", prompt: "面对不可控的需求下滑，企业如何给现金流留出安全垫？", market: .70, marketing: 1, cost: 0, sensitivity: 0, fixed: 0, spoilage: 0 },
  { id: "influencer", name: "网红探店", type: "机会", category: "normal", desc: "校园博主发起奶茶测评，本轮营销带来的获客效果提升 70%。", prompt: "风口会放大投入效果，但是否意味着营销越多越好？", market: 1.08, marketing: 1.7, cost: 0, sensitivity: 0, fixed: 0, spoilage: 0 },
  { id: "milk-price", name: "鲜奶涨价", type: "成本", category: "normal", desc: "上游供应紧张，本轮每杯原料成本增加 ¥1.5。", prompt: "成本上涨时，应该涨价、压缩利润，还是减少备货？", market: 1, marketing: 1, cost: 1.5, sensitivity: 0, fixed: 0, spoilage: 0 },
  { id: "price-war", name: "低价竞品入场", type: "竞争", category: "normal", desc: "连锁品牌在校门口发放优惠券，顾客对高价产品更加敏感。", prompt: "竞争对手降价时，跟进价格战是不是唯一答案？", market: 1.04, marketing: 1, cost: 0, sensitivity: .035, fixed: 0, spoilage: 0 },
  { id: "sports-day", name: "校园运动会", type: "机会", category: "normal", desc: "运动会带来集中客流，市场扩大 35%，营销效果也略有提升。", prompt: "可预期的旺季到来前，经营者应该提前配置哪些资源？", market: 1.35, marketing: 1.15, cost: 0, sensitivity: 0, fixed: 0, spoilage: 0 },
  { id: "power-cut", name: "冷柜停电", type: "黑天鹅", category: "black", desc: "临时停电造成部分鲜奶变质，本轮已购原料有 25% 无法出售。", prompt: "小概率、高损失事件发生后，供应链韧性体现在哪里？", market: .95, marketing: 1, cost: 0, sensitivity: 0, fixed: 0, spoilage: .25 },
  { id: "food-rumor", name: "食品安全舆情", type: "黑天鹅", category: "black", desc: "社交平台出现原料质疑，市场缩小 18%，但有效营销更能重建信任。", prompt: "危机公关的目标是增加曝光，还是重建信任？", market: .82, marketing: 1.45, cost: 0, sensitivity: 0, fixed: 0, spoilage: 0 },
  { id: "plastic-rule", name: "限塑新规", type: "黑天鹅", category: "black", desc: "环保新规即时生效，每家公司本轮增加 ¥45 合规成本。", prompt: "政策变化带来共同成本时，企业如何建立差异化？", market: 1, marketing: 1, cost: 0, sensitivity: 0, fixed: 45, spoilage: 0 }
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

function showToast(message) {
  const toast = dom("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2300);
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
  const ranked = rankedTeams();
  const team = teacherState.teams.find(item => item.id === token);
  return {
    type: "snapshot",
    className: teacherState.className,
    roomCode: teacherState.roomCode,
    totalRounds: teacherState.totalRounds,
    round: teacherState.round,
    phase: teacherState.phase,
    event: reveal ? currentEvent() : null,
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
  if (teacherState.phase === "deciding") return { badge: "决策中", title: `第 ${teacherState.round} 轮 · 公司决策中`, desc: missing ? `还有 ${missing} 支公司尚未提交。事件对学生保持隐藏。` : "所有公司已提交，可以揭晓事件并统一结算。", market: "事件未揭晓" };
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
  renderLeaderboard(dom("teacherLeaderboard"), rankedTeams().map((team, index) => ({ ...team, rank: index + 1, lastProfit: team.lastResult?.profit })));
  renderTeacherLog();
}

function populateEventSelect() {
  const select = dom("eventSelect");
  if (select.options.length === 0) {
    select.innerHTML = EVENTS.map(event => `<option value="${event.id}">${event.category === "black" ? "⚡ " : ""}${esc(event.name)} · ${esc(event.type)}</option>`).join("");
  }
  select.value = teacherState.currentEventId;
}

function renderEventPreview() {
  const event = currentEvent();
  dom("teacherEventPreview").innerHTML = `<b>${esc(event.name)} <span>${esc(event.type)}</span></b><p>${esc(event.desc)}</p><small>课堂追问：${esc(event.prompt)}</small>`;
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
  rankedTeams().forEach((team, rankIndex) => team.history.forEach(result => {
    const event = EVENTS.find(item => item.id === result.eventId);
    rows.push([rankIndex + 1, team.name, result.round, event?.name || "", result.price, result.stock, result.marketing, result.demand, result.sales, result.waste, result.revenue, result.cost, result.profit, result.cashAfter]);
  }));
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
dom("eventSelect").addEventListener("change", event => {
  if (teacherState?.phase !== "deciding") return;
  teacherState.currentEventId = event.target.value;
  saveTeacherState();
  renderEventPreview();
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
