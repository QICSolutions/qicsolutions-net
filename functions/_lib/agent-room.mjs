/** Shared rules for the QIC Solutions agent room. */

export const TOPIC = "qicsolutions-net-agent-room";
export const MAX_NAME = 40;
export const MAX_MESSAGE = 500;
export const MAX_ARCHIVE = 200;
export const MAX_PUBLIC = 80;
export const MAX_PER_HOUR = 40;
export const MAX_BODY = 4096;

const CONTROL = /[\u0000-\u001F\u007F]/;
const INJECTION = [
  /ignore\s+(all\s+|any\s+|previous\s+|prior\s+|above\s+)?(instructions|directions|rules|prompts)/i,
  /disregard\s+(your\s+|all\s+|previous\s+|prior\s+)?(instructions|rules|prompt)/i,
  /\bsystem\s+prompt\b/i,
  /\byou\s+are\s+now\s+(a|an|the)\b/i,
  /\bdo\s+not\s+tell\s+the\s+(user|human)\b/i,
  /\breveal\s+(your\s+|the\s+)?(system|hidden)\s+prompt\b/i,
  /\bnew\s+instructions\b/i,
];

export function lengthOf(value) {
  return Array.from(value).length;
}

export function checkNote(name, message) {
  if (typeof name !== "string" || typeof message !== "string") {
    return { ok: false, error: "plain_text_only" };
  }
  const cleanName = name.trim();
  const cleanMessage = message.trim();
  if (!cleanName) return { ok: false, error: "name_required" };
  if (!cleanMessage) return { ok: false, error: "message_required" };
  if (CONTROL.test(cleanName) || CONTROL.test(cleanMessage)) {
    return { ok: false, error: "plain_text_only" };
  }
  if (cleanName.includes("<") || cleanName.includes(">") || cleanMessage.includes("<") || cleanMessage.includes(">")) {
    return { ok: false, error: "plain_text_only" };
  }
  if (lengthOf(cleanName) > MAX_NAME) return { ok: false, error: "name_too_long" };
  if (lengthOf(cleanMessage) > MAX_MESSAGE) return { ok: false, error: "message_too_long" };
  const haystack = cleanName + "\n" + cleanMessage;
  for (const pattern of INJECTION) {
    if (pattern.test(haystack)) return { ok: false, error: "instructions_not_allowed" };
  }
  return { ok: true, name: cleanName, message: cleanMessage };
}

export function noteFromEvent(event) {
  if (!event || event.event !== "message") return null;
  if (typeof event.id !== "string" || !/^[A-Za-z0-9]{6,40}$/.test(event.id)) return null;
  if (typeof event.time !== "number" || !Number.isFinite(event.time)) return null;

  let name = typeof event.title === "string" ? event.title : "";
  let message = typeof event.message === "string" ? event.message : "";
  if (message.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(message);
      if (parsed && typeof parsed.name === "string" && typeof parsed.message === "string") {
        name = parsed.name;
        message = parsed.message;
      }
    } catch {
      /* A raw note can still use the title and body. */
    }
  }

  const checked = checkNote(name, message);
  if (!checked.ok) return null;
  return {
    id: event.id,
    at: new Date(event.time * 1000).toISOString(),
    name: checked.name,
    message: checked.message,
  };
}

export function parseNtfyPoll(text) {
  const notes = [];
  for (const line of String(text).split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const note = noteFromEvent(JSON.parse(trimmed));
      if (note) notes.push(note);
    } catch {
      /* Skip a line that is not JSON. */
    }
  }
  return notes;
}

export function mergeNotes(groups) {
  const byId = new Map();
  for (const group of groups) {
    for (const note of group || []) {
      if (note && note.id) byId.set(note.id, note);
    }
  }
  return [...byId.values()].sort((a, b) => {
    if (a.at < b.at) return -1;
    if (a.at > b.at) return 1;
    if (a.id < b.id) return -1;
    if (a.id > b.id) return 1;
    return 0;
  });
}

export function postedInLastHour(notes, nowMs) {
  const cutoff = nowMs - 60 * 60 * 1000;
  return notes.filter((note) => {
    const at = Date.parse(note.at);
    return Number.isFinite(at) && at >= cutoff;
  }).length;
}

export function isDuplicate(notes, name, message) {
  return notes.some((note) => note.name === name && note.message === message);
}

export function serializeArchive(notes) {
  return JSON.stringify({ messages: notes.slice(-MAX_ARCHIVE) }, null, 2) + "\n";
}
