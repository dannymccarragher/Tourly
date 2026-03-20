import axios from "axios";
import db from "../db.js";
import { refreshAccessToken } from "../utils/spotify.js";

// Fetches all followed artists from Spotify and upserts them into the follows table.
// Uses cursor-based pagination to handle accounts following more than 50 artists.
export async function syncFollowedArtists(userId, access_token) {
  let after = null;
  let total = 0;

  do {
    const params = { type: "artist", limit: 50 };
    if (after) params.after = after;

    const { data } = await axios.get("https://api.spotify.com/v1/me/following", {
      headers: { Authorization: `Bearer ${access_token}` },
      params,
    });

    const { items, cursors, next } = data.artists;

    for (const artist of items) {
      await db.query(
        `INSERT INTO follows (user_id, artist_spotify_id, artist_name, artist_image_url)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, artist_spotify_id) DO UPDATE
           SET artist_name = EXCLUDED.artist_name,
               artist_image_url = EXCLUDED.artist_image_url`,
        [
          userId,
          artist.id,
          artist.name,
          artist.images?.[0]?.url ?? null,
        ]
      );
    }

    total += items.length;
    after = next ? cursors?.after : null;
  } while (after);

  return total;
}

async function syncFollowedArtistsRoute(req, res) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const { rows } = await db.query(
      "SELECT refresh_token FROM users WHERE id = $1",
      [req.session.userId]
    );

    const access_token = await refreshAccessToken(rows[0].refresh_token);
    req.session.access_token = access_token;

    const synced = await syncFollowedArtists(req.session.userId, access_token);
    return res.json({ synced });
  } catch (err) {
    console.error("Sync follows error:", err.message);
    return res.status(500).json({ error: "Failed to sync followed artists" });
  }
}

async function getFollowedArtists(req, res) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const { rows } = await db.query(
      "SELECT * FROM follows WHERE user_id = $1 ORDER BY followed_at DESC",
      [req.session.userId]
    );
    return res.json(rows);
  } catch (err) {
    console.error("Get artists error:", err.message);
    return res.status(500).json({ error: "Failed to fetch artists" });
  }
}

async function followArtist(req, res) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { spotifyId } = req.params;
  const { name, imageUrl } = req.body;

  try {
    await db.query(
      `INSERT INTO follows (user_id, artist_spotify_id, artist_name, artist_image_url)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, artist_spotify_id) DO NOTHING`,
      [req.session.userId, spotifyId, name, imageUrl]
    );
    return res.json({ success: true });
  } catch (err) {
    console.error("Follow error:", err.message);
    return res.status(500).json({ error: "Failed to follow artist" });
  }
}

async function unfollowArtist(req, res) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { spotifyId } = req.params;

  try {
    await db.query(
      "DELETE FROM follows WHERE user_id = $1 AND artist_spotify_id = $2",
      [req.session.userId, spotifyId]
    );
    return res.json({ success: true });
  } catch (err) {
    console.error("Unfollow error:", err.message);
    return res.status(500).json({ error: "Failed to unfollow artist" });
  }
}

export { syncFollowedArtistsRoute, getFollowedArtists, followArtist, unfollowArtist };
