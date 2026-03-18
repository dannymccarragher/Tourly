import axios from "axios";
import db from "../db.js";

import { refreshAccessToken } from "../utils/spotify.js";

// shared — used by route and cron
export async function syncUserPlays(userId, access_token) {
  const lastPlay = await db.query(
    "SELECT MAX(played_at) as last FROM plays WHERE user_id = $1",
    [userId]
  );

  const after = lastPlay.rows[0].last
    ? new Date(lastPlay.rows[0].last).getTime()
    : null;

  const url = new URL("https://api.spotify.com/v1/me/player/recently-played");
  url.searchParams.set("limit", "50");
  if (after) url.searchParams.set("after", after);

  const spotifyRes = await axios.get(url.toString(), {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  const items = spotifyRes.data.items;

  for (const item of items) {
    await db.query(
      `INSERT INTO plays (user_id, track_id, track_name, artist_name, duration_ms, played_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, played_at) DO NOTHING`,
      [
        userId,
        item.track.id,
        item.track.name,
        item.track.artists[0].name,
        item.track.duration_ms,
        new Date(item.played_at),
      ]
    );
  }

  return items.length;
}

// route handler
async function syncRecentlyPlayed(req, res) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const user = await db.query(
      "SELECT refresh_token FROM users WHERE id = $1",
      [req.session.userId]
    );

    const access_token = await refreshAccessToken(user.rows[0].refresh_token);
    req.session.access_token = access_token;

    const synced = await syncUserPlays(req.session.userId, access_token);
    return res.json({ synced });
  } catch (err) {
    console.error("Sync error:", err.message);
    return res.status(500).json({ error: "Sync failed" });
  }
}

  async function getStats(req, res) {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
  
    try {
      const { rows } = await db.query(
        `SELECT
          COUNT(*) as total_songs,
          SUM(duration_ms) / 60000 as total_minutes,
          MAX(played_at) as last_played,
          (SELECT artist_name FROM plays
            WHERE user_id = $1
            AND played_at >= date_trunc('week', NOW())
            GROUP BY artist_name
            ORDER BY COUNT(*) DESC
            LIMIT 1) as top_artist
         FROM plays
         WHERE user_id = $1
         AND played_at >= date_trunc('week', NOW())`,
        [req.session.userId]
      );
  
      return res.json(rows[0]);
    } catch (err) {
      console.error("Stats error:", err.message);
      return res.status(500).json({ error: "Failed to fetch stats" });
    }
  }

  async function getLeaderboard(req, res) {
    try {
      const { rows } = await db.query(
        `SELECT
          u.id,
          u.display_name,
          u.avatar_url,
          COUNT(p.id) as total_songs,
          SUM(p.duration_ms) / 60000 as total_minutes,
          (SELECT p2.artist_name FROM plays p2
            WHERE p2.user_id = u.id
            AND p2.played_at >= date_trunc('week', NOW())
            GROUP BY p2.artist_name
            ORDER BY COUNT(*) DESC
            LIMIT 1) as top_artist
         FROM users u
         LEFT JOIN plays p ON p.user_id = u.id
           AND p.played_at >= date_trunc('week', NOW())
         GROUP BY u.id
         ORDER BY total_minutes DESC`,
      );
  
      return res.json(rows);
    } catch (err) {
      console.error("Leaderboard error:", err.message);
      return res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  }

  export { syncRecentlyPlayed, getStats, getLeaderboard };