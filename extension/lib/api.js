const API_BASE_URL = "https://senior-scam-checker-api.emraanadil.workers.dev";

async function checkText(text) {
  return checkRequest({ text });
}

async function checkImage(imageBase64, imageMediaType) {
  return checkRequest({ imageBase64, imageMediaType });
}

async function checkRequest(body) {
  const response = await fetch(`${API_BASE_URL}/check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Scam check failed. Please try again.");
  }
  return data;
}
