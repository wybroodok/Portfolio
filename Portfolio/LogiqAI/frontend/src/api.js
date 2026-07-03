/** API client. Relative URLs — Vite proxies /api to the backend. */

async function handle(res) {
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body.detail) detail = body.detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  return res.json();
}

export async function registerUser(username) {
  return handle(
    await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    })
  );
}

export async function getUser(userId) {
  const res = await fetch(`/api/users/${userId}`);
  if (!res.ok) return null;
  return res.json();
}

export async function analyzeFile(userId, file) {
  const form = new FormData();
  form.append("user_id", userId);
  form.append("file", file);
  return handle(await fetch("/api/analyze", { method: "POST", body: form }));
}

export async function getUserAudits(userId) {
  return handle(await fetch(`/api/users/${userId}/audits`));
}

export async function getHealth() {
  try {
    const res = await fetch("/api/health");
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
