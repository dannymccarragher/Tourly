import cron from "node-cron";
import db from "../db.js";
import { syncUserPlays } from "../controllers/statsController.js";
import { refreshAccessToken } from "../utils/spotify.js";

const BATCH_SIZE = 5;
const DELAY_BETWEEN_USERS = 500;
const DELAY_BETWEEN_BATCHES = 3000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function startCronJobs() {
  console.log(`[cron] Starting sync at ${new Date().toISOString()}`);

  const { rows: users } = await db.query(
    `SELECT id, refresh_token FROM users
     WHERE refresh_token IS NOT NULL`
  );

  console.log(`[cron] Syncing ${users.length} users`);

  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (user, index) => {
        await sleep(index * DELAY_BETWEEN_USERS);
        try {
          const access_token = await refreshAccessToken(user.refresh_token);
          const synced = await syncUserPlays(user.id, access_token);
          console.log(`[cron] User ${user.id}: synced ${synced} plays`);
        } catch (err) {
          console.error(`[cron] User ${user.id} failed:`, err.message);
        }
      })
    );

    if (i + BATCH_SIZE < users.length) {
      console.log(`[cron] Batch done, waiting ${DELAY_BETWEEN_BATCHES}ms...`);
      await sleep(DELAY_BETWEEN_BATCHES);
    }
  }

  console.log(`[cron] Sync complete at ${new Date().toISOString()}`);
}

export { startCronJobs };