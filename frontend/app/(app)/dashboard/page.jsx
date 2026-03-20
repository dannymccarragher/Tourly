"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { theme } from "@/constants/theme";

const API = "http://127.0.0.1:5000";

function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMins = Math.floor((now - date) / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays}d ago`;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function SyncIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

function StatCard({ label, value, accent = false, green = false }) {
  const accentColor = green ? theme.accent.green : theme.accent.purple;
  return (
    <div
      className="flex flex-col gap-1.5 p-5 rounded-2xl"
      style={{
        background: accent ? (green ? "rgba(30,215,96,0.07)" : "rgba(162,89,255,0.07)") : theme.bg.elevated,
        border: `1px solid ${accent ? (green ? "rgba(30,215,96,0.18)" : "rgba(162,89,255,0.18)") : theme.border.subtle}`,
      }}
    >
      <p className="text-xs uppercase tracking-widest" style={{ color: theme.text.muted }}>
        {label}
      </p>
      <p
        className="text-3xl font-bold truncate"
        style={{ color: accent ? accentColor : theme.text.primary }}
      >
        {value}
      </p>
    </div>
  );
}

function SmallStatCard({ label, value }) {
  return (
    <div
      className="flex flex-col gap-1.5 p-5 rounded-2xl"
      style={{ background: theme.bg.elevated, border: `1px solid ${theme.border.subtle}` }}
    >
      <p className="text-xs uppercase tracking-widest" style={{ color: theme.text.muted }}>
        {label}
      </p>
      <p className="text-lg font-bold truncate" style={{ color: theme.text.primary }}>
        {value}
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [user, setUser] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncMsg, setSyncMsg] = useState(null);

  async function syncPlays() {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch(`${API}/stats/sync`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSyncMsg({ type: "ok", text: `Synced ${data.new_plays ?? ""} new plays` });
    } catch (err) {
      setSyncMsg({ type: "error", text: err.message ?? "Sync failed" });
    } finally {
      setSyncing(false);
    }
  }

  async function fetchData() {
    try {
      const [meRes, statsRes, lbRes] = await Promise.all([
        fetch(`${API}/auth/me`, { credentials: "include" }),
        fetch(`${API}/stats/stats`, { credentials: "include" }),
        fetch(`${API}/stats/leaderboard`, { credentials: "include" }),
      ]);
      const [meData, statsData, lbData] = await Promise.all([
        meRes.json(),
        statsRes.json(),
        lbRes.json(),
      ]);
      setUser(meData);
      setStats(statsData);
      setLeaderboard(Array.isArray(lbData) ? lbData : []);
    } catch {
      // silently fail — layout already handles auth
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const init = async () => {
      await syncPlays();
      await fetchData();
    };
    init();
  }, []);

  const isEmpty = !stats || Number(stats.total_songs) === 0;
  const userRank = user && leaderboard.findIndex((u) => u.id === user.id) + 1;
  const medals = ["🥇", "🥈", "🥉"];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: theme.text.muted }}>Loading...</p>
      </div>
    );
  }

  return (
    <div
      className="px-6 py-8"
      style={{ maxWidth: 820, margin: "0 auto" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1
            className="text-3xl font-bold"
            style={{ color: theme.text.primary, letterSpacing: "-0.5px" }}
          >
            {getGreeting()}{user ? `, ${user.display_name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-sm mt-1.5" style={{ color: theme.text.muted }}>
            Here&apos;s your week so far
            {userRank > 0 && (
              <>
                {" "}·{" "}
                <span style={{ color: theme.accent.purple, fontWeight: 600 }}>
                  #{userRank} on the leaderboard
                </span>
              </>
            )}
          </p>
        </div>

        <button
          onClick={async () => {
            await syncPlays();
            await fetchData();
          }}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold flex-shrink-0"
          style={{
            background: syncing ? theme.bg.elevated : theme.accent.green,
            color: syncing ? theme.text.muted : "#000",
            border: `1px solid ${syncing ? theme.border.subtle : "transparent"}`,
            cursor: syncing ? "not-allowed" : "pointer",
            transition: "background 0.2s",
          }}
        >
          <SyncIcon />
          {syncing ? "Syncing…" : "Sync"}
        </button>
      </div>

      {/* Sync feedback */}
      {syncMsg && (
        <div
          className="px-4 py-3 rounded-xl mb-6 text-sm"
          style={{
            background:
              syncMsg.type === "ok"
                ? "rgba(30,215,96,0.08)"
                : "rgba(162,89,255,0.08)",
            border: `1px solid ${syncMsg.type === "ok" ? "rgba(30,215,96,0.2)" : "rgba(162,89,255,0.2)"}`,
            color: syncMsg.type === "ok" ? theme.accent.green : theme.accent.purple,
          }}
        >
          {syncMsg.text}
        </div>
      )}

      {/* Stat cards */}
      {isEmpty ? (
        <div
          className="rounded-2xl p-8 text-center mb-8"
          style={{ background: theme.bg.surface, border: `1px solid ${theme.border.subtle}` }}
        >
          <p style={{ color: theme.text.muted }}>
            No plays recorded this week yet. Hit sync to load your data.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard label="Songs" value={stats.total_songs} accent green />
          <StatCard label="Minutes" value={Math.round(stats.total_minutes)} accent />
          <SmallStatCard label="Top artist" value={stats.top_artist ?? "—"} />
          <SmallStatCard
            label="Last played"
            value={stats.last_played ? timeAgo(stats.last_played) : "—"}
          />
        </div>
      )}

      {/* Leaderboard preview */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: `1px solid ${theme.border.subtle}` }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: `1px solid ${theme.border.subtle}`, background: theme.bg.surface }}
        >
          <h2 className="font-semibold" style={{ color: theme.text.primary }}>
            This week&apos;s leaderboard
          </h2>
          <Link
            href="/leaderboard"
            className="text-sm font-medium"
            style={{ color: theme.accent.purple, textDecoration: "none" }}
          >
            View all →
          </Link>
        </div>

        {leaderboard.length === 0 ? (
          <div
            className="px-5 py-8 text-center"
            style={{ background: theme.bg.surface }}
          >
            <p className="text-sm" style={{ color: theme.text.muted }}>
              No data yet.
            </p>
          </div>
        ) : (
          <div style={{ background: theme.bg.surface }}>
            {leaderboard.slice(0, 5).map((lb, i) => {
              const isYou = lb.id === user?.id;
              return (
                <Link
                  key={lb.id}
                  href={`/profile/${lb.id}`}
                  className="flex items-center gap-3 px-5 py-3.5"
                  style={{
                    background: isYou ? "rgba(162,89,255,0.06)" : "transparent",
                    borderTop: i > 0 ? `1px solid ${theme.border.subtle}` : "none",
                    textDecoration: "none",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = isYou
                      ? "rgba(162,89,255,0.12)"
                      : theme.bg.elevated)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = isYou
                      ? "rgba(162,89,255,0.06)"
                      : "transparent")
                  }
                >
                  <span className="w-6 text-center flex-shrink-0" style={{ fontSize: i < 3 ? 16 : 13 }}>
                    {i < 3 ? (
                      medals[i]
                    ) : (
                      <span style={{ color: theme.text.muted }}>{i + 1}</span>
                    )}
                  </span>

                  {lb.avatar_url ? (
                    <img
                      src={lb.avatar_url}
                      alt={lb.display_name}
                      className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: theme.bg.highlight, color: theme.text.secondary }}
                    >
                      {lb.display_name?.[0]?.toUpperCase()}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: theme.text.primary }}>
                      {lb.display_name}
                      {isYou && (
                        <span
                          className="ml-2 text-xs px-1.5 py-0.5 rounded-full"
                          style={{ background: "rgba(162,89,255,0.2)", color: theme.accent.purple }}
                        >
                          you
                        </span>
                      )}
                    </p>
                    {lb.top_artist && (
                      <p className="text-xs truncate" style={{ color: theme.text.muted }}>
                        {lb.top_artist}
                      </p>
                    )}
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold" style={{ color: theme.text.primary }}>
                      {Math.round(lb.total_minutes ?? 0)} min
                    </p>
                    <p className="text-xs" style={{ color: theme.text.muted }}>
                      {lb.total_songs} songs
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
