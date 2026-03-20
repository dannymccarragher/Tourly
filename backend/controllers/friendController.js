import db from "../db.js";

async function sendFriendRequest(req, res) {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
  
    const { userId } = req.params;
  
    try {
      // check if friendship already exists in either direction
      const existing = await db.query(
        `SELECT id FROM friendships
         WHERE (requester_id = $1 AND addressee_id = $2)
         OR (requester_id = $2 AND addressee_id = $1)`,
        [req.session.userId, userId]
      );
  
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: "Friend request already exists" });
      }
  
      await db.query(
        `INSERT INTO friendships (requester_id, addressee_id)
         VALUES ($1, $2)`,
        [req.session.userId, userId]
      );
  
      return res.json({ success: true });
    } catch (err) {
      console.error("Send friend request error:", err.message);
      return res.status(500).json({ error: "Failed to send friend request" });
    }
  }
  
  async function acceptFriendRequest(req, res) {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
  
    const { userId } = req.params;
  
    try {
      const result = await db.query(
        `UPDATE friendships SET status = 'accepted'
         WHERE requester_id = $1 AND addressee_id = $2 AND status = 'pending'
         RETURNING id`,
        [userId, req.session.userId]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Friend request not found" });
      }
  
      return res.json({ success: true });
    } catch (err) {
      console.error("Accept friend request error:", err.message);
      return res.status(500).json({ error: "Failed to accept friend request" });
    }
  }
  
  async function removeFriend(req, res) {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
  
    const { userId } = req.params;
  
    try {
      await db.query(
        `DELETE FROM friendships
         WHERE (requester_id = $1 AND addressee_id = $2)
         OR (requester_id = $2 AND addressee_id = $1)`,
        [req.session.userId, userId]
      );
  
      return res.json({ success: true });
    } catch (err) {
      console.error("Remove friend error:", err.message);
      return res.status(500).json({ error: "Failed to remove friend" });
    }
  }
  
  async function getFriends(req, res) {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
  
    try {
      const { rows } = await db.query(
        `SELECT
          u.id,
          u.display_name,
          u.avatar_url,
          COUNT(p.id) as total_songs,
          COALESCE(SUM(p.duration_ms) / 60000, 0) as total_minutes,
          (SELECT p2.artist_name FROM plays p2
            WHERE p2.user_id = u.id
            AND p2.played_at >= date_trunc('week', NOW())
            GROUP BY p2.artist_name
            ORDER BY COUNT(*) DESC
            LIMIT 1) as top_artist
         FROM friendships f
         JOIN users u ON (
           CASE
             WHEN f.requester_id = $1 THEN f.addressee_id
             ELSE f.requester_id
           END = u.id
         )
         LEFT JOIN plays p ON p.user_id = u.id
           AND p.played_at >= date_trunc('week', NOW())
         WHERE (f.requester_id = $1 OR f.addressee_id = $1)
         AND f.status = 'accepted'
         GROUP BY u.id
         ORDER BY total_minutes DESC`,
        [req.session.userId]
      );
  
      return res.json(rows);
    } catch (err) {
      console.error("Get friends error:", err.message);
      return res.status(500).json({ error: "Failed to fetch friends" });
    }
  }
  
  async function getFriendRequests(req, res) {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
  
    try {
      const { rows } = await db.query(
        `SELECT u.id, u.display_name, u.avatar_url, f.created_at
         FROM friendships f
         JOIN users u ON f.requester_id = u.id
         WHERE f.addressee_id = $1
         AND f.status = 'pending'
         ORDER BY f.created_at DESC`,
        [req.session.userId]
      );
  
      return res.json(rows);
    } catch (err) {
      console.error("Get friend requests error:", err.message);
      return res.status(500).json({ error: "Failed to fetch friend requests" });
    }
  }
  
  async function searchUsers(req, res) {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const q = (req.query.q ?? "").trim();
    if (!q) return res.json([]);

    try {
      const { rows } = await db.query(
        `SELECT u.id, u.display_name, u.avatar_url,
                f.status,
                CASE
                  WHEN f.requester_id = $1 THEN 'sent'
                  WHEN f.addressee_id = $1 THEN 'received'
                  ELSE NULL
                END as direction
         FROM users u
         LEFT JOIN friendships f ON (
           (f.requester_id = $1 AND f.addressee_id = u.id)
           OR (f.addressee_id = $1 AND f.requester_id = u.id)
         )
         WHERE u.id != $1
           AND u.display_name ILIKE $2
         ORDER BY u.display_name
         LIMIT 20`,
        [req.session.userId, `%${q}%`]
      );
      return res.json(rows);
    } catch (err) {
      console.error("Search users error:", err.message);
      return res.status(500).json({ error: "Failed to search users" });
    }
  }

  export { sendFriendRequest, acceptFriendRequest, removeFriend, getFriends, getFriendRequests, searchUsers };