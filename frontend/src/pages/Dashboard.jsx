import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();
  const [meetingId, setMeetingId] = useState("");

  const createMeeting = () => {
    const newMeetingId = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

    navigate(`/meeting/${newMeetingId}`);
  };

  const joinMeeting = () => {
    if (!meetingId.trim()) {
      alert("Please enter a Meeting ID");
      return;
    }

    navigate(`/meeting/${meetingId}`);
  };

  return (
    <div
      style={{
        textAlign: "center",
        marginTop: "100px",
      }}
    >
      <h1>🎥 Real-Time Meeting Platform</h1>

      <input
        type="text"
        placeholder="Enter Meeting ID"
        value={meetingId}
        onChange={(e) => setMeetingId(e.target.value)}
        style={{
          padding: "12px",
          width: "250px",
          marginTop: "20px",
        }}
      />

      <br />

      <button
        onClick={joinMeeting}
        style={{
          padding: "12px 25px",
          marginTop: "20px",
          marginRight: "10px",
          cursor: "pointer",
        }}
      >
        Join Meeting
      </button>

      <button
        onClick={createMeeting}
        style={{
          padding: "12px 25px",
          marginTop: "20px",
          cursor: "pointer",
        }}
      >
        Create New Meeting
      </button>
    </div>
  );
}

export default Dashboard;