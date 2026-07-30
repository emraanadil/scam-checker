import { runScamCheck, ScamCheckError, type GeminiEnv } from "./gemini";
import { handleIncomingMessage, handleVerification, type WhatsAppEnv } from "./whatsapp";

export interface Env extends GeminiEnv, WhatsAppEnv {}

interface CheckRequestBody {
  text?: string;
  imageBase64?: string;
  imageMediaType?: string;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    if (url.pathname === "/check" && request.method === "POST") {
      return handleCheck(request, env);
    }

    if (url.pathname === "/whatsapp/webhook") {
      if (request.method === "GET") {
        return handleVerification(url, env);
      }
      if (request.method === "POST") {
        return handleWhatsAppWebhook(request, env, ctx);
      }
    }

    return new Response("Not found", { status: 404, headers: CORS_HEADERS });
  },
};

async function handleCheck(request: Request, env: Env): Promise<Response> {
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

  try {
    const verdict = await runScamCheck(env, { text, imageBase64, imageMediaType });
    return jsonResponse(verdict, 200);
  } catch (err) {
    const message = err instanceof ScamCheckError ? err.message : "Scam check failed. Please try again.";
    console.error("Check request failed", err);
    return jsonResponse({ error: message }, 500);
  }
}

async function handleWhatsAppWebhook(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  // Meta expects a fast 200 ack and retries on timeout/non-200, so the actual
  // scam check + reply happens after we've already responded.
  ctx.waitUntil(handleIncomingMessage(payload as Parameters<typeof handleIncomingMessage>[0], env));
  return new Response("OK", { status: 200 });
}

function jsonResponse(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}
