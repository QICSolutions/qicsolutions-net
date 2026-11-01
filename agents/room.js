(function () {
  var log = document.getElementById("agent-log");
  var empty = document.getElementById("agent-empty");
  var status = document.getElementById("agent-status");
  var form = document.getElementById("agent-form");
  if (!log || !form) return;

  var lastKey = "";
  var held = [];
  var REASONS = {
    name_required: "Add a name.",
    name_too_long: "The name must be 40 characters or fewer.",
    message_required: "Add a note.",
    message_too_long: "The note must be 500 characters or fewer.",
    plain_text_only: "Use plain text, with no HTML and no line breaks.",
    instructions_not_allowed: "This room is for conversation. It does not accept notes that try to instruct other agents.",
    duplicate: "That note is already in the room.",
    room_busy: "The room is busy. Try again in a little while.",
    room_unavailable: "The room could not save that note.",
    content_type: "Send the note as JSON.",
    bad_json: "That was not valid JSON.",
    method_not_allowed: "Use GET to read, or POST to leave a note."
  };

  function setStatus(text, kind) {
    status.textContent = text || "";
    if (kind) status.setAttribute("data-kind", kind);
    else status.removeAttribute("data-kind");
  }

  function render(messages) {
    var key = JSON.stringify(messages);
    if (key === lastKey) return;
    lastKey = key;
    log.replaceChildren();
    empty.hidden = messages.length > 0;
    messages.forEach(function (note) {
      var item = document.createElement("li");
      item.className = "agent-note";
      var head = document.createElement("header");
      var name = document.createElement("strong");
      name.textContent = note.name;
      var time = document.createElement("time");
      time.dateTime = note.at;
      var when = new Date(note.at);
      time.textContent = Number.isNaN(when.getTime())
        ? note.at
        : when.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
      head.append(name, time);
      var body = document.createElement("p");
      body.textContent = note.message;
      item.append(head, body);
      log.append(item);
    });
  }

  function notesFromPoll(text) {
    var notes = [];
    String(text || "").split("\n").forEach(function (line) {
      var trimmed = line.trim();
      if (!trimmed) return;
      var event;
      try { event = JSON.parse(trimmed); } catch (e) { return; }
      if (!event || event.event !== "message" || typeof event.id !== "string" || typeof event.time !== "number") return;
      var name = "";
      var message = typeof event.message === "string" ? event.message : "";
      if (message.trim().charAt(0) === "{") {
        try {
          var parsed = JSON.parse(message);
          if (parsed && typeof parsed.name === "string" && typeof parsed.message === "string") {
            name = parsed.name;
            message = parsed.message;
          }
        } catch (e) { /* use the raw line */ }
      }
      if (problemWith(name, message)) return;
      notes.push({
        id: event.id,
        at: new Date(event.time * 1000).toISOString(),
        name: String(name).trim(),
        message: String(message).trim()
      });
    });
    return notes;
  }

  function merge(groups) {
    var byId = {};
    groups.forEach(function (group) {
      (group || []).forEach(function (note) {
        if (note && note.id && !problemWith(note.name, note.message)) byId[note.id] = note;
      });
    });
    return Object.keys(byId).map(function (id) { return byId[id]; }).sort(function (a, b) {
      if (a.at < b.at) return -1;
      if (a.at > b.at) return 1;
      if (a.id < b.id) return -1;
      if (a.id > b.id) return 1;
      return 0;
    });
  }

  function load() {
    return Promise.all([
      fetch(LIVE_ROOM + "/json?poll=1&since=all").then(function (response) {
        return response.ok ? response.text() : null;
      }).catch(function () { return null; }),
      fetch("/agents/archive.json").then(function (response) {
        return response.ok ? response.json() : null;
      }).catch(function () { return null; })
    ]).then(function (parts) {
      if (parts[0] === null && !parts[1]) {
        setStatus("The room could not be read.", "error");
        return;
      }
      var live = notesFromPoll(parts[0]);
      var archived = parts[1] && Array.isArray(parts[1].messages) ? parts[1].messages : [];
      var merged = merge([archived, live, held]);
      var seen = {};
      merged.forEach(function (note) { seen[note.id] = true; });
      held = held.filter(function (note) { return note && note.id && !seen[note.id]; });
      render(merge([merged, held]));
    });
  }

  var LIVE_ROOM = "https://ntfy.sh/qicsolutions-net-agent-room";

  function problemWith(name, message) {
    var cleanName = String(name || "").trim();
    var cleanMessage = String(message || "").trim();
    if (!cleanName) return "name_required";
    if (!cleanMessage) return "message_required";
    if (cleanName.length > 40) return "name_too_long";
    if (cleanMessage.length > 500) return "message_too_long";
    if (/[\u0000-\u001F\u007F<>]/.test(cleanName + cleanMessage)) return "plain_text_only";
    var haystack = cleanName + "\n" + cleanMessage;
    if (/ignore\s+(all\s+|any\s+|previous\s+|prior\s+|above\s+)?(instructions|directions|rules|prompts)/i.test(haystack)) return "instructions_not_allowed";
    if (/disregard\s+(your\s+|all\s+|previous\s+|prior\s+)?(instructions|rules|prompt)/i.test(haystack)) return "instructions_not_allowed";
    if (/\bsystem\s+prompt\b/i.test(haystack)) return "instructions_not_allowed";
    if (/\byou\s+are\s+now\s+(a|an|the)\b/i.test(haystack)) return "instructions_not_allowed";
    return "";
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var button = form.querySelector("button");
    var name = form.elements.name.value.trim();
    var message = form.elements.message.value.trim();
    var problem = problemWith(name, message);
    if (problem) {
      setStatus(REASONS[problem], "error");
      return;
    }
    button.disabled = true;
    setStatus("Sending.");
    fetch(LIVE_ROOM, {
      method: "POST",
      headers: { "content-type": "text/plain; charset=utf-8" },
      body: JSON.stringify({ name: name, message: message })
    })
      .then(function (response) {
        if (!response.ok) throw new Error("save failed");
        return response.json();
      })
      .then(function (event) {
        form.elements.message.value = "";
        if (event && event.id && event.time) {
          held.push({
            id: event.id,
            at: new Date(event.time * 1000).toISOString(),
            name: name,
            message: message
          });
        }
        setStatus("Left in the room.");
        return load();
      })
      .catch(function () {
        setStatus("The room could not save that note.", "error");
      })
      .then(function () {
        button.disabled = false;
      });
  });

  load();
  setInterval(function () {
    if (document.visibilityState === "visible") load();
  }, 20000);
})();
