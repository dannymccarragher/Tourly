"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  return `${diffDays} days ago`;
}

function Avatar({ src, name, size = 72 }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
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
        fontSize: size * 0.36,
      }}
    >
      {name?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

function StatCard({ label, value, accent = false }) {
  return (
    <div
      className="flex flex-col gap-1 p-4 rounded-2xl flex-1"
      style={{
        background: accent ? "rgba(162,89,255,0.1)" : theme.bg.elevated,
        border: `1px solid ${accent ? theme.accent.purple : theme.border.subtle}`,
      }}
    >
      <p className="text-xs uppercase tracking-widest" style={{ color: theme.text.muted }}>
        {label}
      </p>
      <p className="text-2xl font-bold truncate" style={{ color: accent ? theme.accent.purple : theme.text.primary }}>
        {value}
      </p>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h2
      className="text-xs uppercase tracking-widest font-semibold mb-3"
      style={{ color: theme.text.muted }}
    >
      {children}
    </h2>
  );
}

function Bar({ value, max }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div
      className="h-1 rounded-full overflow-hidden"
      style={{ background: theme.bg.highlight, width: 64, flexShrink: 0 }}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: theme.accent.purple }}
      />
    </div>
  );
}

export default function UserProfilePage() {
  const { userId } = useParams();
  const router = useRouter();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetch(`${API}/stats/user/${userId}`, { credentials: "include" })
      .then((r) => {
        if (!r.ok) return r.json().then((b) => Promise.reject(b?.error ?? `HTTP ${r.status}`));
        return r.json();
      })
      .then(setProfile)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: theme.text.muted }}>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <p style={{ color: theme.accent.purple }}>{error}</p>
        <button
          onClick={() => router.back()}
          style={{ color: theme.text.muted, fontSize: 14 }}
        >
          ← Go back
        </button>
      </div>
    );
  }

  if (!profile) return null;

  const { user, stats, rank, top_artists, top_songs, last_played_song } = profile;

  console.log(profile);
  const isEmpty = !stats || stats.total_songs === "0" || Number(stats.total_songs) === 0;

  const maxArtist = top_artists?.[0] ? Number(top_artists[0].play_count) : 1;
  const maxSong = top_songs?.[0] ? Number(top_songs[0].play_count) : 1;

  return (
    <div className="min-h-screen" style={{ background: theme.bg.base }}>
      {/* sticky top bar */}
      <div
        className="sticky top-0 z-10 flex items-center gap-3 px-6 py-4"
        style={{
          background: "rgba(13,13,13,0.85)",
          backdropFilter: "blur(12px)",
          borderBottom: `1px solid ${theme.border.subtle}`,
        }}
      >
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center rounded-full"
          style={{
            width: 34,
            height: 34,
            background: theme.bg.elevated,
            border: `1px solid ${theme.border.subtle}`,
            color: theme.text.secondary,
            cursor: "pointer",
            fontSize: 16,
            flexShrink: 0,
          }}
        >
          ←
        </button>
        <Avatar src={user.avatar_url} name={user.display_name} size={32} />
        <p className="font-semibold truncate" style={{ color: theme.text.primary }}>
          {user.display_name}
        </p>
        {rank && (
          <span
            className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ background: "rgba(162,89,255,0.15)", color: theme.accent.purple }}
          >
            #{rank} this week
          </span>
        )}
      </div>

      <div
        className="mx-auto px-6 py-8 flex flex-col gap-8"
        style={{ maxWidth: 680 }}
      >
        {/* hero header */}
        <div className="flex items-center gap-5">
          <Avatar src={user.avatar_url} name={user.display_name} size={80} />
          <div>
            <h1 className="text-3xl font-bold" style={{ color: theme.text.primary }}>
              {user.display_name}
            </h1>
            {rank && (
              <p className="text-sm mt-1" style={{ color: theme.text.muted }}>
                Ranked{" "}
                <span style={{ color: theme.accent.purple, fontWeight: 600 }}>
                  #{rank}
                </span>{" "}
                this week
              </p>
            )}
          </div>
        </div>

        {/* stat cards */}
        {isEmpty ? (
          <div
            className="rounded-2xl p-6 text-center"
            style={{ background: theme.bg.surface, border: `1px solid ${theme.border.subtle}` }}
          >
            <p style={{ color: theme.text.muted }}>No plays recorded this week yet.</p>
          </div>
        ) : (
          <div className="flex gap-3">
            <StatCard label="Songs" value={stats.total_songs} />
            <StatCard label="Minutes" value={Math.round(stats.total_minutes)} />
            <StatCard
              label="Last active"
              value={timeAgo(stats.last_played)}
              accent
            />
          </div>
        )}

        {/* last played song */}
        {last_played_song && (
          <section>
            <SectionTitle>Last Played</SectionTitle>
            <div
              className="flex items-center gap-4 p-4 rounded-2xl"
              style={{
                background: theme.bg.surface,
                border: `1px solid ${theme.border.subtle}`,
              }}
            >
              {last_played_song.image_url ? (
                <img
                  src={last_played_song.image_url}
                  alt={last_played_song.track_name}
                  className="rounded-lg object-cover flex-shrink-0"
                  style={{ width: 52, height: 52 }}
                />
              ) : (
                <div
                  className="rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    width: 52,
                    height: 52,
                    background: "rgba(162,89,255,0.15)",
                    color: theme.accent.purple,
                    fontSize: 22,
                  }}
                >
                  ♪
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate" style={{ color: theme.text.primary }}>
                  {last_played_song.track_name}
                </p>
                <p className="text-sm truncate" style={{ color: theme.text.muted }}>
                  {last_played_song.artist_name}
                </p>
              </div>
              <span className="text-sm flex-shrink-0" style={{ color: theme.text.muted }}>
                {timeAgo(last_played_song.played_at)}
              </span>
            </div>
          </section>
        )}

        {/* top artists */}
        {top_artists?.length > 0 && (
          <section>
            <SectionTitle>Top Artists This Week</SectionTitle>
            <div className="flex flex-col gap-2">
              {top_artists.map((artist, i) => (
                <div
                  key={artist.artist_name}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{
                    background: theme.bg.surface,
                    border: `1px solid ${theme.border.subtle}`,
                  }}
                >
                  <span
                    className="text-sm w-5 text-right flex-shrink-0"
                    style={{ color: theme.text.muted }}
                  >
                    {i + 1}
                  </span>

                  {artist.image_url ? (
                    <img
                      src={artist.image_url}
                      alt={artist.artist_name}
                      className="rounded-full object-cover flex-shrink-0"
                      style={{ width: 40, height: 40 }}
                    />
                  ) : (
                    <div
                      className="rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                      style={{
                        width: 40,
                        height: 40,
                        background: theme.bg.highlight,
                        color: theme.text.secondary,
                      }}
                    >
                      {artist.artist_name?.[0]?.toUpperCase()}
                    </div>
                  )}

                  <p
                    className="flex-1 text-sm font-medium truncate"
                    style={{ color: theme.text.primary }}
                  >
                    {artist.artist_name}
                  </p>

                  <Bar value={Number(artist.play_count)} max={maxArtist} />

                  <span
                    className="text-xs text-right flex-shrink-0"
                    style={{ color: theme.text.muted, minWidth: 52 }}
                  >
                    {artist.play_count} plays
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* top songs */}
        {top_songs?.length > 0 && (
          <section>
            <SectionTitle>Top Songs This Week</SectionTitle>
            <div className="flex flex-col gap-2">
              {top_songs.map((song, i) => (
                <div
                  key={`${song.track_name}-${i}`}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{
                    background: theme.bg.surface,
                    border: `1px solid ${theme.border.subtle}`,
                  }}
                >
                  <span
                    className="text-sm w-5 text-right flex-shrink-0"
                    style={{ color: theme.text.muted }}
                  >
                    {i + 1}
                  </span>

                  {song.image_url ? (
                    <img
                      src={song.image_url}
                      alt={song.track_name}
                      className="rounded-md object-cover flex-shrink-0"
                      style={{ width: 40, height: 40 }}
                    />
                  ) : (
                    <div
                      className="rounded-md flex items-center justify-center text-xs flex-shrink-0"
                      style={{
                        width: 40,
                        height: 40,
                        background: theme.bg.highlight,
                        color: theme.text.muted,
                      }}
                    >
                      ♪
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: theme.text.primary }}
                    >
                      {song.track_name}
                    </p>
                    <p className="text-xs truncate" style={{ color: theme.text.muted }}>
                      {song.artist_name}
                    </p>
                  </div>

                  <Bar value={Number(song.play_count)} max={maxSong} />

                  <span
                    className="text-xs text-right flex-shrink-0"
                    style={{ color: theme.text.muted, minWidth: 52 }}
                  >
                    {song.play_count} plays
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {isEmpty && !last_played_song && (
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: theme.bg.surface, border: `1px solid ${theme.border.subtle}` }}
          >
            <p style={{ color: theme.text.muted }}>Nothing to show yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
