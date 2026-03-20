"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { theme } from "@/constants/theme";
import { API } from "../../lib/api";

function Avatar({ user, size = 40 }) {
  if (user.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={user.display_name}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: theme.bg.highlight,
        color: theme.text.secondary,
        fontSize: size * 0.35,
      }}
    >
      {user.display_name?.[0]?.toUpperCase()}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function UserPlusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export default function FriendsPage() {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [pendingActions, setPendingActions] = useState({});

  const loadData = useCallback(async () => {
    const [friendsRes, requestsRes] = await Promise.all([
      fetch(`${API}/friends/`, { credentials: "include" }),
      fetch(`${API}/friends/requests`, { credentials: "include" }),
    ]);
    const friendsData = friendsRes.ok ? await friendsRes.json() : [];
    const requestsData = requestsRes.ok ? await requestsRes.json() : [];
    setFriends(Array.isArray(friendsData) ? friendsData : []);
    setRequests(Array.isArray(requestsData) ? requestsData : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `${API}/friends/search?q=${encodeURIComponent(search.trim())}`,
          { credentials: "include" }
        );
        const data = res.ok ? await res.json() : [];
        setSearchResults(Array.isArray(data) ? data : []);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  async function sendRequest(userId) {
    setPendingActions((p) => ({ ...p, [userId]: "sending" }));
    const res = await fetch(`${API}/friends/request/${userId}`, {
      method: "POST",
      credentials: "include",
    });
    if (res.ok) {
      setPendingActions((p) => ({ ...p, [userId]: "sent" }));
      setSearchResults((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: "pending", direction: "sent" } : u))
      );
    } else {
      setPendingActions((p) => ({ ...p, [userId]: null }));
    }
  }

  async function acceptRequest(userId) {
    setPendingActions((p) => ({ ...p, [userId]: "accepting" }));
    const res = await fetch(`${API}/friends/accept/${userId}`, {
      method: "POST",
      credentials: "include",
    });
    if (res.ok) {
      setRequests((prev) => prev.filter((r) => r.id !== userId));
      await loadData();
    }
    setPendingActions((p) => ({ ...p, [userId]: null }));
  }

  async function declineOrRemove(userId) {
    setPendingActions((p) => ({ ...p, [userId]: "removing" }));
    const res = await fetch(`${API}/friends/${userId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      setRequests((prev) => prev.filter((r) => r.id !== userId));
      setFriends((prev) => prev.filter((f) => f.id !== userId));
      setSearchResults((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: null, direction: null } : u))
      );
    }
    setPendingActions((p) => ({ ...p, [userId]: null }));
  }

  function friendActionButton(u) {
    const busy = !!pendingActions[u.id];
    if (u.status === "accepted") {
      return (
        <button
          disabled={busy}
          onClick={() => declineOrRemove(u.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{
            background: busy ? theme.bg.elevated : "transparent",
            border: `1px solid ${theme.border.default}`,
            color: busy ? theme.text.muted : theme.text.secondary,
            cursor: busy ? "default" : "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            if (!busy) {
              e.currentTarget.style.background = "rgba(255,60,60,0.1)";
              e.currentTarget.style.borderColor = "rgba(255,60,60,0.4)";
              e.currentTarget.style.color = "#ff6060";
            }
          }}
          onMouseLeave={(e) => {
            if (!busy) {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = theme.border.default;
              e.currentTarget.style.color = theme.text.secondary;
            }
          }}
        >
          <XIcon /> {busy ? "Removing…" : "Remove"}
        </button>
      );
    }
    if (u.status === "pending" && u.direction === "sent") {
      return (
        <span className="text-xs px-3 py-1.5 rounded-lg" style={{ color: theme.text.muted, border: `1px solid ${theme.border.subtle}` }}>
          Request sent
        </span>
      );
    }
    if (u.status === "pending" && u.direction === "received") {
      return (
        <div className="flex gap-2">
          <button
            disabled={busy}
            onClick={() => acceptRequest(u.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{
              background: busy ? theme.bg.elevated : "rgba(30,215,96,0.12)",
              border: `1px solid rgba(30,215,96,0.3)`,
              color: busy ? theme.text.muted : theme.accent.green,
              cursor: busy ? "default" : "pointer",
            }}
          >
            <CheckIcon /> Accept
          </button>
          <button
            disabled={busy}
            onClick={() => declineOrRemove(u.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{
              background: "transparent",
              border: `1px solid ${theme.border.subtle}`,
              color: theme.text.muted,
              cursor: busy ? "default" : "pointer",
            }}
          >
            <XIcon />
          </button>
        </div>
      );
    }
    return (
      <button
        disabled={busy}
        onClick={() => sendRequest(u.id)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
        style={{
          background: busy ? theme.bg.elevated : "rgba(162,89,255,0.12)",
          border: `1px solid rgba(162,89,255,0.3)`,
          color: busy ? theme.text.muted : theme.accent.purple,
          cursor: busy ? "default" : "pointer",
          transition: "all 0.15s",
        }}
      >
        <UserPlusIcon /> {busy ? "Sending…" : "Add"}
      </button>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: theme.text.muted }}>Loading…</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-8" style={{ maxWidth: 720, margin: "0 auto" }}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1" style={{ color: theme.text.primary, letterSpacing: "-0.5px" }}>
          Friends
        </h1>
        <p className="text-sm" style={{ color: theme.text.muted }}>
          {friends.length} {friends.length === 1 ? "friend" : "friends"}
        </p>
      </div>

      {/* Add friend search */}
      <div
        className="rounded-2xl p-5 mb-6"
        style={{ background: theme.bg.surface, border: `1px solid ${theme.border.subtle}` }}
      >
        <p className="text-sm font-semibold mb-3" style={{ color: theme.text.primary }}>
          Add a friend
        </p>
        <div className="relative">
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: theme.text.muted, pointerEvents: "none" }}
          >
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder="Search by display name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{
              background: theme.bg.elevated,
              border: `1px solid ${theme.border.subtle}`,
              color: theme.text.primary,
            }}
          />
        </div>

        {/* Search results */}
        {(search.trim() || searching) && (
          <div className="mt-2 rounded-xl overflow-hidden" style={{ border: `1px solid ${theme.border.subtle}` }}>
            {searching ? (
              <p className="px-4 py-3 text-sm" style={{ color: theme.text.muted }}>
                Searching…
              </p>
            ) : searchResults.length === 0 ? (
              <p className="px-4 py-3 text-sm" style={{ color: theme.text.muted }}>
                No users found.
              </p>
            ) : (
              searchResults.map((u, i) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{
                    background: theme.bg.elevated,
                    borderTop: i > 0 ? `1px solid ${theme.border.subtle}` : "none",
                  }}
                >
                  <Avatar user={u} size={36} />
                  <Link
                    href={`/profile/${u.id}`}
                    className="flex-1 min-w-0 text-sm font-medium truncate"
                    style={{ color: theme.text.primary, textDecoration: "none" }}
                  >
                    {u.display_name}
                  </Link>
                  {friendActionButton(u)}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Pending requests */}
      {requests.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: theme.text.muted }}>
            Friend Requests · {requests.length}
          </h2>
          <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${theme.border.subtle}` }}>
            {requests.map((r, i) => (
              <div
                key={r.id}
                className="flex items-center gap-3 px-5 py-4"
                style={{
                  background: theme.bg.surface,
                  borderTop: i > 0 ? `1px solid ${theme.border.subtle}` : "none",
                }}
              >
                <Avatar user={r} size={40} />
                <Link
                  href={`/profile/${r.id}`}
                  className="flex-1 min-w-0"
                  style={{ textDecoration: "none" }}
                >
                  <p className="font-medium text-sm truncate" style={{ color: theme.text.primary }}>
                    {r.display_name}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: theme.text.muted }}>
                    Wants to be friends
                  </p>
                </Link>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    disabled={!!pendingActions[r.id]}
                    onClick={() => acceptRequest(r.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{
                      background: "rgba(30,215,96,0.12)",
                      border: "1px solid rgba(30,215,96,0.3)",
                      color: theme.accent.green,
                      cursor: pendingActions[r.id] ? "default" : "pointer",
                      opacity: pendingActions[r.id] ? 0.5 : 1,
                    }}
                  >
                    <CheckIcon /> Accept
                  </button>
                  <button
                    disabled={!!pendingActions[r.id]}
                    onClick={() => declineOrRemove(r.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{
                      background: "transparent",
                      border: `1px solid ${theme.border.subtle}`,
                      color: theme.text.muted,
                      cursor: pendingActions[r.id] ? "default" : "pointer",
                      opacity: pendingActions[r.id] ? 0.5 : 1,
                    }}
                  >
                    <XIcon /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Friends list */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: theme.text.muted }}>
          Friends · {friends.length}
        </h2>

        {friends.length === 0 ? (
          <div
            className="rounded-2xl flex flex-col items-center justify-center py-14 text-center"
            style={{ border: `1px solid ${theme.border.subtle}`, background: theme.bg.surface }}
          >
            <p className="text-sm font-medium mb-1" style={{ color: theme.text.secondary }}>
              No friends yet
            </p>
            <p className="text-xs" style={{ color: theme.text.muted }}>
              Search above to find and add people.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${theme.border.subtle}` }}>
            {friends.map((f, i) => (
              <div
                key={f.id}
                className="flex items-center gap-4 px-5 py-4"
                style={{
                  background: theme.bg.surface,
                  borderTop: i > 0 ? `1px solid ${theme.border.subtle}` : "none",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = theme.bg.elevated)}
                onMouseLeave={(e) => (e.currentTarget.style.background = theme.bg.surface)}
              >
                <Avatar user={f} size={42} />
                <Link
                  href={`/profile/${f.id}`}
                  className="flex-1 min-w-0"
                  style={{ textDecoration: "none" }}
                >
                  <p className="font-medium truncate" style={{ color: theme.text.primary }}>
                    {f.display_name}
                  </p>
                  {f.top_artist && (
                    <p className="text-sm truncate mt-0.5" style={{ color: theme.text.muted }}>
                      {f.top_artist}
                    </p>
                  )}
                </Link>
                <div className="text-right flex-shrink-0 mr-4">
                  <p className="font-semibold text-sm" style={{ color: theme.text.primary }}>
                    {Math.round(f.total_minutes ?? 0)} min
                  </p>
                  <p className="text-xs" style={{ color: theme.text.muted }}>
                    {f.total_songs} songs this week
                  </p>
                </div>
                <button
                  disabled={!!pendingActions[f.id]}
                  onClick={() => declineOrRemove(f.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium flex-shrink-0"
                  style={{
                    background: "transparent",
                    border: `1px solid ${theme.border.subtle}`,
                    color: theme.text.muted,
                    cursor: pendingActions[f.id] ? "default" : "pointer",
                    opacity: pendingActions[f.id] ? 0.5 : 1,
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!pendingActions[f.id]) {
                      e.currentTarget.style.background = "rgba(255,60,60,0.1)";
                      e.currentTarget.style.borderColor = "rgba(255,60,60,0.4)";
                      e.currentTarget.style.color = "#ff6060";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!pendingActions[f.id]) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.borderColor = theme.border.subtle;
                      e.currentTarget.style.color = theme.text.muted;
                    }
                  }}
                >
                  <XIcon /> {pendingActions[f.id] ? "Removing…" : "Remove"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
