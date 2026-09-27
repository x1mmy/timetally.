import { NextResponse } from "next/server";
import { z } from "zod";

import { env } from "~/env";

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  business: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(30).default(""),
  notes: z.string().trim().max(1000).default(""),
  staff: z.enum(["1–5", "6–15", "16–40", "40+"]),
  method: z.enum(["Paper", "Spreadsheet", "Other software"]),
  website: z.string().default(""), // honeypot
});

/**
 * Public demo-request form on the marketing site. Forwards to a Discord webhook.
 * ponytail: honeypot only, no rate limiting; add per-IP limiting if spam gets through.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const f = parsed.data;
  if (f.website) return NextResponse.json({ ok: true }); // bot: pretend it worked

  const res = await fetch(env.DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      allowed_mentions: { parse: [] }, // user text can't ping @everyone / roles
      embeds: [
        {
          title: `Demo request — ${f.business}`,
          color: 0x2563eb,
          fields: [
            { name: "Name", value: f.name, inline: true },
            { name: "Email", value: f.email, inline: true },
            { name: "Phone", value: f.phone || "—", inline: true },
            { name: "Staff", value: f.staff, inline: true },
            { name: "Timesheets today", value: f.method, inline: true },
            { name: "Notes", value: f.notes || "—" },
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    }),
  }).catch(() => null);

  if (!res?.ok) return NextResponse.json({ error: "Could not send" }, { status: 502 });
  return NextResponse.json({ ok: true });
}
