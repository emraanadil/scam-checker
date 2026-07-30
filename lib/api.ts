export type Verdict = "scam" | "legitimate" | "uncertain";

export interface CheckResult {
  verdict: Verdict;
  reason: string;
  action: string;
}

// Set via app.json "extra.apiBaseUrl" or the EXPO_PUBLIC_API_BASE_URL env var
// so the deployed backend URL can be configured without code changes.
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8787";

export class CheckRequestError extends Error {}

export async function checkMessage(input: {
  text?: string;
  imageBase64?: string;
  imageMediaType?: string;
}): Promise<CheckResult> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    throw new CheckRequestError(
      "Couldn't reach the scam-check service. Check your internet connection and try again."
    );
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new CheckRequestError("Something went wrong. Please try again.");
  }

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "error" in data
        ? String((data as { error: unknown }).error)
        : "Something went wrong. Please try again.";
    throw new CheckRequestError(message);
  }

  return data as CheckResult;
}
