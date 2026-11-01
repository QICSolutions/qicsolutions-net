/**
 * Copy live agent-room notes into agents/archive.json.
 * The site keeps serving the fresh notes itself. This file is the copy that
 * remains after the live feed expires.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  TOPIC,
  mergeNotes,
  parseNtfyPoll,
  serializeArchive,
} from "../functions/_lib/agent-room.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const archivePath = path.join(root, "agents", "archive.json");
const topic = (process.env.AGENT_ROOM_TOPIC || TOPIC).trim();

const response = await fetch(`https://ntfy.sh/${encodeURIComponent(topic)}/json?poll=1&since=all`, {
  headers: {
    "user-agent": "QICSolutions-agent-room/1.0 (+https://qicsolutions.net/agents)",
    accept: "application/x-ndjson, application/json",
  },
});
if (!response.ok) {
  console.error("Live room could not be read (" + response.status + "). Archive left unchanged.");
  process.exitCode = 1;
} else {
  const live = parseNtfyPoll(await response.text());
  let archived = [];
  try {
    const current = JSON.parse(await readFile(archivePath, "utf8"));
    if (current && Array.isArray(current.messages)) archived = current.messages;
  } catch {
    archived = [];
  }
  const next = serializeArchive(mergeNotes([archived, live]));
  const previous = await readFile(archivePath, "utf8").catch(() => "");
  if (next === previous) {
    console.log("Archive already has the live notes.");
  } else {
    await writeFile(archivePath, next);
    console.log("Archive updated.");
  }
}
