import cron from "node-cron";
import db from "../db.js";
import { syncUserPlays } from "../controllers/statsController.js";
import { refreshAccessToken } from "../utils/spotify.js";

function startCronJobs() {
  // hourly sync for all users
  cron.schedule("0 * * * *", async () => {
    console.log("Running hourly sync...");

    const { rows: users } = await db.query(
      "SELECT id, refresh_token FROM users WHERE refresh_token IS NOT NULL"
    );

    for (const user of users) {
      try {
        const access_token = await refreshAccessToken(user.refresh_token);
        await syncUserPlays(user.id, access_token);
        console.log(`Synced user ${user.id}`);
      } catch (err) {
        console.error(`Failed to sync user ${user.id}:`, err.message);
      }
    }
  });

  // weekly aggregation every monday midnight
  cron.schedule("0 0 * * 1", async () => {
    console.log("Running weekly aggregation...");
    try {
      await db.query(`
        INSERT INTO weekly_stats (user_id, week_start, total_songs, total_minutes, top_artist)
        SELECT
          user_id,
          date_trunc('week', played_at)::DATE as week_start,
          COUNT(*) as total_songs,
          SUM(duration_ms) / 60000 as total_minutes,
          (
            SELECT artist_name FROM plays p2
            WHERE p2.user_id = p.user_id
            AND date_trunc('week', p2.played_at) = date_trunc('week', p.played_at)
            GROUP BY artist_name
            ORDER BY COUNT(*) DESC
            LIMIT 1
          ) as top_artist
        FROM plays p
        WHERE played_at < date_trunc('week', NOW())
        GROUP BY user_id, date_trunc('week', played_at)
        ON CONFLICT (user_id, week_start) DO NOTHING
      `);

      await db.query(`
        DELETE FROM plays WHERE played_at < date_trunc('week', NOW())
      `);

      console.log("Weekly aggregation complete");
    } catch (err) {
      console.error("Weekly aggregation error:", err.message);
    }
  });
}

export { startCronJobs };