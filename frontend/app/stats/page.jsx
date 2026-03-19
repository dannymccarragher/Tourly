"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { theme } from "@/constants/theme";

const API = "http://127.0.0.1:5000";

function timeAgo(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMins = Math.floor((now - date) / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

export default function StatsPage() {
  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    try {
      const res = await fetch(`${API}/auth/logout`, { method: "POST", credentials: "include" });
      const data = await res.json();
      console.log(data); 
      window.location.href = "/";
    } catch {
      setLoggingOut(false);
    }
  }

  async function sync() {
    setSyncing(true);
    try {
      const res = await fetch(`${API}/stats/sync`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
    } catch (err) {
      setError(err.message);
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

      if (!meRes.ok) throw new Error("Not authenticated");
      if (!statsRes.ok) throw new Error("Failed to fetch stats");
      if (!lbRes.ok) throw new Error("Failed to fetch leaderboard");

      const [meData, statsData, lbData] = await Promise.all([
        meRes.json(),
        statsRes.json(),
        lbRes.json(),
      ]);

      setUserId(meData.id);
      setStats(statsData);
      setLeaderboard(lbData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const init = async () => {
      await sync();
      await fetchData();
    };
    init();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: theme.text.muted }}>Loading stats...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: theme.accent.purple }}>{error}</p>
      </div>
    );
  }

  const isEmpty = !stats || stats.total_songs === "0" || stats.total_songs === 0;

  return (
    <div className="min-h-screen p-8" style={{ maxWidth: "720px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "2.5rem" }}>

      {/* header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold" style={{ color: theme.text.primary }}>
          This week
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={async () => { await sync(); await fetchData(); }}
            disabled={syncing}
            style={{
              background: syncing ? theme.bg.highlight : theme.accent.green,
              color: syncing ? theme.text.muted : "#000",
              fontWeight: 600,
              fontSize: "14px",
              padding: "10px 24px",
              borderRadius: "9999px",
              border: "none",
              cursor: syncing ? "not-allowed" : "pointer",
              opacity: syncing ? 0.6 : 1,
              transition: "background 0.15s ease",
            }}
          >
            {syncing ? "Syncing..." : "Sync plays"}
          </button>
          <button
            onClick={logout}
            disabled={loggingOut}
            style={{
              background: "transparent",
              color: theme.text.muted,
              fontSize: "14px",
              fontWeight: 500,
              padding: "10px 16px",
              borderRadius: "9999px",
              border: `1px solid ${theme.border.subtle}`,
              cursor: loggingOut ? "not-allowed" : "pointer",
              opacity: loggingOut ? 0.5 : 1,
              transition: "color 0.15s ease, border-color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = theme.text.primary;
              e.currentTarget.style.borderColor = theme.border.default;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = theme.text.muted;
              e.currentTarget.style.borderColor = theme.border.subtle;
            }}
          >
            {loggingOut ? "Logging out..." : "Log out"}
          </button>
        </div>
      </div>

      {/* stat cards */}
      {isEmpty ? (
        <div
          className="text-center p-8 rounded-2xl"
          style={{ background: theme.bg.surface, border: `1px solid ${theme.border.subtle}` }}
        >
          <p style={{ color: theme.text.muted }}>No plays this week yet. Hit sync to load your data.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Songs" value={stats.total_songs} />
          <StatCard label="Minutes" value={Math.round(stats.total_minutes)} />
          <StatCard label="Top artist" value={stats.top_artist ?? "—"} small />
          <StatCard label="Last played" value={stats.last_played ? timeAgo(stats.last_played) : "—"} small />
        </div>
      )}

      {/* leaderboard */}
      <div>
        <h2 className="text-2xl font-semibold mb-4" style={{ color: theme.text.primary }}>
          Leaderboard
        </h2>
        {leaderboard.length === 0 ? (
          <p style={{ color: theme.text.muted }}>No data yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {leaderboard.map((user, i) => {
              const isYou = user.id === userId;
              return (
                <Link
                  key={user.id}
                  href={`/stats/user/${user.id}`}
                  className="flex items-center gap-4 p-4 rounded-xl"
                  style={{
                    background: isYou ? "rgba(162,89,255,0.08)" : theme.bg.surface,
                    border: `1px solid ${isYou ? theme.accent.purple : theme.border.subtle}`,
                    transition: "background 0.15s ease, border-color 0.15s ease",
                    textDecoration: "none",
                    display: "flex",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = isYou
                      ? "rgba(162,89,255,0.14)"
                      : theme.bg.elevated;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isYou
                      ? "rgba(162,89,255,0.08)"
                      : theme.bg.surface;
                  }}
                >
                  <span className="text-lg font-semibold w-5" style={{ color: theme.text.muted }}>
                    {i + 1}
                  </span>

                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.display_name}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
                      style={{ background: theme.bg.highlight, color: theme.text.secondary }}
                    >
                      {user.display_name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" style={{ color: theme.text.primary }}>
                      {user.display_name}
                      {isYou && (
                        <span
                          className="ml-2 text-xs px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(162,89,255,0.2)", color: theme.accent.purple }}
                        >
                          you
                        </span>
                      )}
                    </p>
                    {user.top_artist && (
                      <p className="text-sm truncate" style={{ color: theme.text.muted }}>
                        Top: {user.top_artist}
                      </p>
                    )}
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold" style={{ color: theme.text.primary }}>
                      {Math.round(user.total_minutes ?? 0)} min
                    </p>
                    <p className="text-sm" style={{ color: theme.text.muted }}>
                      {user.total_songs} songs
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

function StatCard({ label, value, small = false }) {
  return (
    <div
      className="flex flex-col gap-1 p-4 rounded-xl"
      style={{ background: theme.bg.elevated, border: `1px solid ${theme.border.subtle}` }}
    >
      <p
        className="text-xs uppercase tracking-wider"
        style={{ color: theme.text.muted }}
      >
        {label}
      </p>
      <p
        className={`font-bold truncate ${small ? "text-base" : "text-2xl"}`}
        style={{ color: theme.text.primary }}
      >
        {value}
      </p>
    </div>
  );
}