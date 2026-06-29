const Meeting = require("../models/Meeting");
const User = require("../models/User");

// Generate random meeting ID
const generateMeetingId = () => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

// CREATE MEETING
const createMeeting = async (req, res) => {
  try {
    const hostId = req.user.id;

    const meeting = await Meeting.create({
      meetingId: generateMeetingId(),
      host: hostId,
      participants: [hostId],
    });

    res.status(201).json({
      message: "Meeting created successfully",
      meeting,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// JOIN MEETING
const joinMeeting = async (req, res) => {
  try {
    const { meetingId } = req.body;
    const userId = req.user.id;

    const meeting = await Meeting.findOne({ meetingId });

    if (!meeting) {
      return res.status(404).json({
        message: "Meeting not found",
      });
    }

    // Add user if not already in participants
    if (!meeting.participants.includes(userId)) {
      meeting.participants.push(userId);
      await meeting.save();
    }

    res.status(200).json({
      message: "Joined meeting successfully",
      meeting,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// GET MEETING DETAILS
const getMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;

    const meeting = await Meeting.findOne({ meetingId })
      .populate("host", "name email")
      .populate("participants", "name email");

    if (!meeting) {
      return res.status(404).json({
        message: "Meeting not found",
      });
    }

    res.status(200).json(meeting);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createMeeting,
  joinMeeting,
  getMeeting,
}; 