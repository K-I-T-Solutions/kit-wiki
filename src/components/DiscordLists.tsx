import React from "react";
import data from "../data/discord/discord_export.json";

type Channel = {
  id: string | number;
  name: string;
  type: string | number;
  parent_id?: string | number | null;
  position?: number | null;
  topic?: string | null;
};

type Role = {
  id: string | number;
  name: string;
  position: number;
  managed?: boolean;
  hoist?: boolean;
  mentionable?: boolean;
};

function typeStr(t: Channel["type"]) {
  return (typeof t === "string" ? t.toLowerCase() : String(t));
}
function isCategory(c: Channel) {
  const t = typeStr(c.type);
  return t === "category" || t.includes("category") || t === "4";
}
function byPosThenName(a: Channel, b: Channel) {
  return (a.position ?? 0) - (b.position ?? 0) || String(a.name).localeCompare(String(b.name));
}
function typeLabel(t: Channel["type"]) {
  return typeStr(t).replace(/^guild_/, "").replace(/_/g, " ");
}

export default function DiscordLists() {
  const channels = (data as any).channels as Channel[];
  const roles = (data as any).roles as Role[];

  const categories = channels.filter(isCategory).sort(byPosThenName);
  const childrenOf = (pid: Channel["parent_id"]) =>
    channels.filter((ch) => (ch.parent_id ?? null) === pid && !isCategory(ch)).sort(byPosThenName);
  const uncategorized = channels
    .filter((ch) => ch.parent_id == null && !isCategory(ch))
    .sort(byPosThenName);

  return (
    <div className="not-prose">
      <h2 className="text-xl font-semibold mb-2">Rollen (Top → Bottom)</h2>
      <ul className="mb-6">
        {[...roles]
          .sort((a, b) => b.position - a.position)
          .map((r) => (
            <li key={r.id}>
              <strong>{r.name}</strong> (pos {r.position})
              {r.managed ? " 🛠" : ""}{r.hoist ? " 📌" : ""}{r.mentionable ? " 🔔" : ""}
            </li>
          ))}
      </ul>

      <h2 className="text-xl font-semibold mb-2">Kanäle nach Kategorie</h2>
      {categories.map((cat) => (
        <div key={cat.id} className="mb-4">
          <h3 className="font-medium">{cat.name}</h3>
          <ul className="ml-4 list-disc">
            {childrenOf(cat.id).map((ch) => (
              <li key={ch.id}>
                #{ch.name} <em>({typeLabel(ch.type)})</em>
                {ch.topic ? ` — ${ch.topic}` : ""}
              </li>
            ))}
          </ul>
        </div>
      ))}

      <h2 className="text-xl font-semibold mb-2">Kanäle ohne Kategorie</h2>
      <ul className="ml-4 list-disc">
        {uncategorized.map((ch) => (
          <li key={ch.id}>
            #{ch.name} <em>({typeLabel(ch.type)})</em>
            {ch.topic ? ` — ${ch.topic}` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}
