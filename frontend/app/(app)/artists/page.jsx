"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { theme } from "@/constants/theme";
import { API } from "../../lib/api";

function MapPinIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function UnfollowIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function ArtistsPage() {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unfollowing, setUnfollowing] = useState(null);

  async function fetchArtists() {
    const res = await fetch(`${API}/artists`, { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setArtists(Array.isArray(data) ? data : []);
    }
  }

  async function unfollow(spotifyId) {
    setUnfollowing(spotifyId);
    try {
      const res = await fetch(`${API}/artists/${spotifyId}/unfollow`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setArtists((prev) =>
          prev.filter((a) => a.artist_spotify_id !== spotifyId)
        );
      }
    } finally {
      setUnfollowing(null);
    }
  }

  useEffect(() => {
    fetchArtists().finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: theme.text.muted }}>Loading artists…</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-8" style={{ maxWidth: 820, margin: "0 auto" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-3xl font-bold mb-1"
            style={{ color: theme.text.primary, letterSpacing: "-0.5px" }}
          >
            Artists
          </h1>
          <p className="text-sm" style={{ color: theme.text.muted }}>
            {artists.length === 0
              ? "No artists followed yet"
              : `${artists.length} ${artists.length === 1 ? "artist" : "artists"} followed`}
          </p>
        </div>

        {artists.length > 0 && (
          <Link
            href="/shows"
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
            style={{
              background: "rgba(30,215,96,0.1)",
              color: theme.accent.green,
              border: "1px solid rgba(30,215,96,0.2)",
              textDecoration: "none",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(30,215,96,0.18)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(30,215,96,0.1)")
            }
          >
            <MapPinIcon />
            Find shows
          </Link>
        )}
      </div>

      {/* Empty state */}
      {artists.length === 0 ? (
        <div
          className="rounded-2xl p-12 text-center"
          style={{
            background: theme.bg.surface,
            border: `1px solid ${theme.border.subtle}`,
          }}
        >
          <div className="text-5xl mb-5">🎵</div>
          <h2
            className="text-lg font-semibold mb-2"
            style={{ color: theme.text.primary }}
          >
            No artists followed yet
          </h2>
          <p
            className="text-sm mb-6"
            style={{ color: theme.text.muted, maxWidth: 320, margin: "0 auto 1.5rem" }}
          >
            Artists you follow will appear here and be used to find nearby concerts.
          </p>
          <Link
            href="/shows"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold"
            style={{
              background: theme.accent.green,
              color: "#000",
              textDecoration: "none",
            }}
          >
            Browse shows anyway
          </Link>
        </div>
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: `1px solid ${theme.border.subtle}` }}
        >
          {artists.map((artist, i) => (
            <div
              key={artist.artist_spotify_id}
              className="flex items-center gap-4 px-5 py-4"
              style={{
                background: theme.bg.surface,
                borderTop: i > 0 ? `1px solid ${theme.border.subtle}` : "none",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = theme.bg.elevated)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = theme.bg.surface)
              }
            >
              {/* Artist image */}
              {artist.artist_image_url ? (
                <img
                  src={artist.artist_image_url}
                  alt={artist.artist_name}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
                  style={{ background: theme.bg.highlight, color: theme.text.secondary }}
                >
                  {artist.artist_name?.[0]?.toUpperCase()}
                </div>
              )}

              {/* Name + date */}
              <div className="flex-1 min-w-0">
                <p
                  className="font-medium truncate"
                  style={{ color: theme.text.primary }}
                >
                  {artist.artist_name}
                </p>
                {artist.followed_at && (
                  <p className="text-xs mt-0.5" style={{ color: theme.text.muted }}>
                    Followed{" "}
                    {new Date(artist.followed_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>

              {/* Unfollow */}
              <button
                onClick={() => unfollow(artist.artist_spotify_id)}
                disabled={unfollowing === artist.artist_spotify_id}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0"
                style={{
                  background: "transparent",
                  color: theme.text.muted,
                  border: `1px solid ${theme.border.subtle}`,
                  cursor:
                    unfollowing === artist.artist_spotify_id
                      ? "not-allowed"
                      : "pointer",
                  opacity: unfollowing === artist.artist_spotify_id ? 0.4 : 1,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (unfollowing !== artist.artist_spotify_id) {
                    e.currentTarget.style.background = "rgba(239,68,68,0.1)";
                    e.currentTarget.style.color = "#ef4444";
                    e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = theme.text.muted;
                  e.currentTarget.style.borderColor = theme.border.subtle;
                }}
              >
                <UnfollowIcon />
                {unfollowing === artist.artist_spotify_id ? "…" : "Unfollow"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
