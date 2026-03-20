export const API = "http://127.0.0.1:5000";

export async function fetchMe() {
  try {
    const res = await fetch(`${API}/auth/me`, { credentials: "include" });
    return res.ok ? res.json() : null;
  } catch {
    return null;
  }
}
