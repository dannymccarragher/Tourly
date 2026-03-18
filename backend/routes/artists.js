import express from "express";
import { followArtist, unfollowArtist, getFollowedArtists } from "../controllers/artistController.js";

const router = express.Router();


router.get("/", getFollowedArtists);
router.post("/:spotifyId/follow", followArtist);
router.delete("/:spotifyId/unfollow", unfollowArtist);

export default router;