import os, json, asyncio, datetime, pathlib
import discord

TOKEN   = os.environ["DISCORD_TOKEN"]
GUILD_ID = int(os.environ["GUILD_ID"])
OUT_DIR = pathlib.Path("out"); OUT_DIR.mkdir(exist_ok=True)

intents = discord.Intents.none(); intents.guilds = True
client = discord.Client(intents=intents)

HUMAN_FLAGS = ["view_channel","send_messages","send_messages_in_threads","create_public_threads","create_private_threads",
               "manage_messages","attach_files","embed_links","use_external_emojis","add_reactions","mention_everyone",
               "manage_channels","manage_roles","manage_webhooks","connect","speak","stream","use_voice_activation","mute_members"]

def summarize_permissions(p): return {f:getattr(p,f) for f in HUMAN_FLAGS}

def channel_core(ch):
    base={"id":ch.id,"name":getattr(ch,"name",None),"type":str(ch.type),
          "parent_id":getattr(ch,"category_id",None),"position":getattr(ch,"position",None),
          "topic":getattr(ch,"topic",None),"nsfw":getattr(ch,"nsfw",None),
          "rate_limit_per_user":getattr(ch,"slowmode_delay",None)}
    for a in ("bitrate","user_limit","rtc_region"):
        if hasattr(ch,a): base[a]=getattr(ch,a)
    if hasattr(ch,"available_tags") and ch.available_tags:
        base["forum_tags"]=[{"id":t.id,"name":t.name,"emoji":getattr(t.emoji,"name",None)} for t in ch.available_tags]
    return base

def overwrites_matrix(ch,guild):
    rows=[]
    for target, ow in ch.overwrites.items():
        a,d = ow.pair()
        rows.append({
            "target_type": "role" if isinstance(target, discord.Role) else "member",
            "target_name": getattr(target,"name",str(target)),
            "target_id": target.id,
            "allow_bits": a.value, "deny_bits": d.value,
            "allow_common": summarize_permissions(a), "deny_common": summarize_permissions(d),
        })
    rows.sort(key=lambda r:(r["target_type"], r["target_name"].lower()))
    return {"overwrites":rows, "everyone_base": summarize_permissions(guild.default_role.permissions)}

async def collect_webhooks(guild: discord.Guild):
    try:
        hooks = await guild.webhooks()
    except discord.Forbidden:
        return []
    return [{"id":h.id,"name":h.name,"channel_id":getattr(h.channel,"id",None),"type":str(h.type),"application_id":h.application_id} for h in hooks]

@client.event
async def on_ready():
    try:
        guild = client.get_guild(GUILD_ID) or await client.fetch_guild(GUILD_ID)
        features = list(getattr(guild,"features",[]))
        roles = await guild.fetch_roles()
        roles_out=[{"id":r.id,"name":r.name,"position":r.position,"managed":r.managed,"color":r.color.value,
                    "mentionable":r.mentionable,"hoist":r.hoist,"permissions_bits":r.permissions.value,
                    "permissions_common": summarize_permissions(r.permissions)} for r in sorted(roles,key=lambda x:x.position,reverse=True)]
        emojis=[{"id":e.id,"name":e.name,"animated":e.animated,"available":e.available} for e in guild.emojis]
        stickers=[{"id":s.id,"name":s.name,"format":str(s.format)} for s in getattr(guild,"stickers",[])]
        channels = await guild.fetch_channels()
        channels_out=[]
        for ch in channels:
            row = channel_core(ch)
            row["permissions"]=overwrites_matrix(ch,guild)
            channels_out.append(row)
        channels_out.sort(key=lambda c: (c["parent_id"] or 0, c["position"] or 0, (c["name"] or "").lower()))

        sys={"afk_channel_id":getattr(guild.afk_channel,"id",None),"afk_timeout":guild.afk_timeout,
             "system_channel_id":getattr(guild.system_channel,"id",None),"rules_channel_id":getattr(guild.rules_channel,"id",None),
             "public_updates_channel_id":getattr(guild.public_updates_channel,"id",None),
             "description":guild.description,"verification_level":str(guild.verification_level),
             "nsfw_level":str(guild.nsfw_level),"mfa_level":str(guild.mfa_level),
             "premium_tier":str(getattr(guild,"premium_tier",None)),
             "premium_subscription_count":getattr(guild,"premium_subscription_count",None),
             "features":features}

        webhooks = await collect_webhooks(guild)

        export={"generated_at": datetime.datetime.utcnow().isoformat()+"Z",
                "guild":{"id":guild.id,"name":guild.name,"icon": (guild.icon.url if guild.icon else None),
                         "approximate_counts_note":"Keine Memberliste exportiert; Fokus auf Struktur & Features.", **sys},
                "counts":{"roles":len(roles_out),"channels_total":len(channels_out),"emojis":len(emojis),
                          "stickers":len(stickers),"webhooks":len(webhooks),"app_commands":0},
                "roles":roles_out,"channels":channels_out,"emojis":emojis,"stickers":stickers,"webhooks":webhooks,"application_commands":[]}

        (OUT_DIR/"discord_export.json").write_text(json.dumps(export,ensure_ascii=False,indent=2),encoding="utf-8")

        md=[]
        md.append(f"# Discord Report – {guild.name}\n")
        md.append(f"- Generiert: {export['generated_at']}")
        md.append(f"- Rollen: {export['counts']['roles']} | Kanäle: {export['counts']['channels_total']} | Emojis: {export['counts']['emojis']} | Sticker: {export['counts']['stickers']}")
        md.append(f"- Premium: {sys['premium_tier']} (Boosts: {sys['premium_subscription_count']})")
        md.append(f"- Verification: {sys['verification_level']} | NSFW: {sys['nsfw_level']} | MFA: {sys['mfa_level']}\n")
        if features: md.append("**Features:** " + ", ".join(features) + "\n")

        md.append("## Kanäle nach Kategorie\n")
        by_parent={}
        for ch in export["channels"]: by_parent.setdefault(ch["parent_id"],[]).append(ch)
        categories=[c for c in export["channels"] if c["type"]=="category"]; categories.sort(key=lambda c:c["position"] or 0)
        def render_line(c): return f"- `#{c['name']}` (_{c['type']}_)"+(f" — {c['topic']}" if c.get("topic") else "")
        for cat in categories:
            md.append(f"### {cat['name']}")
            for c in by_parent.get(cat["id"],[]): 
                if c["id"]==cat["id"]: continue
                md.append(render_line(c))
            md.append("")
        if by_parent.get(None):
            md.append("### Ohne Kategorie")
            for c in by_parent[None]: md.append(render_line(c))
            md.append("")

        md.append("## Rollen (Top → Bottom)\n")
        for r in roles_out:
            flags=[]; 
            if r["managed"]: flags.append("managed")
            if r["hoist"]: flags.append("hoist")
            if r["mentionable"]: flags.append("mentionable")
            md.append(f"- **{r['name']}** (pos {r['position']})"+(f" _({', '.join(flags)})_" if flags else ""))
        md.append("")
        (OUT_DIR/"discord_report.md").write_text("\n".join(md),encoding="utf-8")
        print("✅ Export fertig: out/discord_export.json & out/discord_report.md")
    finally:
        await client.close()

async def main():
    await client.login(TOKEN)
    await client.connect(reconnect=False)

if __name__=="__main__":
    asyncio.run(main())
