(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.StrawBoss = api;
})(typeof self !== "undefined" ? self : this, function () {
  var FIRST = ["Ace", "Bo", "Cal", "Dex", "Eli", "Finn", "Gus", "Hal", "Ivo", "Jed", "Kit", "Len", "Mac", "Ned", "Otto", "Pip", "Quin", "Rex", "Sol", "Ted", "Ulf", "Vic", "Wes", "Xan"];
  var LAST = ["Volt", "Wire", "Spark", "Amp", "Coil", "Watt", "Bolt", "Phase", "Neutral", "Ground", "Conduit", "Meter", "Fuse", "Breaker", "Switch", "Lamp", "Arc", "Bus", "Relay", "Panel"];
  var BEATS = { carpenter: "plumber", electrician: "carpenter", plumber: "electrician" };
  var RIVAL_SEEDS = ["straw-boss-rival-1", "straw-boss-rival-2", "straw-boss-rival-3"];
  var ROSTER_CAP = 5;
  var K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  function rotr(x, n) {
    return (x >>> n) | (x << (32 - n));
  }

  function sha256Hex(message) {
    var bytes = new TextEncoder().encode(String(message));
    var bitLen = bytes.length * 8;
    var paddedLen = Math.ceil((bitLen + 1 + 64) / 512) * 64;
    var buf = new Uint8Array(paddedLen);
    buf.set(bytes);
    buf[bytes.length] = 0x80;
    var view = new DataView(buf.buffer);
    view.setUint32(paddedLen - 8, Math.floor(bitLen / 0x100000000), false);
    view.setUint32(paddedLen - 4, bitLen >>> 0, false);
    var h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
    var h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
    var w = new Uint32Array(64);
    var i, t, a, b, c, d, e, f, g, h, s0, s1, ch, S0, S1, maj, temp1, temp2;
    for (i = 0; i < paddedLen; i += 64) {
      for (t = 0; t < 16; t++) w[t] = view.getUint32(i + t * 4, false);
      for (t = 16; t < 64; t++) {
        s0 = (rotr(w[t - 15], 7) ^ rotr(w[t - 15], 18) ^ (w[t - 15] >>> 3)) >>> 0;
        s1 = (rotr(w[t - 2], 17) ^ rotr(w[t - 2], 19) ^ (w[t - 2] >>> 10)) >>> 0;
        w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
      }
      a = h0; b = h1; c = h2; d = h3; e = h4; f = h5; g = h6; h = h7;
      for (t = 0; t < 64; t++) {
        S1 = (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) >>> 0;
        ch = ((e & f) ^ ((~e) & g)) >>> 0;
        temp1 = (h + S1 + ch + K[t] + w[t]) >>> 0;
        S0 = (rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) >>> 0;
        maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
        temp2 = (S0 + maj) >>> 0;
        h = g; g = f; f = e; e = (d + temp1) >>> 0; d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
      }
      h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
      h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
    }
    return [h0, h1, h2, h3, h4, h5, h6, h7].map(function (n) {
      return n.toString(16).padStart(8, "0");
    }).join("");
  }

  function byteAt(hex, index) {
    return parseInt(hex.substr(index * 2, 2), 16);
  }

  function span(byte, min, max) {
    return min + (byte % (max - min + 1));
  }

  function workerFromText(text) {
    var hex = sha256Hex(text);
    var b = function (i) { return byteAt(hex, i); };
    return {
      id: hex,
      name: FIRST[b(3) % FIRST.length] + " " + LAST[b(4) % LAST.length],
      trade: "electrician",
      nerve: span(b(0), 7, 10),
      work: span(b(1), 1, 4),
      finish: span(b(2), 4, 8),
      look: {
        hat: b(5) % 6,
        skin: b(6) % 5,
        hair: b(7) % 4,
        tool: b(8) % 3
      }
    };
  }

  function toSave(member) {
    return {
      id: member.id,
      name: member.name,
      trade: member.trade,
      work: member.work,
      nerve: member.nerve,
      finish: member.finish,
      look: {
        hat: member.look.hat,
        skin: member.look.skin,
        hair: member.look.hair,
        tool: member.look.tool
      }
    };
  }

  function onCrew(members, id) {
    return members.some(function (member) { return member.id === id; });
  }

  function hireState(members, worker) {
    if (onCrew(members, worker.id)) return { enabled: false, reason: "Already on the crew." };
    if (members.length >= ROSTER_CAP) return { enabled: false, reason: "The crew is full." };
    return { enabled: true, reason: "" };
  }

  function addMember(members, worker) {
    var state = hireState(members, worker);
    if (!state.enabled) return members.slice();
    return members.concat([toSave(worker)]);
  }

  function cardId(lineup) {
    return lineup.map(function (member) { return member.id; }).join("|");
  }

  function statSum(member) {
    return member.work + member.nerve + member.finish;
  }

  function pairWinner(a, b) {
    if (BEATS[a.trade] === b.trade) return "a";
    if (BEATS[b.trade] === a.trade) return "b";
    var sa = statSum(a);
    var sb = statSum(b);
    if (sa !== sb) return sa > sb ? "a" : "b";
    if (a.nerve !== b.nerve) return a.nerve > b.nerve ? "a" : "b";
    if (a.finish !== b.finish) return a.finish > b.finish ? "a" : "b";
    if (a.work !== b.work) return a.work > b.work ? "a" : "b";
    return "tie";
  }

  function fight(lineupA, lineupB) {
    var pairs = [];
    var wins = { a: 0, b: 0 };
    var i, side;
    for (i = 0; i < 3; i++) {
      side = pairWinner(lineupA[i], lineupB[i]);
      if (side === "a" || side === "b") wins[side] += 1;
      pairs.push({ slot: i + 1, winner: side });
    }
    var totalA = lineupA.reduce(function (sum, member) { return sum + statSum(member); }, 0);
    var totalB = lineupB.reduce(function (sum, member) { return sum + statSum(member); }, 0);
    var idA = cardId(lineupA);
    var idB = cardId(lineupB);
    var winner;
    if (wins.a > wins.b) winner = "a";
    else if (wins.b > wins.a) winner = "b";
    else if (totalA !== totalB) winner = totalA > totalB ? "a" : "b";
    else if (idA !== idB) winner = idA < idB ? "a" : "b";
    else winner = "tie";
    return { pairs: pairs, wins: wins, totalA: totalA, totalB: totalB, cardA: idA, cardB: idB, winner: winner };
  }

  function rivalLineup() {
    return RIVAL_SEEDS.map(workerFromText);
  }

  var CREW_NAMES = {
    electrician: { first: FIRST, last: LAST },
    carpenter: {
      first: ["Hank", "Red", "Beau", "Ike", "Roy", "Sal", "Gil", "Ned", "Cal", "Wes"],
      last: ["Joist", "Stud", "Rafter", "Plumb", "Brace", "Nail", "Birch", "Oak", "Pine", "Beam"]
    },
    plumber: {
      first: ["Ned", "Roy", "Gus", "Hal", "Ivo", "Jed", "Kit", "Len", "Mac", "Otto"],
      last: ["Pipe", "Drain", "Valve", "Flush", "Sewer", "Trap", "Joint", "Flow", "Main", "Spout"]
    }
  };

  function crewMember(seed, trade) {
    var book = CREW_NAMES[trade] || CREW_NAMES.electrician;
    var hex = sha256Hex(seed);
    var b = function (i) { return byteAt(hex, i); };
    return {
      id: hex,
      name: book.first[b(3) % book.first.length] + " " + book.last[b(4) % book.last.length],
      trade: book === CREW_NAMES[trade] ? trade : "electrician",
      look: {
        hat: b(5) % 6,
        skin: b(6) % 5,
        hair: b(7) % 4,
        tool: b(8) % 3
      }
    };
  }

  var HUD_LINES = [
    "SIGN IT", "MARK JOB", "HAUL WOOD", "HAUL COIL", "DROP IT", "BREAK UP",
    "PANEL TRIP", "NEED MARK", "NEED SIGN", "NEED HAUL", "NEED CALL", "WORKING",
    "YOU ARE THE GC", "BOT ON", "HIRE BOT", "SITE CLEAR", "NEXT SITE",
    "LARGER SITES LATER", "MATS", "RATE"
  ];

  var FONT_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .-/!$";

  function fontSafe(text) {
    var upper = String(text).toUpperCase();
    var i;
    for (i = 0; i < upper.length; i++) {
      if (FONT_CHARS.indexOf(upper.charAt(i)) === -1) return false;
    }
    return true;
  }

  var LEVELS = [
    {
      id: 1,
      name: "SMALL HOUSE",
      cols: 8,
      rows: 6,
      spawn: { x: 4, y: 5 },
      crew: [
        { seed: "sb-l1-e1", trade: "electrician", x: 1, y: 2 },
        { seed: "sb-l1-e2", trade: "electrician", x: 2, y: 2 },
        { seed: "sb-l1-c1", trade: "carpenter", x: 1, y: 4 },
        { seed: "sb-l1-c2", trade: "carpenter", x: 1, y: 5 },
        { seed: "sb-l1-p1", trade: "plumber", x: 5, y: 5 },
        { seed: "sb-l1-p2", trade: "plumber", x: 7, y: 4 }
      ],
      jobs: [
        {
          id: "power",
          trade: "electrician",
          trades: ["electrician"],
          needs: [],
          ms: 2400,
          gate: "sign",
          fix: "LAND POWER",
          hold: "NEED POWER",
          set: "POWER ON",
          prop: "panel",
          tile: { x: 1, y: 1 }
        },
        {
          id: "lights",
          trade: "electrician",
          trades: ["electrician"],
          needs: ["power"],
          ms: 2800,
          fix: "HIT LIGHTS",
          hold: "NEED LIGHTS",
          set: "LIT",
          prop: "lights",
          tile: { x: 4, y: 2 }
        },
        {
          id: "outlets",
          trade: "electrician",
          trades: ["electrician"],
          needs: ["power"],
          ms: 2400,
          fix: "SET PLUGS",
          hold: "NEED PLUGS",
          set: "PLUGGED",
          prop: "outlet",
          tile: { x: 5, y: 3 }
        },
        {
          id: "frame",
          trade: "carpenter",
          trades: ["carpenter"],
          needs: ["power"],
          ms: 3200,
          gate: "haul",
          haul: "wood",
          pile: { x: 0, y: 5 },
          fix: "RUN SAWS",
          hold: "NEED FRAME",
          set: "FRAMED",
          prop: "studs",
          tile: { x: 2, y: 4 }
        },
        {
          id: "supply",
          trade: "plumber",
          trades: ["plumber"],
          needs: ["power", "frame"],
          ms: 3000,
          fix: "RUN PIPE",
          hold: "NEED PIPE",
          set: "PIPED",
          prop: "pipe",
          tile: { x: 6, y: 4 }
        },
        {
          id: "hookup",
          trade: "plumber",
          trades: ["electrician", "plumber"],
          needs: ["power"],
          ms: 3600,
          gate: "clash",
          fix: "HOOK UP",
          hold: "NEED HOOKUP",
          set: "HOOKED",
          prop: "ac",
          tile: { x: 6, y: 1 },
          partner: { x: 7, y: 1 }
        },
        {
          id: "inspect",
          trade: "boss",
          trades: [],
          needs: ["power", "lights", "outlets", "frame", "supply", "hookup"],
          ms: 0,
          gate: "sign",
          fix: "FINAL SIGN",
          hold: "NEED SIGN",
          set: "PASSED",
          prop: "note",
          tile: { x: 3, y: 5 }
        }
      ],
      rooms: [
        {
          job: "lights",
          open: "#6b6240",
          shut: "#1a1814",
          tiles: [
            { x: 3, y: 1 }, { x: 4, y: 1 }, { x: 5, y: 1 },
            { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 5, y: 2 },
            { x: 3, y: 3 }, { x: 4, y: 3 }, { x: 5, y: 3 }
          ]
        }
      ]
    },
    {
      id: 2,
      name: "WIDE HOUSE",
      cols: 12,
      rows: 8,
      trip: true,
      spawn: { x: 5, y: 7 },
      crew: [
        { seed: "sb-l2-e1", trade: "electrician", x: 1, y: 2 },
        { seed: "sb-l2-e2", trade: "electrician", x: 2, y: 2 },
        { seed: "sb-l2-e3", trade: "electrician", x: 3, y: 2 },
        { seed: "sb-l2-c1", trade: "carpenter", x: 1, y: 6 },
        { seed: "sb-l2-c2", trade: "carpenter", x: 2, y: 6 },
        { seed: "sb-l2-c3", trade: "carpenter", x: 4, y: 6 },
        { seed: "sb-l2-p1", trade: "plumber", x: 6, y: 7 },
        { seed: "sb-l2-p2", trade: "plumber", x: 8, y: 7 }
      ],
      jobs: [
        {
          id: "power",
          trade: "electrician",
          trades: ["electrician"],
          needs: [],
          ms: 2200,
          gate: "sign",
          fix: "LAND POWER",
          hold: "NEED POWER",
          set: "POWER ON",
          prop: "panel",
          tile: { x: 1, y: 1 }
        },
        {
          id: "lights",
          trade: "electrician",
          trades: ["electrician"],
          needs: ["power"],
          ms: 2600,
          fix: "HIT LIGHTS",
          hold: "NEED LIGHTS",
          set: "LIT",
          prop: "lights",
          tile: { x: 5, y: 2 }
        },
        {
          id: "lamps",
          trade: "electrician",
          trades: ["electrician"],
          needs: ["power"],
          ms: 2600,
          gate: "haul",
          haul: "coil",
          pile: { x: 11, y: 2 },
          fix: "LIGHT ROOM",
          hold: "NEED LAMPS",
          set: "LAMP ON",
          prop: "lights",
          tile: { x: 8, y: 2 }
        },
        {
          id: "frame",
          trade: "carpenter",
          trades: ["carpenter"],
          needs: ["power"],
          ms: 3400,
          gate: "haul",
          haul: "wood",
          pile: { x: 11, y: 7 },
          fix: "RUN SAWS",
          hold: "NEED FRAME",
          set: "FRAMED",
          prop: "studs",
          tile: { x: 2, y: 5 }
        },
        {
          id: "deck",
          trade: "carpenter",
          trades: ["carpenter"],
          needs: ["power"],
          ms: 3000,
          fix: "LAY DECK",
          hold: "NEED DECK",
          set: "DECKED",
          prop: "deck",
          tile: { x: 3, y: 4 }
        },
        {
          id: "supply",
          trade: "plumber",
          trades: ["plumber"],
          needs: ["power", "frame"],
          ms: 3000,
          fix: "RUN PIPE",
          hold: "NEED PIPE",
          set: "PIPED",
          prop: "pipe",
          tile: { x: 6, y: 5 }
        },
        {
          id: "hookup",
          trade: "plumber",
          trades: ["electrician", "plumber"],
          needs: ["power", "supply"],
          ms: 4000,
          gate: "clash",
          fix: "HOOK UP",
          hold: "NEED HOOKUP",
          set: "HOOKED",
          prop: "ac",
          tile: { x: 10, y: 4 },
          partner: { x: 11, y: 4 }
        },
        {
          id: "trim",
          trade: "carpenter",
          trades: ["carpenter"],
          needs: ["frame", "lights", "lamps"],
          ms: 2800,
          fix: "HANG TRIM",
          hold: "NEED TRIM",
          set: "TRIMMED",
          prop: "trim",
          tile: { x: 9, y: 6 }
        },
        {
          id: "inspect",
          trade: "boss",
          trades: [],
          needs: ["power", "lights", "lamps", "frame", "deck", "supply", "hookup", "trim"],
          ms: 0,
          gate: "sign",
          fix: "FINAL SIGN",
          hold: "NEED SIGN",
          set: "PASSED",
          prop: "note",
          tile: { x: 5, y: 6 }
        }
      ],
      rooms: [
        {
          job: "lights",
          open: "#6b6240",
          shut: "#1a1814",
          tiles: [
            { x: 4, y: 1 }, { x: 5, y: 1 }, { x: 6, y: 1 },
            { x: 4, y: 2 }, { x: 5, y: 2 }, { x: 6, y: 2 },
            { x: 4, y: 3 }, { x: 5, y: 3 }
          ]
        },
        {
          job: "lamps",
          open: "#6b6240",
          shut: "#1a1814",
          tiles: [
            { x: 8, y: 1 }, { x: 9, y: 1 }, { x: 10, y: 1 },
            { x: 8, y: 2 }, { x: 9, y: 2 }, { x: 10, y: 2 },
            { x: 8, y: 3 }, { x: 9, y: 3 }
          ]
        }
      ]
    },
    {
      id: 3,
      name: "FULL HOUSE",
      plate: "assets/house-floor.jpg",
      cols: 12,
      rows: 8,
      fill: "#5c4a38",
      edge: "#3d342c",
      spawn: { x: 6, y: 7 },
      crew: [
        { seed: "sb-l3-e1", trade: "electrician", x: 1, y: 2 },
        { seed: "sb-l3-e2", trade: "electrician", x: 2, y: 2 },
        { seed: "sb-l3-e3", trade: "electrician", x: 3, y: 2 },
        { seed: "sb-l3-c1", trade: "carpenter", x: 2, y: 5 },
        { seed: "sb-l3-c2", trade: "carpenter", x: 3, y: 5 },
        { seed: "sb-l3-c3", trade: "carpenter", x: 4, y: 6 },
        { seed: "sb-l3-p1", trade: "plumber", x: 6, y: 5 },
        { seed: "sb-l3-p2", trade: "plumber", x: 7, y: 4 },
        { seed: "sb-l3-p3", trade: "plumber", x: 7, y: 5 }
      ],
      jobs: [
        {
          id: "power",
          trade: "electrician",
          trades: ["electrician"],
          needs: [],
          ms: 2200,
          gate: "sign",
          fix: "LAND POWER",
          hold: "NEED POWER",
          set: "POWER ON",
          prop: "panel",
          tile: { x: 0, y: 0 }
        },
        {
          id: "lights",
          trade: "electrician",
          trades: ["electrician"],
          needs: ["power"],
          ms: 2600,
          fix: "HIT LIGHTS",
          hold: "NEED LIGHTS",
          set: "LIT",
          prop: "lights",
          tile: { x: 5, y: 1 }
        },
        {
          id: "lamps",
          trade: "electrician",
          trades: ["electrician"],
          needs: ["power"],
          ms: 2600,
          fix: "LIGHT ROOM",
          hold: "NEED LAMPS",
          set: "LAMP ON",
          prop: "lights",
          tile: { x: 9, y: 4 }
        },
        {
          id: "range",
          trade: "electrician",
          trades: ["electrician"],
          needs: ["power"],
          ms: 3000,
          gate: "haul",
          haul: "coil",
          pile: { x: 11, y: 0 },
          fix: "SET RANGE",
          hold: "NEED RANGE",
          set: "RANGE ON",
          prop: "range",
          tile: { x: 10, y: 2 }
        },
        {
          id: "frame",
          trade: "carpenter",
          trades: ["carpenter"],
          needs: ["power"],
          ms: 3400,
          gate: "haul",
          haul: "wood",
          pile: { x: 11, y: 7 },
          fix: "RUN SAWS",
          hold: "NEED FRAME",
          set: "FRAMED",
          prop: "studs",
          tile: { x: 3, y: 3 }
        },
        {
          id: "porch",
          trade: "carpenter",
          trades: ["carpenter"],
          needs: ["power"],
          ms: 3000,
          fix: "LAY PORCH",
          hold: "NEED PORCH",
          set: "PORCHED",
          prop: "deck",
          tile: { x: 0, y: 6 }
        },
        {
          id: "cabs",
          trade: "carpenter",
          trades: ["carpenter"],
          needs: ["frame"],
          ms: 2800,
          fix: "HANG CABS",
          hold: "NEED CABS",
          set: "CABS UP",
          prop: "cabs",
          tile: { x: 8, y: 2 }
        },
        {
          id: "heater",
          trade: "plumber",
          trades: ["plumber"],
          needs: ["power"],
          ms: 2600,
          fix: "SET HEATER",
          hold: "NEED HEATER",
          set: "HEATED",
          prop: "heater",
          tile: { x: 1, y: 1 }
        },
        {
          id: "bath",
          trade: "plumber",
          trades: ["plumber"],
          needs: ["power", "frame"],
          ms: 3000,
          fix: "SET BATH",
          hold: "NEED BATH",
          set: "BATH SET",
          prop: "bath",
          tile: { x: 0, y: 3 }
        },
        {
          id: "sink",
          trade: "plumber",
          trades: ["plumber"],
          needs: ["power", "frame"],
          ms: 2800,
          fix: "SET SINK",
          hold: "NEED SINK",
          set: "SINK SET",
          prop: "sink",
          tile: { x: 9, y: 1 }
        },
        {
          id: "washer",
          trade: "plumber",
          trades: ["plumber"],
          needs: ["sink"],
          ms: 2800,
          fix: "SET WASHER",
          hold: "NEED WASHER",
          set: "WASH SET",
          prop: "washer",
          tile: { x: 4, y: 4 }
        },
        {
          id: "hookup",
          trade: "plumber",
          trades: ["electrician", "plumber"],
          needs: ["power", "heater"],
          ms: 4000,
          gate: "clash",
          fix: "HOOK UP",
          hold: "NEED HOOKUP",
          set: "HOOKED",
          prop: "ac",
          tile: { x: 2, y: 0 },
          partner: { x: 3, y: 0 }
        },
        {
          id: "inspect",
          trade: "boss",
          trades: [],
          needs: ["power", "lights", "lamps", "range", "frame", "porch", "cabs", "heater", "bath", "sink", "washer", "hookup"],
          ms: 0,
          gate: "sign",
          fix: "FINAL SIGN",
          hold: "NEED SIGN",
          set: "PASSED",
          prop: "note",
          tile: { x: 5, y: 6 }
        }
      ],
      rooms: [
        { color: "#454c54", tiles: [
          { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 },
          { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }
        ] },
        { color: "#6a5340", tiles: [
          { x: 8, y: 0 }, { x: 9, y: 0 }, { x: 10, y: 0 }, { x: 11, y: 0 },
          { x: 8, y: 1 }, { x: 9, y: 1 }, { x: 10, y: 1 }, { x: 11, y: 1 },
          { x: 8, y: 2 }, { x: 9, y: 2 }, { x: 10, y: 2 }, { x: 11, y: 2 }
        ] },
        { color: "#3e5560", tiles: [
          { x: 0, y: 3 }, { x: 1, y: 3 },
          { x: 0, y: 4 }, { x: 1, y: 4 }
        ] },
        { color: "#5c5044", tiles: [
          { x: 4, y: 4 }, { x: 5, y: 4 },
          { x: 4, y: 5 }, { x: 5, y: 5 }
        ] },
        { color: "#6e5840", tiles: [
          { x: 0, y: 6 }, { x: 1, y: 6 },
          { x: 0, y: 7 }, { x: 1, y: 7 }
        ] },
        {
          job: "lights",
          open: "#6b6240",
          shut: "#1a1814",
          tiles: [
            { x: 4, y: 0 }, { x: 5, y: 0 }, { x: 6, y: 0 },
            { x: 4, y: 1 }, { x: 5, y: 1 }, { x: 6, y: 1 },
            { x: 4, y: 2 }, { x: 5, y: 2 }, { x: 6, y: 2 }
          ]
        },
        {
          job: "lamps",
          open: "#6b6240",
          shut: "#1a1814",
          tiles: [
            { x: 8, y: 3 }, { x: 9, y: 3 }, { x: 10, y: 3 }, { x: 11, y: 3 },
            { x: 8, y: 4 }, { x: 9, y: 4 }, { x: 10, y: 4 }, { x: 11, y: 4 }
          ]
        }
      ]
    },
    {
      id: 4,
      name: "OFFICE FLOOR",
      plate: "assets/office-floor.jpg",
      cols: 14,
      rows: 8,
      fill: "#3d4a58",
      edge: "#2a3440",
      spawn: { x: 6, y: 7 },
      crew: [
        { seed: "sb-l4-e1", trade: "electrician", x: 1, y: 1 },
        { seed: "sb-l4-e2", trade: "electrician", x: 1, y: 2 },
        { seed: "sb-l4-e3", trade: "electrician", x: 2, y: 1 },
        { seed: "sb-l4-c1", trade: "carpenter", x: 5, y: 3 },
        { seed: "sb-l4-c2", trade: "carpenter", x: 6, y: 3 },
        { seed: "sb-l4-c3", trade: "carpenter", x: 6, y: 4 },
        { seed: "sb-l4-p1", trade: "plumber", x: 1, y: 4 },
        { seed: "sb-l4-p2", trade: "plumber", x: 2, y: 4 }
      ],
      jobs: [
        {
          id: "power",
          trade: "electrician",
          trades: ["electrician"],
          needs: [],
          ms: 2200,
          gate: "sign",
          fix: "LAND POWER",
          hold: "NEED POWER",
          set: "POWER ON",
          prop: "panel",
          tile: { x: 0, y: 0 }
        },
        {
          id: "lights",
          trade: "electrician",
          trades: ["electrician"],
          needs: ["power"],
          ms: 2600,
          fix: "HIT LIGHTS",
          hold: "NEED LIGHTS",
          set: "LIT",
          prop: "lights",
          tile: { x: 5, y: 1 }
        },
        {
          id: "lamps",
          trade: "electrician",
          trades: ["electrician"],
          needs: ["power"],
          ms: 2600,
          fix: "LIGHT ROOM",
          hold: "NEED LAMPS",
          set: "LAMP ON",
          prop: "lights",
          tile: { x: 10, y: 1 }
        },
        {
          id: "data",
          trade: "electrician",
          trades: ["electrician"],
          needs: ["power"],
          ms: 2800,
          gate: "haul",
          haul: "coil",
          pile: { x: 13, y: 0 },
          fix: "RUN DATA",
          hold: "NEED DATA",
          set: "DATA ON",
          prop: "outlet",
          tile: { x: 8, y: 2 }
        },
        {
          id: "server",
          trade: "electrician",
          trades: ["electrician"],
          needs: ["power"],
          ms: 3000,
          fix: "SET SERVER",
          hold: "NEED SERVER",
          set: "SERVER ON",
          prop: "server",
          tile: { x: 12, y: 0 }
        },
        {
          id: "frame",
          trade: "carpenter",
          trades: ["carpenter"],
          needs: ["power"],
          ms: 3200,
          gate: "haul",
          haul: "wood",
          pile: { x: 13, y: 5 },
          fix: "RUN WALLS",
          hold: "NEED WALLS",
          set: "WALLED",
          prop: "studs",
          tile: { x: 2, y: 3 }
        },
        {
          id: "desks",
          trade: "carpenter",
          trades: ["carpenter"],
          needs: ["frame"],
          ms: 2800,
          fix: "SET DESKS",
          hold: "NEED DESKS",
          set: "DESK SET",
          prop: "desk",
          tile: { x: 4, y: 3 }
        },
        {
          id: "trim",
          trade: "carpenter",
          trades: ["carpenter"],
          needs: ["frame", "lights", "lamps"],
          ms: 2800,
          fix: "HANG TRIM",
          hold: "NEED TRIM",
          set: "TRIMMED",
          prop: "trim",
          tile: { x: 7, y: 5 }
        },
        {
          id: "sink",
          trade: "plumber",
          trades: ["plumber"],
          needs: ["frame"],
          ms: 2600,
          fix: "SET SINK",
          hold: "NEED SINK",
          set: "SINK SET",
          prop: "sink",
          tile: { x: 3, y: 4 }
        },
        {
          id: "bath",
          trade: "plumber",
          trades: ["plumber"],
          needs: ["frame"],
          ms: 2800,
          fix: "SET BATH",
          hold: "NEED BATH",
          set: "BATH SET",
          prop: "bath",
          tile: { x: 0, y: 4 }
        },
        {
          id: "hookup",
          trade: "plumber",
          trades: ["electrician", "plumber"],
          needs: ["power"],
          ms: 3600,
          gate: "clash",
          fix: "HOOK UP",
          hold: "NEED HOOKUP",
          set: "HOOKED",
          prop: "ac",
          tile: { x: 10, y: 4 },
          partner: { x: 11, y: 4 }
        },
        {
          id: "inspect",
          trade: "boss",
          trades: [],
          needs: ["power", "lights", "lamps", "data", "server", "frame", "desks", "trim", "sink", "bath", "hookup"],
          ms: 0,
          gate: "sign",
          fix: "FINAL SIGN",
          hold: "NEED SIGN",
          set: "PASSED",
          prop: "note",
          tile: { x: 5, y: 6 }
        }
      ],
      rooms: [
        {
          job: "lights",
          open: "#6a7c8c",
          shut: "#1a1814",
          tiles: [
            { x: 4, y: 0 }, { x: 5, y: 0 }, { x: 6, y: 0 }, { x: 7, y: 0 }, { x: 8, y: 0 },
            { x: 4, y: 1 }, { x: 5, y: 1 }, { x: 6, y: 1 }, { x: 7, y: 1 }, { x: 8, y: 1 },
            { x: 4, y: 2 }, { x: 5, y: 2 }, { x: 6, y: 2 }, { x: 7, y: 2 }, { x: 8, y: 2 }
          ]
        },
        {
          job: "lamps",
          open: "#6a7c8c",
          shut: "#1a1814",
          tiles: [
            { x: 9, y: 0 }, { x: 10, y: 0 }, { x: 11, y: 0 },
            { x: 9, y: 1 }, { x: 10, y: 1 }, { x: 11, y: 1 },
            { x: 9, y: 2 }, { x: 10, y: 2 }, { x: 11, y: 2 }
          ]
        }
      ]
    },
    {
      id: 5,
      name: "FACTORY FLOOR",
      plate: "assets/factory-floor.jpg",
      cols: 14,
      rows: 8,
      trip: true,
      fill: "#4a4e52",
      edge: "#2e3236",
      spawn: { x: 5, y: 7 },
      crew: [
        { seed: "sb-l5-e1", trade: "electrician", x: 1, y: 1 },
        { seed: "sb-l5-e2", trade: "electrician", x: 2, y: 1 },
        { seed: "sb-l5-e3", trade: "electrician", x: 2, y: 2 },
        { seed: "sb-l5-c1", trade: "carpenter", x: 2, y: 3 },
        { seed: "sb-l5-c2", trade: "carpenter", x: 3, y: 3 },
        { seed: "sb-l5-c3", trade: "carpenter", x: 3, y: 5 },
        { seed: "sb-l5-p1", trade: "plumber", x: 1, y: 4 },
        { seed: "sb-l5-p2", trade: "plumber", x: 1, y: 5 }
      ],
      jobs: [
        {
          id: "power",
          trade: "electrician",
          trades: ["electrician"],
          needs: [],
          ms: 2200,
          gate: "sign",
          fix: "LAND POWER",
          hold: "NEED POWER",
          set: "POWER ON",
          prop: "panel",
          tile: { x: 0, y: 0 }
        },
        {
          id: "lights",
          trade: "electrician",
          trades: ["electrician"],
          needs: ["power"],
          ms: 2600,
          fix: "HIT LIGHTS",
          hold: "NEED LIGHTS",
          set: "LIT",
          prop: "lights",
          tile: { x: 4, y: 1 }
        },
        {
          id: "lamps",
          trade: "electrician",
          trades: ["electrician"],
          needs: ["power"],
          ms: 2600,
          fix: "LIGHT BAY",
          hold: "NEED LAMPS",
          set: "BAY LIT",
          prop: "lights",
          tile: { x: 9, y: 1 }
        },
        {
          id: "press",
          trade: "electrician",
          trades: ["electrician"],
          needs: ["power"],
          ms: 3200,
          gate: "haul",
          haul: "coil",
          pile: { x: 12, y: 0 },
          fix: "SET PRESS",
          hold: "NEED PRESS",
          set: "PRESS ON",
          prop: "machine",
          tile: { x: 8, y: 3 }
        },
        {
          id: "air",
          trade: "electrician",
          trades: ["electrician"],
          needs: ["power"],
          ms: 2800,
          fix: "RUN AIR",
          hold: "NEED AIR",
          set: "AIR ON",
          prop: "ac",
          tile: { x: 9, y: 4 }
        },
        {
          id: "bench",
          trade: "carpenter",
          trades: ["carpenter"],
          needs: ["power"],
          ms: 3400,
          gate: "haul",
          haul: "wood",
          pile: { x: 13, y: 4 },
          fix: "BUILD BENCH",
          hold: "NEED BENCH",
          set: "BENCHED",
          prop: "bench",
          tile: { x: 1, y: 3 }
        },
        {
          id: "dock",
          trade: "carpenter",
          trades: ["carpenter"],
          needs: ["power"],
          ms: 3000,
          fix: "SET DOCK",
          hold: "NEED DOCK",
          set: "DOCK SET",
          prop: "dock",
          tile: { x: 6, y: 5 }
        },
        {
          id: "guard",
          trade: "carpenter",
          trades: ["carpenter"],
          needs: ["bench", "lights", "lamps"],
          ms: 2800,
          fix: "HANG GUARD",
          hold: "NEED GUARD",
          set: "GUARDED",
          prop: "trim",
          tile: { x: 7, y: 6 }
        },
        {
          id: "water",
          trade: "plumber",
          trades: ["plumber"],
          needs: ["power"],
          ms: 3000,
          fix: "RUN WATER",
          hold: "NEED WATER",
          set: "WATER ON",
          prop: "pipe",
          tile: { x: 0, y: 5 }
        },
        {
          id: "wash",
          trade: "plumber",
          trades: ["plumber"],
          needs: ["water"],
          ms: 2600,
          fix: "SET WASH",
          hold: "NEED WASH",
          set: "WASH SET",
          prop: "sink",
          tile: { x: 0, y: 4 }
        },
        {
          id: "hookup",
          trade: "plumber",
          trades: ["electrician", "plumber"],
          needs: ["power", "water"],
          ms: 4000,
          gate: "clash",
          fix: "HOOK LINE",
          hold: "NEED HOOKUP",
          set: "HOOKED",
          prop: "machine",
          tile: { x: 12, y: 5 },
          partner: { x: 13, y: 5 }
        },
        {
          id: "inspect",
          trade: "boss",
          trades: [],
          needs: ["power", "lights", "lamps", "press", "air", "bench", "dock", "guard", "water", "wash", "hookup"],
          ms: 0,
          gate: "sign",
          fix: "FINAL SIGN",
          hold: "NEED SIGN",
          set: "PASSED",
          prop: "note",
          tile: { x: 4, y: 6 }
        }
      ],
      rooms: [
        {
          job: "lights",
          open: "#6a7074",
          shut: "#1a1814",
          tiles: [
            { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }, { x: 6, y: 0 }, { x: 7, y: 0 },
            { x: 3, y: 1 }, { x: 4, y: 1 }, { x: 5, y: 1 }, { x: 6, y: 1 }, { x: 7, y: 1 },
            { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 5, y: 2 }, { x: 6, y: 2 }, { x: 7, y: 2 }
          ]
        },
        {
          job: "lamps",
          open: "#6a7074",
          shut: "#1a1814",
          tiles: [
            { x: 8, y: 0 }, { x: 9, y: 0 }, { x: 10, y: 0 }, { x: 11, y: 0 },
            { x: 8, y: 1 }, { x: 9, y: 1 }, { x: 10, y: 1 }, { x: 11, y: 1 },
            { x: 8, y: 2 }, { x: 9, y: 2 }, { x: 10, y: 2 }, { x: 11, y: 2 }
          ]
        }
      ]
    }
  ];

  function jobById(jobs, id) {
    var i;
    for (i = 0; i < jobs.length; i++) {
      if (jobs[i].id === id) return jobs[i];
    }
    return null;
  }

  function requiredTrades(job) {
    if (Object.prototype.toString.call(job.trades) === "[object Array]") return job.trades;
    return [job.trade];
  }

  function taskStaffed(job, have) {
    var need = requiredTrades(job);
    var i;
    for (i = 0; i < need.length; i++) {
      if (!have || !have[need[i]]) return false;
    }
    return true;
  }

  function tasksForTrade(jobs, done, trade) {
    var list = [];
    var i, t, job, trades;
    for (i = 0; i < jobs.length; i++) {
      job = jobs[i];
      if (!jobState(job, done).ready) continue;
      trades = requiredTrades(job);
      for (t = 0; t < trades.length; t++) {
        if (trades[t] === trade) list.push(job);
      }
    }
    return list;
  }

  function contested(jobs, done, job) {
    var trades = requiredTrades(job);
    var t, k, ready;
    if (!jobState(job, done).ready) return false;
    for (t = 0; t < trades.length; t++) {
      ready = tasksForTrade(jobs, done, trades[t]);
      if (ready.length < 2) continue;
      for (k = 0; k < ready.length; k++) {
        if (ready[k].id === job.id) return true;
      }
    }
    return false;
  }

  function assignedForTrade(jobs, done, marks, trade) {
    var ready = tasksForTrade(jobs, done, trade);
    var picked = [];
    var i, j;
    if (ready.length <= 1) return ready;
    for (i = 0; i < marks.length; i++) {
      for (j = 0; j < ready.length; j++) {
        if (ready[j].id === marks[i]) picked.push(ready[j]);
      }
    }
    return picked;
  }

  function tradeWanted(jobs, done, marks, job) {
    var trades = requiredTrades(job);
    var t, k, list;
    for (t = 0; t < trades.length; t++) {
      list = assignedForTrade(jobs, done, marks, trades[t]);
      for (k = 0; k < list.length; k++) {
        if (list[k].id === job.id) return true;
      }
    }
    return false;
  }

  function clockHeld(job, flags) {
    var signed = flags.signed || {};
    var hauled = flags.hauled || {};
    var broke = flags.broke || {};
    if (job.gate === "sign" && !signed[job.id]) return true;
    if (job.gate === "haul" && !hauled[job.id]) return true;
    if (job.gate === "clash" && !broke[job.id]) return true;
    if (flags.trip && job.needs && job.needs.indexOf("power") !== -1) return true;
    return false;
  }

  function tripOpen(level, work, done, cleared) {
    if (!level || !level.trip || cleared) return false;
    var lightsOn = !!(done.lights || (work.lights || 0) > 0);
    var lampsOn = !!(done.lamps || (work.lamps || 0) > 0);
    return lightsOn && lampsOn;
  }

  function advanceWork(job, have, elapsed, dt, hold) {
    var current = elapsed || 0;
    if (hold || !taskStaffed(job, have)) return { elapsed: current, done: false };
    var next = current + (dt || 0);
    return { elapsed: next, done: job.ms > 0 && next >= job.ms };
  }

  function subIntent(level, ctx) {
    var jobs = level.jobs;
    var i, job, best, bestD, dist, trades;
    var done = ctx.done || {};
    var work = ctx.work || {};
    var signed = ctx.signed || {};
    var hauled = ctx.hauled || {};
    var broke = ctx.broke || {};
    var marks = ctx.marks || [];
    var present = ctx.present || {};
    var at = ctx.at || { x: 0, y: 0 };
    if (tripOpen(level, work, done, ctx.tripCleared)) {
      job = jobById(jobs, "power");
      return { act: "trip", jobId: "power", tile: job.tile };
    }
    if (ctx.carry) {
      job = jobById(jobs, ctx.carry);
      if (job && !hauled[job.id]) return { act: "drop", jobId: job.id, tile: job.tile };
    }
    for (i = 0; i < jobs.length; i++) {
      job = jobs[i];
      if (!jobState(job, done).ready) continue;
      trades = requiredTrades(job);
      if (job.gate === "sign" && !signed[job.id] && (!trades.length || present[job.id])) {
        return { act: "sign", jobId: job.id, tile: job.tile };
      }
      if (job.gate === "clash" && !broke[job.id] && present[job.id]) {
        return { act: "clash", jobId: job.id, tile: job.tile };
      }
    }
    best = null;
    bestD = 999;
    for (i = 0; i < jobs.length; i++) {
      job = jobs[i];
      if (job.gate !== "haul" || hauled[job.id] || !job.pile) continue;
      if (!jobState(job, done).ready || !tradeWanted(jobs, done, marks, job)) continue;
      if (ctx.playerCarry === job.id) continue;
      dist = Math.abs(job.pile.x - at.x) + Math.abs(job.pile.y - at.y);
      if (dist < bestD) {
        bestD = dist;
        best = job;
      }
    }
    if (best) return { act: "take", jobId: best.id, tile: best.pile };
    best = null;
    bestD = 999;
    for (i = 0; i < jobs.length; i++) {
      job = jobs[i];
      if (marks.indexOf(job.id) !== -1) continue;
      if (!contested(jobs, done, job)) continue;
      dist = Math.abs(job.tile.x - at.x) + Math.abs(job.tile.y - at.y);
      if (dist < bestD) {
        bestD = dist;
        best = job;
      }
    }
    if (best) return { act: "mark", jobId: best.id, tile: best.tile };
    best = null;
    bestD = 999;
    for (i = 0; i < jobs.length; i++) {
      job = jobs[i];
      if (!requiredTrades(job).length) continue;
      if (!jobState(job, done).ready || !tradeWanted(jobs, done, marks, job)) continue;
      if (clockHeld(job, { signed: signed, hauled: hauled, broke: broke, trip: tripOpen(level, work, done, ctx.tripCleared) })) continue;
      dist = Math.abs(job.tile.x - at.x) + Math.abs(job.tile.y - at.y);
      if (dist < bestD) {
        bestD = dist;
        best = job;
      }
    }
    if (best) return { act: "boost", jobId: best.id, tile: best.tile };
    return null;
  }

  function jobState(job, done) {
    var unmet = [];
    var i;
    for (i = 0; i < job.needs.length; i++) {
      if (!done[job.needs[i]]) unmet.push(job.needs[i]);
    }
    var finished = !!done[job.id];
    return {
      done: finished,
      ready: !finished && unmet.length === 0,
      blocked: !finished && unmet.length > 0,
      unmet: unmet
    };
  }

  function needsHelp(job, done) {
    return !done[job.id];
  }

  function tryComplete(jobs, done, id) {
    var job = jobById(jobs, id);
    if (!job || !jobState(job, done).ready) return done;
    var next = {};
    var key;
    for (key in done) {
      if (Object.prototype.hasOwnProperty.call(done, key)) next[key] = done[key];
    }
    next[id] = true;
    return next;
  }

  function siteClear(jobs, done) {
    var i;
    for (i = 0; i < jobs.length; i++) {
      if (!done[jobs[i].id]) return false;
    }
    return true;
  }

  var JOB_SCALE = 20;
  var WEEK_MS = 7 * 24 * 60 * 60 * 1000;

  function crewRate(levelId) {
    var n = levelId | 0;
    var rate = 1;
    var i;
    if (n < 1) n = 1;
    if (n > 16) n = 16;
    for (i = 1; i < n; i++) rate *= 2;
    return rate;
  }

  function matRate(levelId, bot) {
    return crewRate(levelId) + (bot ? 1 : 0);
  }

  function addMats(state, ms) {
    var span = ms || 0;
    var whole;
    if (!(span > 0)) return state;
    if (!state.mats) state.mats = 0;
    if (!state.bank) state.bank = 0;
    state.bank += span * matRate(state.level, state.sub);
    whole = Math.floor(state.bank / 1000);
    if (whole > 0) {
      state.mats += whole;
      state.bank -= whole * 1000;
    }
    return state;
  }

  function ensureIdle(state) {
    if (!state.done || typeof state.done !== "object") state.done = {};
    if (!state.work || typeof state.work !== "object") state.work = {};
    if (!state.signed || typeof state.signed !== "object") state.signed = {};
    if (!state.hauled || typeof state.hauled !== "object") state.hauled = {};
    if (!state.broke || typeof state.broke !== "object") state.broke = {};
    if (!Array.isArray(state.marks)) state.marks = [];
    if (!state.level) state.level = 1;
    if (!state.mats) state.mats = 0;
    if (!state.bank) state.bank = 0;
  }

  function freshSite(state) {
    state.done = {};
    state.marks = [];
    state.signed = {};
    state.hauled = {};
    state.broke = {};
    state.trip = false;
    state.work = {};
  }

  function staffedHave(job) {
    var have = {};
    var trades = requiredTrades(job);
    var i;
    for (i = 0; i < trades.length; i++) have[trades[i]] = true;
    return have;
  }

  function clearGates(level, state) {
    var jobs = level.jobs;
    var i;
    var job;
    if (tripOpen(level, state.work, state.done, state.trip)) state.trip = true;
    for (i = 0; i < jobs.length; i++) {
      job = jobs[i];
      if (!jobState(job, state.done).ready) continue;
      if (job.gate === "sign") state.signed[job.id] = true;
      if (job.gate === "haul") state.hauled[job.id] = true;
      if (job.gate === "clash") state.broke[job.id] = true;
      if (job.gate === "sign" && !(job.ms > 0)) state.done = tryComplete(jobs, state.done, job.id);
    }
  }

  function soonWall(level, state) {
    var best = -1;
    var i;
    var job;
    var trades;
    var remain;
    var wall;
    for (i = 0; i < level.jobs.length; i++) {
      job = level.jobs[i];
      trades = requiredTrades(job);
      if (!trades.length || !(job.ms > 0) || !jobState(job, state.done).ready) continue;
      remain = job.ms - (state.work[job.id] || 0);
      if (remain < 0) remain = 0;
      wall = remain * JOB_SCALE;
      if (best < 0 || wall < best) best = wall;
    }
    return best;
  }

  function advanceReady(level, state, wallMs) {
    var jobs = level.jobs;
    var readyIds = {};
    var jobDt = wallMs / JOB_SCALE;
    var i;
    var job;
    var trades;
    var step;
    for (i = 0; i < jobs.length; i++) {
      job = jobs[i];
      trades = requiredTrades(job);
      if (!trades.length || !(job.ms > 0) || !jobState(job, state.done).ready) continue;
      readyIds[job.id] = true;
    }
    for (i = 0; i < jobs.length; i++) {
      job = jobs[i];
      if (!readyIds[job.id]) continue;
      step = advanceWork(job, staffedHave(job), state.work[job.id] || 0, jobDt, false);
      if (step.done) {
        state.done = tryComplete(jobs, state.done, job.id);
        state.work[job.id] = 0;
      } else if (step.elapsed > 0) {
        state.work[job.id] = step.elapsed;
      }
    }
  }

  function catchup(levels, state, ms) {
    var left = ms || 0;
    var guard = 0;
    var level;
    var best;
    var slice;
    ensureIdle(state);
    if (left < 0) left = 0;
    if (left > WEEK_MS) left = WEEK_MS;
    while (left > 0 && guard < 10000) {
      guard += 1;
      level = levels[(state.level | 0) - 1];
      if (!level) break;
      clearGates(level, state);
      if (siteClear(level.jobs, state.done)) {
        if ((state.level | 0) >= levels.length) {
          addMats(state, left);
          left = 0;
          break;
        }
        state.level = (state.level | 0) + 1;
        freshSite(state);
        continue;
      }
      best = soonWall(level, state);
      if (!(best > 0)) {
        if (best === 0) {
          advanceReady(level, state, 0);
          continue;
        }
        break;
      }
      slice = left < best ? left : best;
      addMats(state, slice);
      advanceReady(level, state, slice);
      left -= slice;
    }
    if (left > 0) addMats(state, left);
    return state;
  }

  function blockText(jobs, job, done) {
    var state = jobState(job, done);
    if (state.done) return job.set;
    if (state.ready) return job.fix;
    var needed = jobById(jobs, state.unmet[0]);
    return needed ? needed.hold : "NEED HELP";
  }

  return {
    ROSTER_CAP: ROSTER_CAP,
    sha256Hex: sha256Hex,
    workerFromText: workerFromText,
    toSave: toSave,
    hireState: hireState,
    addMember: addMember,
    fight: fight,
    rivalLineup: rivalLineup,
    cardId: cardId,
    levels: LEVELS,
    HUD_LINES: HUD_LINES,
    fontSafe: fontSafe,
    crewMember: crewMember,
    jobState: jobState,
    requiredTrades: requiredTrades,
    taskStaffed: taskStaffed,
    tasksForTrade: tasksForTrade,
    contested: contested,
    assignedForTrade: assignedForTrade,
    tradeWanted: tradeWanted,
    clockHeld: clockHeld,
    tripOpen: tripOpen,
    advanceWork: advanceWork,
    subIntent: subIntent,
    needsHelp: needsHelp,
    tryComplete: tryComplete,
    siteClear: siteClear,
    blockText: blockText,
    JOB_SCALE: JOB_SCALE,
    crewRate: crewRate,
    matRate: matRate,
    addMats: addMats,
    catchup: catchup
  };
});
