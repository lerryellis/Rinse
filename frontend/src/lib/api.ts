const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function uploadPdf(
  endpoint: string,
  file: File,
  params?: Record<string, string>
): Promise<Blob> {
  const formData = new FormData();
  formData.append("file", file);

  const queryString = params
    ? "?" + new URLSearchParams(params).toString()
    : "";

  const res = await fetch(`${API_URL}/api/pdf/${endpoint}${queryString}`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail || `Error: ${res.status}`);
  }

  return res.blob();
}

export async function getUsage() {
  const res = await fetch(`${API_URL}/api/auth/usage`);
  if (!res.ok) throw new Error("Failed to fetch usage");
  return res.json();
}

export async function healthCheck() {
  const res = await fetch(`${API_URL}/health`);
  return res.json();
}
