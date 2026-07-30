export interface GeminiEnv {
  GEMINI_API_KEY: string;
  GEMINI_MODEL: string;
}

export interface Verdict {
  verdict: "scam" | "legitimate" | "uncertain";
  reason: string;
  action: string;
}

export class ScamCheckError extends Error {}

interface GeminiPart {
  text?: string;
  inline_data?: { mime_type: string; data: string };
}

const SYSTEM_PROMPT = `You are a scam-detection assistant. You will be shown a piece of text (a text message, email, or letter) or a photo of one. Decide whether it is a scam, phishing attempt, or fraud, or whether it looks legitimate.

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

export async function runScamCheck(
  env: GeminiEnv,
  input: { text?: string; imageBase64?: string; imageMediaType?: string }
): Promise<Verdict> {
  const parts: GeminiPart[] = [];
  if (input.imageBase64) {
    parts.push({
      inline_data: { mime_type: input.imageMediaType ?? "image/jpeg", data: input.imageBase64 },
    });
  }
  parts.push({
    text: input.text
      ? `Here is the message to check:\n\n${input.text}`
      : "Here is a photo of the message to check.",
  });

  const model = env.GEMINI_MODEL || "gemini-3.1-flash-lite";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

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
    throw new ScamCheckError("Scam check failed. Please try again.");
  }

  const data = (await geminiResponse.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new ScamCheckError("Model did not return a verdict.");
  }

  return JSON.parse(rawText) as Verdict;
}
