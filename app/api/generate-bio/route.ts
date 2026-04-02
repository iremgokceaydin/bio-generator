import { NextResponse } from "next/server";
import { z } from "zod";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import profile from "../../../data/profile.json";

const PayloadSchema = z.object({
  bioLength: z.number().int().min(10).max(200).optional(),
  emojis: z.number().int().min(0).max(30).optional(),
  reality: z.number().int().min(0).max(100).optional(),
  career: z.number().int().min(0).max(100).optional(),
  aggression: z.number().int().min(0).max(100).optional(),
  model: z.string().optional(), // ignored
});

function interpretControls(p: any) {
  const emojiRule =
    p.emojis === 0 ? "Do not use emojis." :
      p.emojis <= 5 ? "Use 1–3 emojis." :
        p.emojis <= 15 ? "Use 3-6 emojis." :
          "Use 6-8 emojis.";

  const tone =
    p.aggression <= 20 ? "warm, calm, friendly" :
      p.aggression <= 50 ? "confident, direct" :
        "bold, punchy (not rude/offensive)";

  const realism =
    p.reality >= 80 ? "strictly factual from the provided FACTS only" :
      p.reality >= 40 ? "mostly factual, light descriptive phrasing" :
        p.reality >= 20 ? "expressive phrasing with light metaphor" :
          "use warm language with heavy metaphor or atmospheric phrases";

  const careerFocus =
    p.career >= 80 ? "career-forward" :
      p.career >= 50 ? "balanced career + personality" :
        "personality-forward, minimal career";

  return { emojiRule, tone, realism, careerFocus };
}

const allowedMissing = [
  "name",
  "title",
  "education",
  "location",
  "years of experience",
  "key roles",
  "key companies",
  "key projects/impact",
  "skills/focus areas",
  "links"
].join(", ");

function buildPrompt(payload: any) {
  const facts = (profile as any).facts ?? [];
  const links = (profile as any).links ?? {};
  const { emojiRule, tone, realism, careerFocus } =
    interpretControls(payload);

  const factsBlock = facts
    .map((f: any) => `- (${f.id}) ${f.text}`)
    .join("\n");

  const linksBlock = Object.entries(links)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join("\n");

  return `
You are generating a short third-person bio about the user.

ABSOLUTE RULES (must follow):
- Use ONLY the FACTS and LINKS listed below.
- Do NOT invent, infer, or assume anything not explicitly stated.
- If information is missing, omit it and list it in "missingInfo".
- If you reference a link, use it exactly as given (no modifications).
- Prefer including at most 3 links from the LINKS listed below (website, works, resume or LinkedIn) only if it fits naturally.
- If you include any URL, it MUST be its own segment as list items below the bio under "References" section text with:
  - link icon
  - the exact URL from LINKS rendered as clickable links
  - short label (e.g., "Website" or "LinkedIn" or "Works" or "Resume")
- Do NOT browse or rely on external knowledge.
- Output MUST be valid JSON only.

Missing info policy:
- Only include items in missingInfo if the bio cannot be written clearly without them.
- missingInfo MUST be a subset of: ${allowedMissing}.
- Do NOT request "current company" unless it is explicitly required by the user's request.

STYLE CONTROLS:
- Target length: ~${payload.bioLength ?? 40} words (±10).
- Tone: ${tone}.
- Professional emphasis: ${careerFocus}.
- Factual strictness: ${realism}.
- Emoji usage: ${emojiRule}.

FACTS (ground truth):
${factsBlock}

LINKS:
${linksBlock}

- Return ONLY valid JSON in this schema:
{
  "bio": string,
  "usedFactIds": string[],
  "usedLinkKeys": string[],
  "missingInfo": string[]
}

Write the bio now.
`.trim();
}

const responseSchema = {
  type: "OBJECT",
  properties: {
    bio: { type: "STRING" },
    usedFactIds: { type: "ARRAY", items: { type: "STRING" } },
    usedLinkKeys: { type: "ARRAY", items: { type: "STRING" } },
    missingInfo: { type: "ARRAY", items: { type: "STRING" } }
  },
  required: ["bio", "usedFactIds", "usedLinkKeys", "missingInfo"]
};

export async function POST(req: Request) {
  try {
    const rawPayload = await req.json();

    const MODEL = "gemini-3-flash-preview";

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY!,
    });

    const payload = PayloadSchema.parse(rawPayload); // verify payload
    const prompt = buildPrompt(payload);
    console.log(prompt);

    const resp = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        temperature: 0.4,
        maxOutputTokens: 500,
      },
    });

    const text = (resp.text ?? "").trim();

    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      json = {
        error: e,
        response: text,
        missingInfo: ["Model returned invalid JSON."],
      };
    }

    return NextResponse.json(json);
  } catch (err) {
    return NextResponse.json(
      { response: "Bio generation failed.", err },
      { status: 400 }
    );
  }
}


export async function GET() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  return NextResponse.json({ ok: true });
}