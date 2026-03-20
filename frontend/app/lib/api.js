export const API = process.env.NEXT_PUBLIC_API_BASE;

export async function fetchMe() {
  try {
    const res = await fetch(`${API}/auth/me`, { credentials: "include" });
    return res.ok ? res.json() : null;
  } catch {
    return null;
  }
}
