import { Client, GatewayIntentBits, ChannelType } from "discord.js";
import { writeFileSync, mkdirSync } from "node:fs";

const OUT_DIR = "out";
mkdirSync(OUT_DIR, { recursive: true });

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const HUMAN_FLAGS = [
  "ViewChannel","SendMessages","SendMessagesInThreads","CreatePublicThreads","CreatePrivateThreads",
  "ManageMessages","AttachFiles","EmbedLinks","UseExternalEmojis","AddReactions",
  "MentionEveryone","ManageChannels","ManageRoles","ManageWebhooks",
  "Connect","Speak","Stream","UseVAD","MuteMembers"
];
function pickFlags(perm){ const out={}; for(const f of HUMAN_FLAGS) out[f]=perm.has(f); return out }

client.once("ready", async () => {
  const guild = await client.guilds.fetch(process.env.GUILD_ID);
  const fullGuild = await guild.fetch();

  // Rollen
  const rolesCol = await guild.roles.fetch();
  const roles = [...rolesCol.values()]
    .map(r => ({
      id:r.id, name:r.name, position:r.position, managed:r.managed,
      color:r.color, mentionable:r.mentionable, hoist:r.hoist,
      permissions_bits:r.permissions.bitfield.toString(),
      permissions_common: pickFlags(r.permissions)
    }))
    .sort((a,b)=>b.position-a.position);

  // Emojis/Stickers
  const emojis = fullGuild.emojis.cache.map(e=>({id:e.id,name:e.name,animated:e.animated,available:e.available}));
  const stickers = fullGuild.stickers.cache.map(s=>({id:s.id,name:s.name,format:String(s.format)}));

  // Webhooks
  let webhooks=[]; try {
    const all=await guild.fetchWebhooks();
    webhooks=[...all.values()].map(w=>({id:w.id,name:w.name,channel_id:w.channelId,type:String(w.type),application_id:w.applicationId}));
  } catch {}

  // Slash-Commands (Guild-scope eures Bots)
  let appCmds=[]; try {
    const cmds=await guild.commands.fetch();
    appCmds=[...cmds.values()].map(c=>({id:c.id,name:c.name,type:String(c.type),description:c.description}));
  } catch {}

  // Kanäle
  const chCol = await guild.channels.fetch();
  const channels=[];
  for (const ch of chCol.values()) {
    if (!ch) continue;
    const base = {
      id: ch.id,
      name: ch.name,
      type: Object.keys(ChannelType).find(k => ChannelType[k] === ch.type)?.toLowerCase() ?? String(ch.type),
      parent_id: ch.parentId ?? null,
      position: ch.rawPosition ?? null,
      topic: "topic" in ch ? ch.topic : null,
      nsfw: "nsfw" in ch ? ch.nsfw : null,
      rate_limit_per_user: "rateLimitPerUser" in ch ? ch.rateLimitPerUser : null,
    };
    if ("bitrate" in ch) base.bitrate = ch.bitrate;
    if ("userLimit" in ch) base.user_limit = ch.userLimit;
    if ("rtcRegion" in ch) base.rtc_region = ch.rtcRegion;
    if ("availableTags" in ch && ch.availableTags?.length) {
      base.forum_tags = ch.availableTags.map(t=>({id:t.id,name:t.name,emoji:t.emoji?.name ?? null}));
    }
    const overwrites=[];
    (ch.permissionOverwrites?.cache ?? []).forEach(ow=>{
      const allow=ow.allow, deny=ow.deny;
      overwrites.push({
        target_type: ow.type, target_id: ow.id,
        allow_bits: allow.bitfield.toString(), deny_bits: deny.bitfield.toString(),
        allow_common: pickFlags({has:(f)=>allow.has(f)}),
        deny_common:  pickFlags({has:(f)=>deny.has(f)}),
      });
    });
    base.permissions = {
      overwrites: overwrites.sort((a,b)=>String(a.target_type).localeCompare(String(b.target_type))),
      everyone_base: pickFlags(fullGuild.roles.everyone.permissions),
    };
    channels.push(base);
  }
  channels.sort((a,b)=> ((a.parent_id||"")+a.position) > ((b.parent_id||"")+b.position) ? 1 : -1);

  const sys = {
    afk_channel_id: fullGuild.afkChannelId ?? null,
    afk_timeout: fullGuild.afkTimeout,
    system_channel_id: fullGuild.systemChannelId ?? null,
    rules_channel_id: fullGuild.rulesChannelId ?? null,
    public_updates_channel_id: fullGuild.publicUpdatesChannelId ?? null,
    description: fullGuild.description ?? null,
    verification_level: String(fullGuild.verificationLevel),
    nsfw_level: String(fullGuild.nsfwLevel),
    mfa_level: String(fullGuild.mfaLevel),
    premium_tier: String(fullGuild.premiumTier),
    premium_subscription_count: fullGuild.premiumSubscriptionCount ?? null,
    features: fullGuild.features,
  };

  const exportObj = {
    generated_at: new Date().toISOString(),
    guild: {
      id: fullGuild.id, name: fullGuild.name, icon: fullGuild.iconURL({ size: 128 }),
      approximate_counts_note: "Keine Memberliste exportiert; Fokus auf Struktur & Features.",
      ...sys
    },
    counts: {
      roles: roles.length, channels_total: channels.length,
      emojis: emojis.length, stickers: stickers.length,
      webhooks: webhooks.length, app_commands: appCmds.length
    },
    roles, channels, emojis, stickers, webhooks, application_commands: appCmds
  };

  writeFileSync(`${OUT_DIR}/discord_export.json`, JSON.stringify(exportObj, null, 2));

  // Markdown
  const L=[];
  L.push(`# Discord Report – ${fullGuild.name}`);
  L.push(`- Generiert: ${exportObj.generated_at}`);
  L.push(`- Rollen: ${roles.length} | Kanäle: ${channels.length} | Emojis: ${emojis.length} | Sticker: ${stickers.length}`);
  L.push(`- Premium: ${sys.premium_tier} (Boosts: ${sys.premium_subscription_count})`);
  L.push(`- Verification: ${sys.verification_level} | NSFW: ${sys.nsfw_level} | MFA: ${sys.mfa_level}\n`);
  if (sys.features?.length) L.push(`**Features:** ${sys.features.join(", ")}\n`);

  L.push(`## Kanäle nach Kategorie\n`);
  const byParent=new Map();
  for(const ch of channels){ const k=ch.parent_id??"__root__"; if(!byParent.has(k)) byParent.set(k,[]); byParent.get(k).push(ch); }
  const categories=channels.filter(c=>c.type==="category").sort((a,b)=>(a.position??0)-(b.position??0));
  const renderCh=c=>`- \`#${c.name}\` (_${c.type}_)`+(c.topic?` — ${c.topic}`:"");
  for(const cat of categories){ L.push(`### ${cat.name}`); for(const c of (byParent.get(cat.id)??[])){ if(c.id!==cat.id) L.push(renderCh(c)); } L.push(""); }
  if(byParent.get("__root__")?.length){ L.push(`### Ohne Kategorie`); for(const c of byParent.get("__root__")) L.push(renderCh(c)); L.push(""); }

  L.push("## Rollen (Top → Bottom)\n");
  for (const r of roles){ const f=[]; if(r.managed)f.push("managed"); if(r.hoist)f.push("hoist"); if(r.mentionable)f.push("mentionable");
    L.push(`- **${r.name}** (pos ${r.position})${f.length?` _(${f.join(", ")})_`:""}`); }
  L.push("");

  if (webhooks.length){ L.push("## Webhooks"); for(const w of webhooks) L.push(`- ${w.name} (Channel: \`${w.channel_id}\`)`); L.push(""); }
  if (exportObj.application_commands.length){ L.push("## Slash-Commands (Guild)"); for(const c of exportObj.application_commands) L.push(`- \`/${c.name}\` — ${c.description}`); L.push(""); }

  L.push("## Berechtigungen (kompakt)\n");
  for (const ch of channels) {
    if (!ch.permissions?.overwrites?.length) continue;
    L.push(`### #${ch.name} (${ch.type})`);
    L.push(`_@everyone Basis:_ \`${JSON.stringify(ch.permissions.everyone_base)}\``);
    L.push("**Overwrites:**");
    for (const ow of ch.permissions.overwrites) {
      const allow=Object.entries(ow.allow_common).filter(([,v])=>v).map(([k])=>k).slice(0,8);
      const deny =Object.entries(ow.deny_common ).filter(([,v])=>v).map(([k])=>k).slice(0,8);
      L.push(`- **${ow.target_type}:${ow.target_id}** allow: ${allow.join(", ")||"-"} | deny: ${deny.join(", ")||"-"}`);
    }
    L.push("");
  }
  writeFileSync(`${OUT_DIR}/discord_report.md`, L.join("\n"));
  console.log("✅ Export fertig: out/discord_export.json & out/discord_report.md");
  process.exit(0);
});
client.login(process.env.DISCORD_TOKEN);
