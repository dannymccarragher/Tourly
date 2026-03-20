import express from "express";
import { syncFollowedArtistsRoute, followArtist, unfollowArtist, getFollowedArtists } from "../controllers/artistController.js";

const router = express.Router();

router.get("/", getFollowedArtists);
router.post("/sync", syncFollowedArtistsRoute);
router.post("/:spotifyId/follow", followArtist);
router.delete("/:spotifyId/unfollow", unfollowArtist);

export default router;
