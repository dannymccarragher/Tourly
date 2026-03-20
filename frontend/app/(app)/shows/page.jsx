"use client";

import { useEffect, useState, useCallback } from "react";
import { theme } from "@/constants/theme";

const API = "http://127.0.0.1:5000";

function LocationIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return {
    month: d.toLocaleString("en-US", { month: "short" }).toUpperCase(),
    day: d.getDate(),
    full: d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "long",
      day: "numeric",
    }),
  };
}

function formatTime(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default function ShowsPage() {
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [radius, setRadius] = useState(50);
  const [locationStatus, setLocationStatus] = useState("idle"); // idle | loading | granted | denied

  const fetchShows = useCallback(
    async (latitude, longitude, r) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${API}/shows?lat=${latitude}&lng=${longitude}&radius=${r}`,
          { credentials: "include" }
        );
        if (!res.ok) throw new Error("Failed to fetch shows");
        const data = await res.json();
        setShows(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  function requestLocation() {
    if (!navigator.geolocation) {
      setLocationStatus("denied");
      return;
    }
    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLat(latitude);
        setLng(longitude);
        setLocationStatus("granted");
        fetchShows(latitude, longitude, radius);
      },
      () => setLocationStatus("denied")
    );
  }

  useEffect(() => {
    if (lat && lng) fetchShows(lat, lng, radius);
  }, [radius, lat, lng, fetchShows]);

  return (
    <div className="px-6 py-8" style={{ maxWidth: 820, margin: "0 auto" }}>
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-3xl font-bold mb-1"
          style={{ color: theme.text.primary, letterSpacing: "-0.5px" }}
        >
          Shows
        </h1>
        <p className="text-sm" style={{ color: theme.text.muted }}>
          Upcoming concerts for artists you follow
        </p>
      </div>

      {/* Location prompt */}
      {locationStatus !== "granted" && (
        <div
          className="rounded-2xl p-10 text-center mb-8"
          style={{
            background: theme.bg.surface,
            border: `1px solid ${theme.border.subtle}`,
          }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: theme.bg.elevated, color: theme.accent.green }}
          >
            <LocationIcon />
          </div>
          <h2 className="text-lg font-semibold mb-2" style={{ color: theme.text.primary }}>
            Find shows near you
          </h2>
          <p className="text-sm mb-6 mx-auto" style={{ color: theme.text.muted, maxWidth: 360 }}>
            Share your location to discover upcoming concerts for the artists you follow.
          </p>

          {locationStatus === "denied" ? (
            <p className="text-sm" style={{ color: theme.accent.purple }}>
              Location access was denied. Enable it in your browser settings and refresh.
            </p>
          ) : (
            <button
              onClick={requestLocation}
              disabled={locationStatus === "loading"}
              className="px-6 py-3 rounded-full font-semibold text-sm inline-flex items-center gap-2"
              style={{
                background: theme.accent.green,
                color: "#000",
                border: "none",
                cursor: locationStatus === "loading" ? "not-allowed" : "pointer",
                opacity: locationStatus === "loading" ? 0.6 : 1,
                transition: "opacity 0.15s",
              }}
            >
              <LocationIcon />
              {locationStatus === "loading" ? "Getting location…" : "Use my location"}
            </button>
          )}
        </div>
      )}

      {/* Radius picker */}
      {locationStatus === "granted" && (
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <span className="text-sm" style={{ color: theme.text.muted }}>
            Radius:
          </span>
          {[10, 25, 50, 100].map((r) => (
            <button
              key={r}
              onClick={() => setRadius(r)}
              className="px-4 py-1.5 rounded-full text-sm font-medium"
              style={{
                background: radius === r ? theme.accent.green : theme.bg.elevated,
                color: radius === r ? "#000" : theme.text.secondary,
                border: `1px solid ${radius === r ? "transparent" : theme.border.subtle}`,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {r} mi
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="py-16 text-center">
          <p style={{ color: theme.text.muted }}>Finding shows…</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div
          className="rounded-xl px-4 py-3 mb-6 text-sm"
          style={{
            background: "rgba(162,89,255,0.08)",
            border: `1px solid rgba(162,89,255,0.2)`,
            color: theme.accent.purple,
          }}
        >
          {error}
        </div>
      )}

      {/* Shows list */}
      {!loading && shows.length > 0 && (
        <div className="flex flex-col gap-3">
          {shows.map((show, i) => {
            const date = formatDate(show.date || show.localDate);
            const time = formatTime(show.date || show.localDate);
            return (
              <div
                key={show.id ?? i}
                className="flex items-center gap-4 p-4 rounded-2xl"
                style={{
                  background: theme.bg.surface,
                  border: `1px solid ${theme.border.subtle}`,
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = theme.border.default)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = theme.border.subtle)
                }
              >
                {/* Date block */}
                <div
                  className="flex-shrink-0 flex flex-col items-center justify-center rounded-xl"
                  style={{
                    background: theme.bg.elevated,
                    width: 52,
                    height: 56,
                    border: `1px solid ${theme.border.subtle}`,
                  }}
                >
                  {date ? (
                    <>
                      <span
                        className="text-xs font-semibold"
                        style={{ color: theme.accent.green }}
                      >
                        {date.month}
                      </span>
                      <span
                        className="text-xl font-bold leading-none"
                        style={{ color: theme.text.primary }}
                      >
                        {date.day}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs" style={{ color: theme.text.muted }}>
                      TBD
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p
                    className="font-semibold truncate"
                    style={{ color: theme.text.primary }}
                  >
                    {show.name}
                  </p>
                  <p
                    className="text-sm truncate mt-0.5"
                    style={{ color: theme.accent.green, fontWeight: 500 }}
                  >
                    {show.artist}
                  </p>
                  <p className="text-sm truncate mt-0.5" style={{ color: theme.text.muted }}>
                    {[show.venue, show.city, time].filter(Boolean).join(" · ")}
                  </p>
                </div>

                {/* Ticket link */}
                {show.url && (
                  <a
                    href={show.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold"
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
                    Tickets
                    <ExternalLinkIcon />
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!loading && locationStatus === "granted" && shows.length === 0 && !error && (
        <div
          className="rounded-2xl p-10 text-center"
          style={{
            background: theme.bg.surface,
            border: `1px solid ${theme.border.subtle}`,
          }}
        >
          <div className="text-4xl mb-4">🎸</div>
          <h2 className="font-semibold mb-2" style={{ color: theme.text.primary }}>
            No shows found nearby
          </h2>
          <p className="text-sm" style={{ color: theme.text.muted }}>
            No upcoming concerts within {radius} miles for your followed artists.
            Try a larger radius or follow more artists.
          </p>
        </div>
      )}
    </div>
  );
}
