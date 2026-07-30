import { runScamCheck, ScamCheckError, type GeminiEnv, type Verdict } from "./gemini";

export interface WhatsAppEnv {
  WHATSAPP_ACCESS_TOKEN: string;
  WHATSAPP_PHONE_NUMBER_ID: string;
  WHATSAPP_VERIFY_TOKEN: string;
}

const GRAPH_VERSION = "v21.0";

interface WhatsAppMessage {
  from: string;
  type: string;
  text?: { body: string };
  image?: { id: string };
}

interface WhatsAppWebhookPayload {
  entry?: {
    changes?: {
      value?: {
        messages?: WhatsAppMessage[];
      };
    }[];
  }[];
}

export function handleVerification(url: URL, env: WhatsAppEnv): Response {
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && challenge && token === env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function handleIncomingMessage(
  payload: WhatsAppWebhookPayload,
  env: WhatsAppEnv & GeminiEnv
): Promise<void> {
  const message = payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!message) return; // status callbacks (delivered/read) have no `messages` field — nothing to do

  const from = message.from;

  try {
    let verdict: Verdict;

    if (message.type === "text" && message.text) {
      if (message.text.body.length > 8000) {
        await sendWhatsAppMessage(from, "That message is too long for me to check. Try a shorter excerpt.", env);
        return;
      }
      verdict = await runScamCheck(env, { text: message.text.body });
    } else if (message.type === "image" && message.image) {
      const media = await downloadMedia(message.image.id, env);
      verdict = await runScamCheck(env, { imageBase64: media.base64, imageMediaType: media.mimeType });
    } else {
      await sendWhatsAppMessage(
        from,
        "Forward me the suspicious text message, or send a photo of the letter/email, and I'll check it for you.",
        env
      );
      return;
    }

    await sendWhatsAppMessage(from, formatVerdictMessage(verdict), env);
  } catch (err) {
    console.error("WhatsApp scam check failed", err);
    const friendly =
      err instanceof ScamCheckError
        ? err.message
        : "Sorry, I couldn't check that message right now. Please try again in a moment.";
    await sendWhatsAppMessage(from, friendly, env);
  }
}

async function downloadMedia(
  mediaId: string,
  env: WhatsAppEnv
): Promise<{ base64: string; mimeType: string }> {
  const metaResponse = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${mediaId}`, {
    headers: { Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}` },
  });
  if (!metaResponse.ok) {
    throw new ScamCheckError("Couldn't download that photo. Please try sending it again.");
  }
  const meta = (await metaResponse.json()) as { url: string; mime_type: string };

  const fileResponse = await fetch(meta.url, {
    headers: { Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}` },
  });
  if (!fileResponse.ok) {
    throw new ScamCheckError("Couldn't download that photo. Please try sending it again.");
  }

  const buffer = await fileResponse.arrayBuffer();
  return { base64: arrayBufferToBase64(buffer), mimeType: meta.mime_type };
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function formatVerdictMessage(verdict: Verdict): string {
  const labels: Record<Verdict["verdict"], string> = {
    scam: "⚠️ *Likely a Scam*",
    legitimate: "✅ *Looks Legitimate*",
    uncertain: "❓ *Not Sure — Be Careful*",
  };

  return [
    labels[verdict.verdict],
    "",
    verdict.reason,
    "",
    `*What to do:* ${verdict.action}`,
    "",
    "_I'm an AI and can make mistakes. When in doubt, call your bank or a trusted family member directly._",
  ].join("\n");
}

async function sendWhatsAppMessage(to: string, body: string, env: WhatsAppEnv): Promise<void> {
  const response = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body },
      }),
    }
  );

  if (!response.ok) {
    const errBody = await response.text();
    console.error("Failed to send WhatsApp message", response.status, errBody);
  }
}
