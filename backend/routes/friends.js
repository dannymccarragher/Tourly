import express from "express";
import { sendFriendRequest, acceptFriendRequest, removeFriend, getFriends, getFriendRequests, searchUsers } from "../controllers/friendController.js";

const router = express.Router();

router.get("/search", searchUsers);
router.get("/requests", getFriendRequests);
router.get("/", getFriends);
router.post("/request/:userId", sendFriendRequest);
router.post("/accept/:userId", acceptFriendRequest);
router.delete("/:userId", removeFriend);

export default router;