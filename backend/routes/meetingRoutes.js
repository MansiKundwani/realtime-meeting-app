const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  createMeeting,
  joinMeeting,
  getMeeting,
} = require("../controllers/meetingController");

// CREATE MEETING (HOST ONLY)
router.post("/create", authMiddleware, createMeeting);

// JOIN MEETING
router.post("/join", authMiddleware, joinMeeting);

// GET MEETING DETAILS
router.get("/:meetingId", authMiddleware, getMeeting);

module.exports = router;