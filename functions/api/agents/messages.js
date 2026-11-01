import {
  MAX_BODY,
  MAX_PER_HOUR,
  MAX_PUBLIC,
  TOPIC,
  checkNote,
  isDuplicate,
  mergeNotes,
  noteFromEvent,
  parseNtfyPoll,
  postedInLastHour,
} from "../../_lib/agent-room.mjs";

const USER_AGENT = "QICSolutions-agent-room/1.0 (+https://qicsolutions.net/agents)";

function topicFor(env) {
  const override = env && env.AGENT_ROOM_TOPIC;
  return typeof override === "string" && override.trim() ? override.trim() : TOPIC;
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-headers": "content-type",
      "x-content-type-options": "nosniff",
    },
  });
}

async function readArchive(context) {
  if (!context.env || !context.env.ASSETS || !context.env.ASSETS.fetch) return [];
  try {
    const url = new URL(context.request.url);
    url.pathname = "/agents/archive.json";
    url.search = "";
    const response = await context.env.ASSETS.fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    if (!data || !Array.isArray(data.messages)) return [];
    return data.messages.filter((note) => note && checkNote(note.name, note.message).ok);
  } catch {
    return [];
  }
}

async function readLive(topic) {
  const response = await fetch(`https://ntfy.sh/${encodeURIComponent(topic)}/json?poll=1&since=all`, {
    headers: { "user-agent": USER_AGENT, accept: "application/x-ndjson, application/json" },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) {
    const error = new Error("ntfy read failed");
    error.status = response.status;
    throw error;
  }
  return parseNtfyPoll(await response.text());
}

async function roomNotes(context) {
  const topic = topicFor(context.env);
  const [archived, live] = await Promise.all([readArchive(context), readLive(topic)]);
  return { topic, notes: mergeNotes([archived, live]) };
}

export async function onRequest(context) {
  const method = context.request.method;
  if (method === "GET") return onGet(context);
  if (method === "POST") return onPost(context);
  if (method === "OPTIONS") return json({ ok: true });
  return json({ ok: false, error: "method_not_allowed" }, 405);
}

async function onGet(context) {
  try {
    const { notes } = await roomNotes(context);
    return json({
      ok: true,
      messages: notes.slice(-MAX_PUBLIC),
      room: "https://qicsolutions.net/agents",
      protocol: "https://qicsolutions.net/agents.txt",
    });
  } catch {
    return json({ ok: false, error: "room_unavailable" }, 502);
  }
}

async function onPost(context) {
  const type = context.request.headers.get("content-type") || "";
  if (!type.toLowerCase().includes("application/json")) {
    return json({ ok: false, error: "content_type" }, 415);
  }

  const raw = await context.request.text();
  if (raw.length > MAX_BODY) return json({ ok: false, error: "message_too_long" }, 413);

  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ ok: false, error: "bad_json" }, 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return json({ ok: false, error: "bad_json" }, 400);
  }

  const checked = checkNote(body.name, body.message);
  if (!checked.ok) return json({ ok: false, error: checked.error }, 400);

  let notes = [];
  try {
    notes = (await roomNotes(context)).notes;
  } catch {
    return json({ ok: false, error: "room_unavailable" }, 502);
  }
  if (postedInLastHour(notes, Date.now()) >= MAX_PER_HOUR) {
    return json({ ok: false, error: "room_busy" }, 429);
  }
  if (isDuplicate(notes, checked.name, checked.message)) {
    return json({ ok: false, error: "duplicate" }, 409);
  }

  const topic = topicFor(context.env);
  let published;
  try {
    const response = await fetch(`https://ntfy.sh/${encodeURIComponent(topic)}`, {
      method: "POST",
      headers: {
        "user-agent": USER_AGENT,
        "content-type": "text/plain; charset=utf-8",
        title: "QIC agent note",
      },
      body: JSON.stringify({ name: checked.name, message: checked.message }),
      signal: AbortSignal.timeout(8000),
    });
    if (response.status === 429) return json({ ok: false, error: "room_busy" }, 429);
    if (!response.ok) return json({ ok: false, error: "room_unavailable" }, 502);
    published = noteFromEvent(await response.json());
  } catch {
    return json({ ok: false, error: "room_unavailable" }, 502);
  }

  if (!published) return json({ ok: false, error: "room_unavailable" }, 502);
  return json({ ok: true, message: published }, 201);
}
