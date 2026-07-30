export interface Env {
  GEMINI_API_KEY: string;
  GEMINI_MODEL: string;
}

interface CheckRequestBody {
  text?: string;
  imageBase64?: string;
  imageMediaType?: string;
}

interface Verdict {
  verdict: "scam" | "legitimate" | "uncertain";
  reason: string;
  action: string;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const SYSTEM_PROMPT = `You are a scam-detection assistant built for a mobile app used by older adults. You will be shown a piece of text (a text message, email, or letter) or a photo of one. Decide whether it is a scam, phishing attempt, or fraud, or whether it looks legitimate.

Be cautious: if you are not confident, say "uncertain" rather than guessing. Common scam patterns to watch for: urgency/fear tactics, requests for gift cards or wire transfers, requests for passwords/PINs/SSN, "you've won" prizes, fake delivery/package notices with suspicious links, impersonation of banks/government agencies/family members, threats of arrest or account closure, mismatched sender addresses or links.

Keep the reason and action in plain, simple English (a reading level a worried non-technical adult can understand in 10 seconds), one short sentence each. Never tell the user to click any link or call any number found in the suspicious message itself.

Respond with JSON only, matching the required schema.`;

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    verdict: {
      type: "STRING",
      enum: ["scam", "legitimate", "uncertain"],
      description: "Overall verdict.",
    },
    reason: {
      type: "STRING",
      description: "One short, plain-English sentence explaining why.",
    },
    action: {
      type: "STRING",
      description: "One short, plain-English sentence on what to do next.",
    },
  },
  required: ["verdict", "reason", "action"],
};

interface GeminiPart {
  text?: string;
  inline_data?: { mime_type: string; data: string };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    if (url.pathname !== "/check" || request.method !== "POST") {
      return new Response("Not found", { status: 404, headers: CORS_HEADERS });
    }

    let body: CheckRequestBody;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const text = body.text?.trim();
    const imageBase64 = body.imageBase64;
    const imageMediaType = body.imageMediaType ?? "image/jpeg";

    if (!text && !imageBase64) {
      return jsonResponse({ error: 'Provide "text" or "imageBase64".' }, 400);
    }
    if (text && text.length > 8000) {
      return jsonResponse({ error: "Text is too long." }, 400);
    }
    if (imageBase64 && imageBase64.length > 8_000_000) {
      return jsonResponse({ error: "Image is too large." }, 400);
    }

    const parts: GeminiPart[] = [];
    if (imageBase64) {
      parts.push({ inline_data: { mime_type: imageMediaType, data: imageBase64 } });
    }
    parts.push({
      text: text
        ? `Here is the message to check:\n\n${text}`
        : "Here is a photo of the message to check.",
    });

    const model = env.GEMINI_MODEL || "gemini-3.5-flash";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    try {
      const geminiResponse = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: RESPONSE_SCHEMA,
          },
        }),
      });

      if (!geminiResponse.ok) {
        const errBody = await geminiResponse.text();
        console.error("Gemini request failed", geminiResponse.status, errBody);
        return jsonResponse({ error: "Scam check failed. Please try again." }, 500);
      }

      const data = (await geminiResponse.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        return jsonResponse({ error: "Model did not return a verdict." }, 502);
      }

      const verdict = JSON.parse(rawText) as Verdict;
      return jsonResponse(verdict, 200);
    } catch (err) {
      console.error("Gemini request failed", err);
      return jsonResponse({ error: "Scam check failed. Please try again." }, 500);
    }
  },
};

function jsonResponse(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}
