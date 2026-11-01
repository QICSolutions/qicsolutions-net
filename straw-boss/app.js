(function () {
  var canvas = document.getElementById("c");
  var ctx = canvas.getContext("2d");
  var KEY = "straw-boss-site";
  var DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]];
  var SKINS = ["#f0c59a", "#e0a070", "#c68642", "#8d5524", "#f6debc"];
  var HAIRS = [null, "#1a1612", "#6b3e22", "#c5ccd4"];
  var ROLE = {
    electrician: { hat: "#f2d23a", shirt: "#e6c200", dark: "#b89600", tool: "#2a2e32" },
    carpenter: { hat: "#e23b32", shirt: "#d12b22", dark: "#8f1c16", tool: "#e7d3b0" },
    plumber: { hat: "#3d94d6", shirt: "#2b7bbd", dark: "#1a527f", tool: "#d5dde4" },
    boss: { hat: "#f4f1ea", shirt: "#c4a574", dark: "#8d7048", tool: "#f4e7c3" },
    sub: { hat: "#6ea84a", shirt: "#3d6b45", dark: "#24402a", tool: "#f4e7c3" }
  };
  var FONT = {
    A: ["010", "101", "111", "101", "101"], B: ["110", "101", "110", "101", "110"],
    C: ["011", "100", "100", "100", "011"], D: ["110", "101", "101", "101", "110"],
    E: ["111", "100", "110", "100", "111"], F: ["111", "100", "110", "100", "100"],
    G: ["011", "100", "101", "101", "011"], H: ["101", "101", "111", "101", "101"],
    I: ["111", "010", "010", "010", "111"], J: ["001", "001", "001", "101", "010"],
    K: ["101", "101", "110", "101", "101"], L: ["100", "100", "100", "100", "111"],
    M: ["101", "111", "101", "101", "101"], N: ["110", "101", "101", "101", "101"],
    O: ["010", "101", "101", "101", "010"], P: ["110", "101", "110", "100", "100"],
    Q: ["010", "101", "101", "011", "001"], R: ["110", "101", "110", "101", "101"],
    S: ["011", "100", "010", "001", "110"], T: ["111", "010", "010", "010", "010"],
    U: ["101", "101", "101", "101", "111"], V: ["101", "101", "101", "101", "010"],
    W: ["101", "101", "101", "111", "101"], X: ["101", "101", "010", "101", "101"],
    Y: ["101", "101", "010", "010", "010"], Z: ["111", "001", "010", "100", "111"],
    "0": ["111", "101", "101", "101", "111"], "1": ["010", "110", "010", "010", "111"],
    "2": ["111", "001", "111", "100", "111"], "3": ["111", "001", "111", "001", "111"],
    "4": ["101", "101", "111", "001", "001"], "5": ["111", "100", "111", "001", "111"],
    "6": ["111", "100", "111", "101", "111"], "7": ["111", "001", "010", "010", "010"],
    "8": ["111", "101", "111", "101", "111"], "9": ["111", "101", "111", "001", "111"],
    " ": ["000", "000", "000", "000", "000"], ".": ["000", "000", "000", "000", "010"],
    "-": ["000", "000", "111", "000", "000"], "!": ["010", "010", "010", "000", "010"],
    "/": ["001", "001", "010", "100", "100"], "$": ["010", "111", "110", "011", "010"]
  };
  var KEY_STEP = {
    ARROWUP: [-1, -1], ARROWDOWN: [1, 1], ARROWLEFT: [-1, 1], ARROWRIGHT: [1, -1],
    W: [-1, -1], S: [1, 1], A: [-1, 1], D: [1, -1]
  };

  var save = loadSave();
  var level = null;
  var done = {};
  var blocked = {};
  var originX = 240;
  var originY = 70;
  var hits = [];
  var keys = {};
  var player = null;
  var sub = null;
  var hands = [];
  var work = {};
  var clock = 0;
  var carry = null;
  var subCarry = null;
  var caughtUp = false;
  var savedAt = 0;
  var botPatrol = 0;

  function keptNumber(value) {
    return typeof value === "number" && isFinite(value) && value > 0 ? value : 0;
  }

  function keptWork(src) {
    var out = {};
    var key;
    if (!src || typeof src !== "object") return out;
    for (key in src) {
      if (Object.prototype.hasOwnProperty.call(src, key)) out[key] = keptNumber(src[key]);
    }
    return out;
  }

  function blankSave(hired) {
    return {
      v: 2,
      level: 1,
      done: {},
      sub: !!hired,
      marks: [],
      signed: {},
      hauled: {},
      broke: {},
      trip: false,
      mats: 0,
      bank: 0,
      t: 0,
      work: {}
    };
  }

  function loadSave() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return blankSave(false);
      var data = JSON.parse(raw);
      if (!data || (data.v | 0) < 2) return blankSave(data && data.sub);
      var index = data.level | 0;
      if (index < 1 || index > StrawBoss.levels.length) return blankSave(data.sub);
      return {
        v: 2,
        level: index,
        done: data.done && typeof data.done === "object" ? data.done : {},
        sub: !!data.sub,
        marks: Array.isArray(data.marks) ? data.marks : [],
        signed: data.signed && typeof data.signed === "object" ? data.signed : {},
        hauled: data.hauled && typeof data.hauled === "object" ? data.hauled : {},
        broke: data.broke && typeof data.broke === "object" ? data.broke : {},
        trip: !!data.trip,
        mats: keptNumber(data.mats),
        bank: keptNumber(data.bank),
        t: keptNumber(data.t),
        work: keptWork(data.work)
      };
    } catch (err) {
      return blankSave(false);
    }
  }

  function persist() {
    localStorage.setItem(KEY, JSON.stringify(save));
  }

  function textWidth(text, scale) {
    return String(text).length * 4 * scale;
  }

  function drawText(text, x, y, color, scale) {
    var rows, r, c, ch, i, cx;
    ctx.fillStyle = color;
    cx = x;
    var upper = String(text).toUpperCase();
    for (i = 0; i < upper.length; i++) {
      ch = upper.charAt(i);
      rows = FONT[ch] || FONT[" "];
      for (r = 0; r < 5; r++) {
        for (c = 0; c < 3; c++) {
          if (rows[r].charAt(c) === "1") ctx.fillRect(cx + c * scale, y + r * scale, scale, scale);
        }
      }
      cx += 4 * scale;
    }
  }

  function drawTextCentered(text, y, color, scale) {
    drawText(text, (480 - textWidth(text, scale)) / 2, y, color, scale);
  }

  function rect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  function button(x, y, w, h, label, onClick, enabled) {
    var on = enabled !== false;
    rect(x, y, w, h, "#161410");
    rect(x + 1, y + 1, w - 2, h - 2, on ? "#c9a227" : "#3a403c");
    rect(x + 3, y + 3, w - 6, h - 6, "#1b2420");
    drawText(label, x + (w - textWidth(label, 1)) / 2, y + 9, on ? "#f4e7c3" : "#6d756f", 1);
    hits.push({ x: x, y: y, w: w, h: h, onClick: onClick, enabled: on });
  }

  function screenTop(x, y) {
    return {
      sx: originX + (x - y) * 16,
      sy: originY + (x + y) * 8
    };
  }

  var sprites = {};
  var plates = {};

  function loadImage(bucket, key, src) {
    if (bucket[key]) return;
    var img = new Image();
    img.onload = function () { bucket[key] = img; };
    img.src = src;
  }

  ["boss", "electrician", "carpenter", "plumber", "sub"].forEach(function (name) {
    loadImage(sprites, name, "assets/sprites/" + name + ".png");
  });

  function drawDiamond(sx, sy, fill) {
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + 16, sy + 8);
    ctx.lineTo(sx, sy + 16);
    ctx.lineTo(sx - 16, sy + 8);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = "#1a221c";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function drawDiamondOutline(sx, sy) {
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + 16, sy + 8);
    ctx.lineTo(sx, sy + 16);
    ctx.lineTo(sx - 16, sy + 8);
    ctx.closePath();
    ctx.strokeStyle = "rgba(22, 20, 16, 0.28)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function plateImage() {
    var img = level && level.plate && plates[level.plate];
    if (!img || !img.naturalWidth) return null;
    return img;
  }

  function inBounds(x, y) {
    return x >= 0 && y >= 0 && x < level.cols && y < level.rows;
  }

  function keyOf(p) {
    return p.x + "," + p.y;
  }

  function near(a, b) {
    return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) <= 1;
  }

  function sameSpot(a, b) {
    return !!a && !!b && a.x === b.x && a.y === b.y;
  }

  function measure(site) {
    var minSx = Infinity;
    var maxSx = -Infinity;
    var minSy = Infinity;
    var maxSy = -Infinity;
    var x, y, sx, sy;
    for (y = 0; y < site.rows; y++) {
      for (x = 0; x < site.cols; x++) {
        sx = (x - y) * 16;
        sy = (x + y) * 8;
        if (sx < minSx) minSx = sx;
        if (sx > maxSx) maxSx = sx;
        if (sy < minSy) minSy = sy;
        if (sy > maxSy) maxSy = sy;
      }
    }
    originX = Math.round(240 - (minSx + maxSx) / 2);
    originY = Math.round(118 - (minSy + maxSy) / 2);
  }

  function placeBody(x, y) {
    return { from: { x: x, y: y }, to: null, t: 1, path: [], pending: null, jobId: null, work: 0, cool: 0 };
  }

  function loadLevel() {
    level = StrawBoss.levels[save.level - 1];
    measure(level);
    done = {};
    level.jobs.forEach(function (job) {
      if (save.done[job.id]) done[job.id] = true;
    });
    save.done = done;
    save.marks = save.marks.filter(function (id) {
      return level.jobs.some(function (job) { return job.id === id; });
    });
    work = {};
    if (save.work) {
      level.jobs.forEach(function (job) {
        if (save.work[job.id] > 0) work[job.id] = save.work[job.id];
      });
    }
    save.work = work;
    carry = null;
    subCarry = null;
    blocked = {};
    hands = level.crew.map(function (slot) {
      var member = StrawBoss.crewMember(slot.seed, slot.trade);
      var body = placeBody(slot.x, slot.y);
      body.home = { x: slot.x, y: slot.y };
      body.trade = slot.trade;
      body.name = member.name;
      body.look = member.look;
      body.taskId = null;
      body.dest = null;
      return body;
    });
    if (level.plate) loadImage(plates, level.plate, level.plate);
    var spawn = level.spawn;
    player = placeBody(spawn.x, spawn.y);
    sub = placeBody(spawn.x, spawn.y);
    var side = { x: spawn.x + 1, y: spawn.y };
    if (inBounds(side.x, side.y) && !blocked[keyOf(side)]) sub.from = side;
  }

  function bfs(start, isGoal) {
    if (isGoal(start)) return [];
    var q = [{ x: start.x, y: start.y }];
    var prev = {};
    prev[keyOf(start)] = "";
    var found = null;
    var qi = 0;
    var cur, d, nx, ny, nk;
    while (qi < q.length) {
      cur = q[qi++];
      if (isGoal(cur)) { found = cur; break; }
      for (d = 0; d < DIRS.length; d++) {
        nx = cur.x + DIRS[d][0];
        ny = cur.y + DIRS[d][1];
        nk = nx + "," + ny;
        if (prev[nk] !== undefined) continue;
        if (!inBounds(nx, ny) || blocked[nk]) continue;
        prev[nk] = keyOf(cur);
        q.push({ x: nx, y: ny });
      }
    }
    if (!found || keyOf(found) === keyOf(start)) return [];
    var path = [];
    var guard = 0;
    nk = keyOf(found);
    while (nk && nk !== keyOf(start) && guard < 400) {
      var parts = nk.split(",");
      path.push({ x: parseInt(parts[0], 10), y: parseInt(parts[1], 10) });
      nk = prev[nk];
      guard++;
    }
    path.reverse();
    return path;
  }

  function pathToTile(start, tile) {
    if (!tile || blocked[keyOf(tile)] || !inBounds(tile.x, tile.y)) return [];
    return bfs(start, function (cur) { return cur.x === tile.x && cur.y === tile.y; });
  }

  function pathBeside(start, tile) {
    if (near(start, tile)) return [];
    return bfs(start, function (cur) {
      return !(cur.x === start.x && cur.y === start.y) && near(cur, tile);
    });
  }

  function pathStart(body) {
    if (body.to) return { x: body.to.x, y: body.to.y };
    return { x: body.from.x, y: body.from.y };
  }

  function stood(body) {
    if (!body.to) return { x: body.from.x, y: body.from.y };
    return {
      x: body.from.x + (body.to.x - body.from.x) * body.t,
      y: body.from.y + (body.to.y - body.from.y) * body.t
    };
  }

  function advance(body, dt) {
    var next;
    if (body.to) {
      body.t += dt / 170;
      if (body.t >= 1) {
        body.from = { x: body.to.x, y: body.to.y };
        body.to = null;
        body.t = 1;
      }
      return;
    }
    if (!body.path.length) return;
    next = body.path[0];
    if (!inBounds(next.x, next.y) || blocked[next.x + "," + next.y]) {
      body.path = [];
      return;
    }
    body.path.shift();
    body.to = next;
    body.t = 0;
  }

  function finishJob(id) {
    var next = StrawBoss.tryComplete(level.jobs, done, id);
    if (next === done) return false;
    done = next;
    save.done = done;
    persist();
    return true;
  }

  function heldStep() {
    var name;
    for (name in keys) {
      if (keys[name] && KEY_STEP[name]) return KEY_STEP[name];
    }
    return null;
  }

  function updatePlayer(dt) {
    var at, step, nx, ny;
    advance(player, dt);
    if (player.cool > 0) player.cool -= dt;
    if (!player.to) grabPile();
    if (player.to) return;
    at = pathStart(player);
    if (player.cool > 0 || player.path.length) return;
    step = heldStep();
    if (!step) return;
    nx = at.x + step[0];
    ny = at.y + step[1];
    if (!inBounds(nx, ny) || blocked[nx + "," + ny]) return;
    player.pending = null;
    player.path = [{ x: nx, y: ny }];
    player.cool = 170;
  }

  function jobById(id) {
    var i;
    for (i = 0; i < level.jobs.length; i++) {
      if (level.jobs[i].id === id) return level.jobs[i];
    }
    return null;
  }

  function standTile(job, trade) {
    var trades = StrawBoss.requiredTrades(job);
    if (job.partner && trades.length > 1 && trade === trades[1]) return job.partner;
    return job.tile;
  }

  function sendTo(body, spot) {
    var at;
    if (!spot) return;
    if (body.dest && body.dest.x === spot.x && body.dest.y === spot.y) return;
    at = pathStart(body);
    body.dest = { x: spot.x, y: spot.y };
    if (at.x === spot.x && at.y === spot.y && !body.to) return;
    body.path = pathToTile({ x: at.x, y: at.y }, spot);
  }

  function presence(job) {
    var have = {};
    var trades = StrawBoss.requiredTrades(job);
    var t, h, spot, at, hand;
    for (t = 0; t < trades.length; t++) {
      spot = standTile(job, trades[t]);
      for (h = 0; h < hands.length; h++) {
        hand = hands[h];
        if (hand.taskId !== job.id || hand.trade !== trades[t] || hand.to) continue;
        at = pathStart(hand);
        if (at.x === spot.x && at.y === spot.y) have[trades[t]] = true;
      }
    }
    return have;
  }

  function gateFlags() {
    return {
      signed: save.signed,
      hauled: save.hauled,
      broke: save.broke,
      trip: StrawBoss.tripOpen(level, work, done, save.trip)
    };
  }

  function planFor(trade) {
    var list = StrawBoss.assignedForTrade(level.jobs, done, save.marks, trade);
    var map = {};
    var i;
    for (i = 0; i < list.length; i++) map[list[i].id] = true;
    return { list: list, map: map };
  }

  function updateCrew(dt) {
    var i, h, t, hand, job, state, trades, spot, best, bestD, dist, at, step, rate, plans, plan;
    plans = {
      electrician: planFor("electrician"),
      carpenter: planFor("carpenter"),
      plumber: planFor("plumber")
    };
    for (i = 0; i < hands.length; i++) {
      hand = hands[i];
      if (!hand.taskId) continue;
      job = jobById(hand.taskId);
      state = job ? StrawBoss.jobState(job, done) : null;
      plan = plans[hand.trade];
      if (!job || !state.ready || !plan || !plan.map[job.id]) {
        hand.taskId = null;
        hand.dest = null;
      }
    }
    var tradeNames = ["electrician", "carpenter", "plumber"];
    for (t = 0; t < tradeNames.length; t++) {
      plan = plans[tradeNames[t]];
      for (i = 0; i < plan.list.length; i++) {
        job = plan.list[i];
        var taken = false;
        for (h = 0; h < hands.length; h++) {
          if (hands[h].taskId === job.id && hands[h].trade === tradeNames[t]) taken = true;
        }
        if (taken) continue;
        spot = standTile(job, tradeNames[t]);
        best = null;
        bestD = 999;
        for (h = 0; h < hands.length; h++) {
          hand = hands[h];
          if (hand.trade !== tradeNames[t] || hand.taskId) continue;
          at = pathStart(hand);
          dist = Math.abs(at.x - spot.x) + Math.abs(at.y - spot.y);
          if (dist < bestD) {
            bestD = dist;
            best = hand;
          }
        }
        if (!best) continue;
        best.taskId = job.id;
        best.dest = null;
      }
    }
    for (i = 0; i < hands.length; i++) {
      hand = hands[i];
      advance(hand, dt);
      if (hand.taskId) sendTo(hand, standTile(jobById(hand.taskId), hand.trade));
      else sendTo(hand, hand.home);
    }
    for (i = 0; i < level.jobs.length; i++) {
      job = level.jobs[i];
      trades = StrawBoss.requiredTrades(job);
      if (!trades.length || !StrawBoss.jobState(job, done).ready) continue;
      rate = save.sub && subOnTask(job) ? 2 : 1;
      step = StrawBoss.advanceWork(
        job,
        presence(job),
        work[job.id] || 0,
        caughtUp ? 0 : dt * rate / StrawBoss.JOB_SCALE,
        StrawBoss.clockHeld(job, gateFlags())
      );
      work[job.id] = step.elapsed;
      if (!step.done) continue;
      finishJob(job.id);
      work[job.id] = 0;
      for (h = 0; h < hands.length; h++) {
        if (hands[h].taskId === job.id) {
          hands[h].taskId = null;
          hands[h].dest = null;
        }
      }
    }
  }

  function subOnTask(job) {
    var at;
    if (!save.sub || !job) return false;
    at = pathStart(sub);
    return !sub.to && near(at, job.tile);
  }

  function presentMap() {
    var map = {};
    var i, job;
    for (i = 0; i < level.jobs.length; i++) {
      job = level.jobs[i];
      map[job.id] = StrawBoss.taskStaffed(job, presence(job));
    }
    return map;
  }

  function updateSub(dt) {
    var at, intent, job;
    if (!save.sub) return;
    advance(sub, dt);
    if (sub.to) return;
    at = pathStart(sub);
    intent = StrawBoss.subIntent(level, {
      done: done,
      work: work,
      signed: save.signed,
      hauled: save.hauled,
      broke: save.broke,
      tripCleared: save.trip,
      marks: save.marks,
      carry: subCarry,
      playerCarry: carry,
      at: at,
      present: presentMap()
    });
    if (!intent) {
      var jobs = level.jobs;
      var n = jobs.length;
      var k;
      var tile;
      if (!n) return;
      if (sub.dest && !sameSpot(at, sub.dest)) return;
      for (k = 0; k < n; k++) {
        botPatrol = (botPatrol + 1) % n;
        tile = jobs[botPatrol].tile;
        if (!sameSpot(at, tile)) {
          sendTo(sub, tile);
          return;
        }
      }
      return;
    }
    if (intent.act === "mark") {
      if (save.marks.indexOf(intent.jobId) === -1) save.marks.push(intent.jobId);
      persist();
      return;
    }
    if (!sameSpot(at, intent.tile)) {
      sendTo(sub, intent.tile);
      return;
    }
    if (intent.act === "trip") {
      save.trip = true;
      persist();
    } else if (intent.act === "sign") {
      save.signed[intent.jobId] = true;
      job = jobById(intent.jobId);
      if (job && !StrawBoss.requiredTrades(job).length) finishJob(intent.jobId);
      else persist();
    } else if (intent.act === "clash") {
      save.broke[intent.jobId] = true;
      persist();
    } else if (intent.act === "take") {
      if (carry !== intent.jobId) subCarry = intent.jobId;
    } else if (intent.act === "drop") {
      save.hauled[intent.jobId] = true;
      subCarry = null;
      persist();
    }
  }

  function hireSub() {
    if (save.sub) return;
    save.sub = true;
    persist();
    var at = pathStart(player);
    var side = { x: at.x + 1, y: at.y };
    if (!inBounds(side.x, side.y) || blocked[keyOf(side)]) side = { x: at.x, y: at.y + 1 };
    if (!inBounds(side.x, side.y) || blocked[keyOf(side)]) side = { x: at.x - 1, y: at.y };
    if (!inBounds(side.x, side.y) || blocked[keyOf(side)]) side = { x: level.spawn.x, y: level.spawn.y };
    sub = placeBody(side.x, side.y);
  }

  function nextSite() {
    if (save.level >= StrawBoss.levels.length) return;
    if (!StrawBoss.siteClear(level.jobs, done)) return;
    save.level += 1;
    save.done = {};
    save.marks = [];
    save.signed = {};
    save.hauled = {};
    save.broke = {};
    save.trip = false;
    save.work = {};
    persist();
    loadLevel();
  }

  function applyIdle(now) {
    var before;
    var gap;
    caughtUp = false;
    if (!save.t) {
      save.t = now;
      if (!save.mats) save.mats = 0;
      if (!save.bank) save.bank = 0;
      save.work = work;
      persist();
      savedAt = now;
      return;
    }
    gap = now - save.t;
    if (gap < 0) gap = 0;
    if (gap > 1500 || (document.hidden && gap > 0)) {
      before = save.level;
      save.work = work;
      StrawBoss.catchup(StrawBoss.levels, save, gap);
      save.t = now;
      caughtUp = true;
      if (save.level !== before) loadLevel();
      else {
        done = save.done;
        work = save.work || {};
        if (carry && save.hauled[carry]) carry = null;
        if (subCarry && save.hauled[subCarry]) subCarry = null;
      }
      persist();
      savedAt = now;
      return;
    }
    if (gap > 0) {
      StrawBoss.addMats(save, gap);
      save.t = now;
      save.work = work;
      if (now - savedAt >= 5000) {
        savedAt = now;
        persist();
      }
    }
  }

  function stampProgress() {
    save.work = work;
    save.t = Date.now();
    persist();
    savedAt = save.t;
  }

  function floorColor(x, y) {
    var edge = x === 0 || y === 0 || x === level.cols - 1 || y === level.rows - 1;
    var color = edge ? (level.edge || "#314038") : (level.fill || "#3a463c");
    var i, t, room;
    if (!level.rooms) return color;
    for (i = 0; i < level.rooms.length; i++) {
      room = level.rooms[i];
      for (t = 0; t < room.tiles.length; t++) {
        if (room.tiles[t].x === x && room.tiles[t].y === y) {
          if (!room.job) return room.color || color;
          return done[room.job] ? room.open : room.shut;
        }
      }
    }
    return color;
  }

  function drawPerson(feetX, feetY, role, look, moving) {
    var colors = ROLE[role] || ROLE.electrician;
    var skin = SKINS[(look && look.skin) % SKINS.length] || SKINS[0];
    var hair = look ? HAIRS[look.hair % HAIRS.length] : HAIRS[1];
    var bob = moving ? (Math.floor(clock / 120) % 2) : 0;
    var sprite = sprites[role];
    if (sprite && sprite.naturalWidth) {
      var height = 36;
      var width = Math.round(sprite.naturalWidth * (height / sprite.naturalHeight));
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(sprite, Math.round(feetX - width / 2), Math.round(feetY - height - bob), width, height);
      ctx.imageSmoothingEnabled = false;
      return;
    }
    feetY -= bob;
    rect(feetX - 6, feetY - 2, 12, 3, "rgba(0,0,0,0.45)");
    rect(feetX - 4, feetY - 8, 3, 6, "#3d4a58");
    rect(feetX + 1, feetY - 8, 3, 6, "#2a3440");
    rect(feetX - 5, feetY - 4, 4, 3, "#241c14");
    rect(feetX + 1, feetY - 4, 4, 3, "#16110c");
    rect(feetX - 5, feetY - 18, 6, 10, colors.shirt);
    rect(feetX + 1, feetY - 18, 4, 10, colors.dark);
    rect(feetX - 2, feetY - 24, 6, 6, skin);
    if (hair) rect(feetX - 2, feetY - 25, 6, 2, hair);
    rect(feetX - 4, feetY - 30, 10, 5, colors.hat);
    rect(feetX - 6, feetY - 26, 12, 2, colors.hat);
    if (role === "boss") {
      rect(feetX - 4, feetY - 28, 10, 1, "#c9a227");
      rect(feetX - 11, feetY - 16, 5, 7, "#f4e7c3");
      rect(feetX - 10, feetY - 14, 3, 1, "#161410");
    } else if (role === "sub") {
      rect(feetX + 6, feetY - 16, 3, 4, "#f4e7c3");
    } else {
      rect(feetX + 5, feetY - 16, 3, 5, colors.tool || colors.hat);
    }
  }

  function drawBang(feetX, feetY) {
    var bob = Math.floor(clock / 280) % 2;
    var x = feetX - 5;
    var y = feetY - 42 - bob;
    rect(x - 1, y - 1, 11, 12, "#161410");
    rect(x, y, 9, 9, "#f4e7c3");
    rect(x + 3, y + 8, 3, 2, "#f4e7c3");
    drawText("!", x + 3, y + 2, "#161410", 1);
  }

  function drawMeter(sx, sy, frac) {
    var fill = Math.max(1, Math.min(18, Math.round(18 * frac)));
    rect(sx - 10, sy + 12, 20, 6, "#161410");
    rect(sx - 9, sy + 13, 18, 4, "#2a2418");
    rect(sx - 9, sy + 13, fill, 4, "#f4e7c3");
  }

  function drawMarkPip(sx, sy) {
    rect(sx + 7, sy + 2, 4, 4, "#161410");
    rect(sx + 8, sy + 3, 2, 2, "#c9a227");
  }

  function drawPile(kind, sx, sy) {
    var feetY = sy + 14;
    if (kind === "coil") {
      rect(sx - 4, feetY - 8, 8, 6, "#c9a227");
      rect(sx - 2, feetY - 6, 4, 2, "#2a2e32");
      return;
    }
    rect(sx - 8, feetY - 6, 12, 3, "#c4a574");
    rect(sx - 6, feetY - 10, 12, 3, "#8d7048");
  }

  function drawProp(prop, sx, sy, on, fault) {
    var feetY = sy + 14;
    var wood;
    var pipe;
    var lamp = fault ? (Math.floor(clock / 180) % 2 ? "#e23b32" : "#8a3030") : (on ? "#6ea84a" : "#8a3030");
    if (prop === "panel") {
      rect(sx + 8, feetY - 16, 8, 10, "#2a2e32");
      rect(sx + 10, feetY - 13, 4, 3, lamp);
      rect(sx + 10, feetY - 8, 4, 1, on && !fault ? "#c9a227" : "#3a3a3a");
    } else if (prop === "lights") {
      rect(sx - 14, feetY - 22, 2, 10, "#2a2e32");
      rect(sx - 18, feetY - 14, 8, 3, on ? "#f4e7c3" : "#2a2418");
    } else if (prop === "ac") {
      rect(sx + 8, feetY - 14, 12, 10, "#5a646c");
      rect(sx + 10, feetY - 12, 8, 3, "#2a2e32");
      if (on && Math.floor(clock / 180) % 2 === 0) rect(sx + 20, feetY - 10, 3, 2, "#d5dde4");
    } else if (prop === "studs") {
      wood = on ? "#c4a574" : "#5c4030";
      rect(sx - 12, feetY - 20, 2, 16, wood);
      rect(sx - 4, feetY - 24, 2, 20, wood);
      rect(sx + 4, feetY - 18, 2, 14, wood);
      if (on) rect(sx - 12, feetY - 22, 18, 2, wood);
    } else if (prop === "pipe") {
      pipe = on ? "#3d94d6" : "#3a4a55";
      rect(sx - 10, feetY - 8, 14, 3, pipe);
      rect(sx + 2, feetY - 14, 3, 8, pipe);
    } else if (prop === "trim") {
      wood = on ? "#d7c4a3" : "#6a5640";
      rect(sx - 14, feetY - 16, 8, 2, wood);
      rect(sx - 14, feetY - 12, 8, 2, wood);
    } else if (prop === "outlet") {
      rect(sx - 3, feetY - 10, 6, 6, on ? "#f4e7c3" : "#2a2e32");
      rect(sx - 1, feetY - 8, 2, 2, "#161410");
    } else if (prop === "deck") {
      wood = on ? "#c4a574" : "#5c4030";
      rect(sx - 12, feetY - 6, 16, 3, wood);
      rect(sx - 8, feetY - 10, 16, 3, wood);
    } else if (prop === "note") {
      rect(sx - 3, feetY - 10, 6, 7, on ? "#f4e7c3" : "#8a8070");
      rect(sx - 1, feetY - 8, 3, 1, "#161410");
    } else if (prop === "heater") {
      rect(sx - 4, feetY - 14, 8, 10, on ? "#8a9098" : "#3a4048");
      rect(sx - 2, feetY - 18, 4, 4, on ? "#5a646c" : "#2a2e32");
      rect(sx - 1, feetY - 10, 2, 2, on ? "#e23b32" : "#3a3a3a");
    } else if (prop === "bath") {
      rect(sx - 10, feetY - 8, 12, 6, on ? "#d5dde4" : "#3a4a55");
      rect(sx + 4, feetY - 12, 5, 8, on ? "#e7eef2" : "#2a343c");
      rect(sx + 5, feetY - 14, 3, 2, "#8a9098");
    } else if (prop === "sink") {
      rect(sx - 6, feetY - 8, 10, 4, on ? "#d5dde4" : "#3a4a55");
      rect(sx - 1, feetY - 14, 2, 6, on ? "#8a9098" : "#2a2e32");
      rect(sx - 3, feetY - 14, 6, 2, on ? "#8a9098" : "#2a2e32");
    } else if (prop === "range") {
      rect(sx - 8, feetY - 12, 14, 8, on ? "#2a2e32" : "#1a1c1e");
      rect(sx - 6, feetY - 10, 3, 3, on ? "#c9a227" : "#3a3a3a");
      rect(sx - 1, feetY - 10, 3, 3, on ? "#e23b32" : "#3a3a3a");
      rect(sx + 3, feetY - 9, 2, 4, "#5a646c");
    } else if (prop === "washer") {
      rect(sx - 10, feetY - 14, 8, 10, on ? "#d5dde4" : "#3a4450");
      rect(sx - 8, feetY - 11, 4, 4, on ? "#5a8ab0" : "#2a2e32");
      rect(sx - 1, feetY - 14, 8, 10, on ? "#c5d0d8" : "#323840");
      rect(sx + 1, feetY - 11, 4, 4, on ? "#5a8ab0" : "#2a2e32");
    } else if (prop === "cabs") {
      wood = on ? "#d7c4a3" : "#6a5640";
      rect(sx - 12, feetY - 16, 10, 6, wood);
      rect(sx - 1, feetY - 16, 10, 6, wood);
      rect(sx - 7, feetY - 14, 1, 2, "#161410");
      rect(sx + 3, feetY - 14, 1, 2, "#161410");
    } else if (prop === "desk") {
      wood = on ? "#c4a574" : "#5c4030";
      rect(sx - 10, feetY - 8, 16, 3, wood);
      rect(sx - 8, feetY - 5, 2, 4, wood);
      rect(sx + 4, feetY - 5, 2, 4, wood);
    } else if (prop === "server") {
      rect(sx - 4, feetY - 20, 8, 16, on ? "#2a2e32" : "#1a1c1e");
      rect(sx - 2, feetY - 16, 2, 2, on ? "#6ea84a" : "#8a3030");
      rect(sx - 2, feetY - 12, 2, 2, on ? "#6ea84a" : "#3a3a3a");
      rect(sx - 2, feetY - 8, 4, 1, "#5a646c");
    } else if (prop === "machine") {
      rect(sx - 12, feetY - 10, 18, 8, on ? "#5a646c" : "#3a4044");
      rect(sx - 4, feetY - 18, 8, 8, on ? "#2a2e32" : "#1a1c1e");
      rect(sx - 2, feetY - 8, 4, 2, on ? "#6ea84a" : "#8a3030");
    } else if (prop === "bench") {
      wood = on ? "#c4a574" : "#5c4030";
      rect(sx - 12, feetY - 10, 20, 3, wood);
      rect(sx - 10, feetY - 7, 2, 5, wood);
      rect(sx + 6, feetY - 7, 2, 5, wood);
    } else if (prop === "dock") {
      wood = on ? "#8a9098" : "#4a5058";
      rect(sx - 12, feetY - 6, 14, 3, wood);
      rect(sx - 6, feetY - 10, 14, 3, wood);
    }
  }

  function doneCount() {
    var n = 0;
    var i;
    for (i = 0; i < level.jobs.length; i++) {
      if (done[level.jobs[i].id]) n += 1;
    }
    return n;
  }

  function nearestHand(at) {
    var best = null;
    var bestD = 99;
    var i, pos, dist;
    for (i = 0; i < hands.length; i++) {
      pos = pathStart(hands[i]);
      if (!near(at, pos)) continue;
      dist = Math.abs(pos.x - at.x) + Math.abs(pos.y - at.y);
      if (dist < bestD) {
        bestD = dist;
        best = hands[i];
      }
    }
    return best;
  }

  function nearestTask(at) {
    var best = null;
    var bestD = 99;
    var i, job, spot, dist;
    for (i = 0; i < level.jobs.length; i++) {
      job = level.jobs[i];
      spot = job.tile;
      if (!near(at, spot) && !(job.partner && near(at, job.partner))) continue;
      dist = Math.abs(spot.x - at.x) + Math.abs(spot.y - at.y);
      if (dist < bestD) {
        bestD = dist;
        best = job;
      }
    }
    return best;
  }

  function handNeedsHelp(hand) {
    var i, job, trades, k, at, spot, ready;
    if (hand.taskId) {
      job = jobById(hand.taskId);
      if (!job) return false;
      trades = StrawBoss.requiredTrades(job);
      if (hand.to) return false;
      at = pathStart(hand);
      spot = standTile(job, hand.trade);
      if (at.x !== spot.x || at.y !== spot.y) return false;
      if (StrawBoss.clockHeld(job, gateFlags())) return true;
      return trades.length >= 2 && !StrawBoss.taskStaffed(job, presence(job));
    }
    ready = StrawBoss.tasksForTrade(level.jobs, done, hand.trade);
    if (ready.length > 1) return true;
    for (i = 0; i < level.jobs.length; i++) {
      job = level.jobs[i];
      if (!StrawBoss.jobState(job, done).blocked) continue;
      trades = StrawBoss.requiredTrades(job);
      for (k = 0; k < trades.length; k++) {
        if (trades[k] === hand.trade) return true;
      }
    }
    return false;
  }

  function promptLine(task, at) {
    var state = StrawBoss.jobState(task, done);
    var openTrip = StrawBoss.tripOpen(level, work, done, save.trip);
    var carried = carry === task.id || subCarry === task.id;
    if (state.done) return task.set;
    if (state.blocked) return StrawBoss.blockText(level.jobs, task, done);
    if (openTrip && (task.id === "power" || task.needs.indexOf("power") !== -1)) return "PANEL TRIP";
    if (task.gate === "sign" && !save.signed[task.id]) return sameSpot(at, task.tile) ? "SIGN IT" : "NEED SIGN";
    if (task.gate === "haul" && !save.hauled[task.id]) {
      if (carried && sameSpot(at, task.tile)) return "DROP IT";
      if (carried) return task.haul === "coil" ? "HAUL COIL" : "HAUL WOOD";
      return "NEED HAUL";
    }
    if (task.gate === "clash" && !save.broke[task.id]) return near(at, task.tile) ? "BREAK UP" : "NEED CALL";
    if (StrawBoss.contested(level.jobs, done, task) && save.marks.indexOf(task.id) === -1) {
      return near(at, task.tile) ? "MARK JOB" : "NEED MARK";
    }
    if ((work[task.id] || 0) > 0) return "WORKING";
    return task.fix;
  }

  function drawHire() {
    if (save.sub) {
      drawText("BOT ON", 448, 8, "#6ea84a", 1);
      return;
    }
    var x = 372;
    var y = 4;
    var w = 100;
    var h = 32;
    rect(x, y, w, h, "#161410");
    rect(x + 1, y + 1, w - 2, h - 2, "#c9a227");
    rect(x + 3, y + 3, w - 6, h - 6, "#1b2420");
    drawText("HIRE BOT", x + (w - textWidth("HIRE BOT", 1)) / 2, y + 6, "#f4e7c3", 1);
    drawText("$4.99", x + (w - textWidth("$4.99", 1)) / 2, y + 16, "#c9a227", 1);
    hits.push({ x: x, y: y, w: w, h: h, enabled: true, onClick: hireSub });
  }

  function drawHud() {
    var clear = StrawBoss.siteClear(level.jobs, done);
    var at = { x: Math.round(stood(player).x), y: Math.round(stood(player).y) };
    if (plateImage()) rect(0, 228, 480, 42, "rgba(22, 20, 16, 0.72)");
    drawText("LEVEL " + level.id, 8, 6, "#f4e7c3", 1);
    drawText(level.name, 8, 16, "#c9a227", 1);
    drawText(doneCount() + "/" + level.jobs.length, 8, 26, "#f4e7c3", 1);
    drawMats();
    drawHire();
    if (clear) {
      drawTextCentered("SITE CLEAR", 214, "#f4e7c3", 2);
      if (save.level < StrawBoss.levels.length) button(176, 234, 128, 28, "NEXT SITE", nextSite, true);
      else drawTextCentered("LARGER SITES LATER", 240, "#c9a227", 1);
      return;
    }
    var hand = nearestHand(at);
    var task = (hand && hand.taskId && jobById(hand.taskId)) || nearestTask(at);
    var line;
    if (!task && !hand) {
      if (carry) {
        line = jobById(carry);
        drawText(line && line.haul === "coil" ? "HAUL COIL" : "HAUL WOOD", 8, 248, "#f4e7c3", 1);
      } else {
        drawText("YOU ARE THE GC", 8, 248, "#f4e7c3", 1);
      }
      if (save.sub) drawText("BOT ON", 250, 248, "#6ea84a", 1);
      return;
    }
    if (hand) drawText(hand.name, 8, 236, "#f4e7c3", 1);
    if (!task) return;
    line = promptLine(task, at);
    drawText(line, 250, 240, line.indexOf("NEED") === 0 || line === "PANEL TRIP" ? "#d27a62" : "#f4e7c3", 1);
  }

  function draw() {
    var queue = [];
    var x, y, i, spot, body, pos, job, frac, hand;
    ctx.imageSmoothingEnabled = false;
    hits = [];
    ctx.fillStyle = "#1b2420";
    ctx.fillRect(0, 0, 480, 270);
    var plate = plateImage();
    if (plate) {
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(plate, 0, 0, 480, 270);
      ctx.imageSmoothingEnabled = false;
    }
    for (y = 0; y < level.rows; y++) {
      for (x = 0; x < level.cols; x++) {
        queue.push({ x: x, y: y, layer: 0, tile: true });
      }
    }
    for (i = 0; i < level.jobs.length; i++) {
      job = level.jobs[i];
      frac = job.ms ? (work[job.id] || 0) / job.ms : 0;
      queue.push({
        x: job.tile.x,
        y: job.tile.y,
        layer: 1,
        prop: job.prop,
        on: !!done[job.id],
        fault: job.prop === "panel" && StrawBoss.tripOpen(level, work, done, save.trip),
        mark: save.marks.indexOf(job.id) !== -1
      });
      if (frac > 0 && frac < 1) {
        queue.push({ x: job.tile.x, y: job.tile.y, layer: 3, meter: frac });
      }
      if (job.gate === "haul" && job.pile && !done[job.id] && !save.hauled[job.id] && carry !== job.id && subCarry !== job.id) {
        queue.push({ x: job.pile.x, y: job.pile.y, layer: 1, pile: job.haul || "wood" });
      }
    }
    for (i = 0; i < hands.length; i++) {
      hand = hands[i];
      pos = stood(hand);
      queue.push({
        x: pos.x,
        y: pos.y,
        layer: 2,
        person: hand,
        role: hand.trade,
        help: handNeedsHelp(hand),
        moving: !!hand.to || (!!hand.taskId && !hand.to && (work[hand.taskId] || 0) > 0)
      });
    }
    pos = stood(player);
    queue.push({
      x: pos.x,
      y: pos.y,
      layer: 2,
      role: "boss",
      moving: !!player.to,
      boss: true,
      load: carry ? (jobById(carry).haul || "wood") : ""
    });
    if (save.sub) {
      pos = stood(sub);
      queue.push({
        x: pos.x,
        y: pos.y,
        layer: 2,
        role: "sub",
        moving: !!sub.to,
        sub: true,
        load: subCarry ? (jobById(subCarry).haul || "wood") : ""
      });
    }
    queue.sort(function (a, b) {
      return (a.x + a.y) - (b.x + b.y) || a.layer - b.layer || a.x - b.x;
    });
    for (i = 0; i < queue.length; i++) {
      body = queue[i];
      spot = screenTop(body.x, body.y);
      if (body.tile) {
        if (plate) drawDiamondOutline(spot.sx, spot.sy);
        else drawDiamond(spot.sx, spot.sy, floorColor(body.x, body.y));
      }
      else if (body.prop) {
        if (plate) {
          rect(spot.sx - 2, spot.sy + 5, 4, 4, "#161410");
          rect(spot.sx - 1, spot.sy + 6, 2, 2, body.fault ? "#e23b32" : (body.on ? "#6ea84a" : "#c9a227"));
        } else {
          drawProp(body.prop, spot.sx, spot.sy, body.on, body.fault);
        }
        if (body.mark) drawMarkPip(spot.sx, spot.sy);
      } else if (body.pile) drawPile(body.pile, spot.sx, spot.sy);
      else if (body.meter) drawMeter(spot.sx, spot.sy, body.meter);
      else if (body.person) {
        drawPerson(spot.sx, spot.sy + 14, body.role, body.person.look, body.moving);
        if (body.help) drawBang(spot.sx, spot.sy + 14);
      } else if (body.boss) {
        drawPerson(spot.sx, spot.sy + 14, "boss", { skin: 0, hair: 1 }, body.moving);
        if (body.load) drawPile(body.load, spot.sx + 8, spot.sy);
      } else if (body.sub) {
        drawPerson(spot.sx, spot.sy + 14, "sub", { skin: 2, hair: 1 }, body.moving);
        if (body.load) drawPile(body.load, spot.sx + 8, spot.sy);
      }
    }
    drawHud();
  }

  function tileAt(px, py) {
    var best = null;
    var bestScore = 1.01;
    var x, y, top, score;
    for (y = 0; y < level.rows; y++) {
      for (x = 0; x < level.cols; x++) {
        top = screenTop(x, y);
        score = Math.abs(px - top.sx) / 16 + Math.abs(py - (top.sy + 8)) / 8;
        if (score <= 1 && score < bestScore) {
          best = { x: x, y: y };
          bestScore = score;
        }
      }
    }
    return best;
  }

  function handAt(px, py) {
    var found = null;
    var i, pos, top, feetY;
    for (i = 0; i < hands.length; i++) {
      pos = stood(hands[i]);
      top = screenTop(pos.x, pos.y);
      feetY = top.sy + 14;
      if (px >= top.sx - 10 && px < top.sx + 14 && py >= feetY - 44 && py < feetY + 2) found = hands[i];
    }
    return found;
  }

  function pointer(ev) {
    var rectBox = canvas.getBoundingClientRect();
    var px = (ev.clientX - rectBox.left) * (canvas.width / rectBox.width);
    var py = (ev.clientY - rectBox.top) * (canvas.height / rectBox.height);
    var i, hit, hand, at, tile;
    for (i = hits.length - 1; i >= 0; i--) {
      hit = hits[i];
      if (px >= hit.x && px < hit.x + hit.w && py >= hit.y && py < hit.y + hit.h) {
        if (hit.enabled && hit.onClick) hit.onClick();
        return;
      }
    }
    hand = handAt(px, py);
    at = pathStart(player);
    if (player.to) {
      player.from = { x: player.to.x, y: player.to.y };
      player.to = null;
      player.t = 1;
      at = player.from;
    }
    if (hand) {
      player.dest = null;
      player.path = pathBeside(at, pathStart(hand));
      return;
    }
    tile = tileAt(px, py);
    if (!tile) return;
    toggleMark(tile);
    player.dest = null;
    player.path = pathToTile(at, tile);
  }

  function jobOnTile(tile) {
    var i, job;
    for (i = 0; i < level.jobs.length; i++) {
      job = level.jobs[i];
      if (sameSpot(job.tile, tile) || (job.partner && sameSpot(job.partner, tile))) return job;
    }
    return null;
  }

  function toggleMark(tile) {
    var job = jobOnTile(tile);
    var idx;
    if (!job || !StrawBoss.contested(level.jobs, done, job)) return;
    idx = save.marks.indexOf(job.id);
    if (idx === -1) save.marks.push(job.id);
    else save.marks.splice(idx, 1);
    persist();
  }

  function grabPile() {
    var at, i, job;
    if (carry) return;
    at = pathStart(player);
    for (i = 0; i < level.jobs.length; i++) {
      job = level.jobs[i];
      if (job.gate !== "haul" || !job.pile || save.hauled[job.id] || done[job.id]) continue;
      if (subCarry === job.id) continue;
      if (!sameSpot(at, job.pile)) continue;
      carry = job.id;
      return;
    }
  }

  function tryAct() {
    var at, i, job, beside;
    if (!player || player.to) return;
    at = pathStart(player);
    if (carry) {
      job = jobById(carry);
      if (job && sameSpot(at, job.tile)) {
        save.hauled[job.id] = true;
        carry = null;
        persist();
        return;
      }
    }
    job = jobById("power");
    if (job && StrawBoss.tripOpen(level, work, done, save.trip) && sameSpot(at, job.tile)) {
      save.trip = true;
      persist();
      return;
    }
    for (i = 0; i < level.jobs.length; i++) {
      job = level.jobs[i];
      if (job.gate !== "sign" || save.signed[job.id]) continue;
      if (!StrawBoss.jobState(job, done).ready || !sameSpot(at, job.tile)) continue;
      save.signed[job.id] = true;
      if (!StrawBoss.requiredTrades(job).length) finishJob(job.id);
      else persist();
      return;
    }
    for (i = 0; i < level.jobs.length; i++) {
      job = level.jobs[i];
      if (job.gate !== "clash" || save.broke[job.id]) continue;
      if (!StrawBoss.jobState(job, done).ready) continue;
      beside = near(at, job.tile) || (job.partner && near(at, job.partner));
      if (!beside || !StrawBoss.taskStaffed(job, presence(job))) continue;
      save.broke[job.id] = true;
      persist();
      return;
    }
  }

  function onKey(ev, down) {
    var name = ev.key.toUpperCase();
    var was = !!keys[name];
    if (KEY_STEP[name] || name === " " || name === "E" || name === "ENTER") ev.preventDefault();
    keys[name] = down;
    if (down && !was && (name === " " || name === "E" || name === "ENTER")) tryAct();
  }

  canvas.addEventListener("pointerdown", pointer);
  window.addEventListener("keydown", function (ev) { onKey(ev, true); });
  window.addEventListener("keyup", function (ev) { onKey(ev, false); });
  window.addEventListener("error", function (ev) {
    var note = document.createElement("pre");
    note.textContent = ev.message;
    note.style.cssText = "color:#f4e7c3;font:14px monospace;margin:8px";
    document.body.appendChild(note);
  });

  function drawMats() {
    var mats = "MATS " + String(save.mats || 0);
    var rate = "RATE " + StrawBoss.matRate(save.level, save.sub) + "/S";
    var w = Math.max(textWidth(mats, 1), textWidth(rate, 1)) + 8;
    rect(4, 34, w, 22, "rgba(22, 20, 16, 0.72)");
    drawText(mats, 8, 36, "#f4e7c3", 1);
    drawText(rate, 8, 46, "#c9a227", 1);
  }

  loadLevel();

  var last = 0;
  function frame(now) {
    var dt = last ? Math.min(50, now - last) : 16;
    last = now;
    clock = now;
    applyIdle(Date.now());
    updatePlayer(dt);
    updateCrew(dt);
    updateSub(dt);
    if (StrawBoss.siteClear(level.jobs, done)) nextSite();
    draw();
    requestAnimationFrame(frame);
  }
  window.addEventListener("pagehide", stampProgress);
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stampProgress();
  });
  requestAnimationFrame(frame);
})();
