"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { theme } from "@/constants/theme";
import { API } from "../../lib/api";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    fetch(`${API}/auth/me`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((user) => {
        if (user) router.replace(`/profile/${user.id}`);
        else router.replace("/");
      })
      .catch(() => router.replace("/"));
  }, [router]);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: theme.bg.base }}
    >
      <div style={{ color: theme.text.muted, fontSize: 14 }}>Loading…</div>
    </div>
  );
}
