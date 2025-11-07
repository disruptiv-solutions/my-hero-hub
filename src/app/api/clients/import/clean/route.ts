import { NextRequest, NextResponse } from "next/server";

type CleanedContact = {
  name: string;
  email: string;
  phone?: string | null;
  newsletterSubscribed?: boolean;
  events?: string[];
};

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || "openrouter/auto";

function extractJsonFromText(text: string): any {
  // Try direct JSON
  try {
    return JSON.parse(text);
  } catch {}
  // Try code fence
  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (match) {
    try {
      return JSON.parse(match[1]);
    } catch {}
  }
  // Try to find first {...} block
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    const candidate = text.slice(start, end + 1);
    try {
      return JSON.parse(candidate);
    } catch {}
  }
  throw new Error("AI did not return valid JSON.");
}

function normalizeContacts(payload: any): CleanedContact[] {
  const arr =
    Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.contacts)
      ? payload.contacts
      : [];
  const out: CleanedContact[] = [];
  for (const item of arr) {
    if (!item) continue;
    const name = String(item.name || "").trim();
    const email = String(item.email || "").trim().toLowerCase();
    if (!name || !email || !email.includes("@")) continue;
    let phone =
      item.phone === undefined || item.phone === null
        ? null
        : String(item.phone).trim() || null;
    // Basic phone normalization (remove non-digits except +)
    if (phone) {
      const keepPlus = phone.startsWith("+");
      const digits = phone.replace(/\D+/g, "");
      phone = keepPlus ? `+${digits}` : digits || null;
    }
    const newsletter =
      typeof item.newsletterSubscribed === "boolean"
        ? item.newsletterSubscribed
        : ["true", "yes", "y", "1"].includes(String(item.newsletterSubscribed || "").toLowerCase());
    // Events normalization: accept events (string|string[]) or eventName
    let events: string[] = [];
    const rawEvents = item.events ?? item.eventName ?? item["event"] ?? item["event_name"];
    if (Array.isArray(rawEvents)) {
      events = rawEvents;
    } else if (typeof rawEvents === "string") {
      // Split by common separators; keep hyphens inside names
      events = rawEvents.split(/[;|]+/).map((e: string) => e.trim()).filter(Boolean);
      if (events.length === 0 && rawEvents.trim()) {
        events = [rawEvents.trim()];
      }
    }
    events = Array.from(new Set(events.filter((e) => typeof e === "string" && e.trim()).map((e) => e.trim())));
    out.push({
      name,
      email,
      phone: phone || undefined,
      newsletterSubscribed: Boolean(newsletter),
      events,
    });
  }
  // Deduplicate by email (keep first)
  const seen = new Set<string>();
  return out.filter((c) => {
    if (seen.has(c.email)) return false;
    seen.add(c.email);
    return true;
  });
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY is not set" },
        { status: 500 }
      );
    }
    const body = await request.json().catch(() => null);
    const csv = body?.csv;
    if (!csv || typeof csv !== "string") {
      return NextResponse.json(
        { error: "Invalid payload. Expected { csv: string }" },
        { status: 400 }
      );
    }

    const system = `You are a data cleaning assistant. Convert raw CSV containing contacts into clean JSON.
Return ONLY JSON, no extra text. Schema:
{
  "contacts": [
    { "name": "string", "email": "string", "phone": "string|optional", "newsletterSubscribed": "boolean|optional", "events": "string[]|optional" }
  ]
}
Rules:
- Accept header variations: name/fullname/firstname+lastname, email/emailaddress, phone/phoneNumber, newsletter/subscribed/registeredForNewsletter, event/eventname/events
- If first/last name provided, combine to "name" as "First Last"
- Trim whitespace, fix casing, validate emails, infer missing newsletter as false
- Normalize phone by removing formatting; preserve leading + if present
- For "events" accept single name or multiple (split on ';' or '|'). Always return an array (unique, trimmed).
- Remove duplicates by email (keep the first)
- Exclude rows missing name or email or invalid email`;

    const user = `CSV:\n${csv}`;

    const resp = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://my-hero-hub", // optional best practice
        "X-Title": "Hero Hub CSV Cleaning", // optional
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0,
        response_format: { type: "json_object" },
      }),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      return NextResponse.json(
        { error: `OpenRouter error: ${resp.status} ${text.slice(0, 500)}` },
        { status: 502 }
      );
    }
    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      return NextResponse.json(
        { error: "Invalid AI response" },
        { status: 502 }
      );
    }
    const json = extractJsonFromText(content);
    const contacts = normalizeContacts(json);
    if (!contacts.length) {
      return NextResponse.json(
        { error: "No valid contacts after cleaning" },
        { status: 400 }
      );
    }
    return NextResponse.json({ contacts });
  } catch (error: any) {
    console.error("CSV clean error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to clean CSV" },
      { status: 500 }
    );
  }
}


