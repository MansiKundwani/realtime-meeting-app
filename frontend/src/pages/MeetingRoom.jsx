import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import socket from "../socket";
import "../styles/MeetingRoom.css";
function RemoteVideo({ stream }) {
  const videoRef = useRef();

  
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className="remote-video"
    />
  );
}
const MeetingRoom = () => {
  const localVideoRef = useRef();
  const chatEndRef = useRef();
  const usernameRef = useRef("");

const canvasRef = useRef(null);
const [showWhiteboard, setShowWhiteboard] = useState(false);
const [drawing, setDrawing] = useState(false);
const [isErasing, setIsErasing] = useState(false);

  const [remoteStreams, setRemoteStreams] = useState({});
  const peersRef = useRef({});
  const localStreamRef = useRef();

  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [showChat, setShowChat] = useState(false);
const [username, setUsername] = useState("");
  const [notification, setNotification] = useState("");


  const navigate = useNavigate();
  const { meetingId } = useParams();

  // ================= AUTO SCROLL =================
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ================= INIT =================
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      socket.on("draw", ({ x, y, prevX, prevY }) => {
  const canvas = canvasRef.current;
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  ctx.beginPath();
  ctx.moveTo(prevX, prevY);
  ctx.lineTo(x, y);
  ctx.stroke();
});

socket.on("clear-board", () => {
  const canvas = canvasRef.current;
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (!mounted) return;

        localStreamRef.current = stream;
if (
  localVideoRef.current &&
  localVideoRef.current.srcObject !== stream
) {
  localVideoRef.current.srcObject = stream;
}
const name = prompt("Enter your name") || "Guest";
setUsername(name);
usernameRef.current = name;

        socket.connect();

        socket.on("connect", () => {
          socket.emit("join-room", { meetingId });
        });

        // USERS IN ROOM
        socket.on("all-users", (users) => {
          if (!users?.length) return;

          setTimeout(() => {
            users.forEach((id) => {
              if (id !== socket.id) {
                createOffer(id);
              }
            });
          }, 400);
        });

        socket.on("user-joined", ({ socketId }) => {
          console.log("user joined:", socketId);
        });

        // OFFER
        socket.on("webrtc-offer", async ({ offer, from }) => {
          await createAnswer(offer, from);
        });

        // ANSWER
        socket.on("webrtc-answer", async ({ answer, from }) => {
          const pc = peersRef.current[from];
          if (pc) await pc.setRemoteDescription(answer);
        });

        // ICE
        socket.on("webrtc-ice-candidate", async ({ candidate, from }) => {
          const pc = peersRef.current[from];
          if (pc && candidate) {
            await pc.addIceCandidate(candidate);
          }
        });

        // CHAT
        socket.on("receive-message", (data) => {
  console.log("MESSAGE RECEIVED:", data);
  setMessages((prev) => [...prev, data]);
});
      } catch (err) {
        console.error(err);
      }
    };

    init();

    return () => {
      mounted = false;

      socket.off("connect");
      socket.off("all-users");
      socket.off("user-joined");
      socket.off("webrtc-offer");
      socket.off("webrtc-answer");
      socket.off("webrtc-ice-candidate");
      socket.off("receive-message");
socket.off("draw");
socket.off("clear-board");
      socket.disconnect();
      
    };
  }, []);

  // ================= PEER =================
  const createPeer = (id) => {
    if (peersRef.current[id]) return peersRef.current[id];

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    localStreamRef.current.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current);
    });

    pc.ontrack = (event) => {
      const stream = event.streams[0];

      setRemoteStreams((prev) => ({
        ...prev,
        [id]: stream,
      }));
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("webrtc-ice-candidate", {
          candidate: event.candidate,
          to: id,
        });
      }
    };

    peersRef.current[id] = pc;
    return pc;
  };

  // ================= OFFER =================
  const createOffer = async (id) => {
    const pc = createPeer(id);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit("webrtc-offer", {
      offer,
      to: id,
    });
  };

  // ================= ANSWER =================
  const createAnswer = async (offer, id) => {
    const pc = createPeer(id);

    await pc.setRemoteDescription(offer);

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit("webrtc-answer", {
      answer,
      to: id,
    });
  };

  // ================= CONTROLS =================
  const toggleMute = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;

    track.enabled = !track.enabled;
    setIsMuted(!track.enabled);
  };

  const toggleCamera = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;

    track.enabled = !track.enabled;
    setIsCameraOff(!track.enabled);
  };

  const leaveMeeting = () => {
    setRemoteStreams({});

    localStreamRef.current?.getTracks().forEach((t) => t.stop());

    Object.values(peersRef.current).forEach((p) => p.close());
    peersRef.current = {};

    socket.disconnect();

    navigate("/dashboard");
  };

  // ================= CHAT =================
  const sendMessage = () => {
    if (!currentMessage.trim()) return;

   socket.emit("send-message", {
  meetingId,
  message: currentMessage,
  userId: socket.id,
  username: usernameRef.current,
  timestamp: new Date().toLocaleTimeString(),
});
    setCurrentMessage("");
  };
  
useEffect(() => {
  if (messages.length === 0) return;

  const lastMsg = messages[messages.length - 1];

  if (lastMsg.userId !== socket.id) {
    setNotification(`New message: ${lastMsg.message}`);

    setTimeout(() => {
      setNotification("");
    }, 3000);
  }
}, [messages]);

const shareScreen = async () => {
  try {
    const screenStream =
      await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

    const screenTrack =
      screenStream.getVideoTracks()[0];

    Object.values(peersRef.current).forEach((pc) => {
      const sender = pc
        .getSenders()
        .find(
          (s) =>
            s.track &&
            s.track.kind === "video"
        );

      if (sender) {
        sender.replaceTrack(screenTrack);
      }
    });

    if (localVideoRef.current) {
      localVideoRef.current.srcObject =
        screenStream;
    }

    screenTrack.onended = () => {
      const cameraTrack =
        localStreamRef.current.getVideoTracks()[0];

      Object.values(peersRef.current).forEach(
        (pc) => {
          const sender = pc
            .getSenders()
            .find(
              (s) =>
                s.track &&
                s.track.kind === "video"
            );

          if (sender) {
            sender.replaceTrack(cameraTrack);
          }
        }
      );

      if (localVideoRef.current) {
        localVideoRef.current.srcObject =
          localStreamRef.current;
      }
    };
  } catch (err) {
    console.error("Screen share error:", err);
  }
};

const startDrawing = (e) => {
  setDrawing(true);

  const canvas = canvasRef.current;
  const rect = canvas.getBoundingClientRect();

  window.lastX = e.clientX - rect.left;
  window.lastY = e.clientY - rect.top;
};
const stopDrawing = () => {
  setDrawing(false);
  window.lastX = null;
  window.lastY = null;
};

const draw = (e) => {
  if (!drawing) return;

  const canvas = canvasRef.current;
  const ctx = canvas.getContext("2d");

  const rect = canvas.getBoundingClientRect();

  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (
  window.lastX === null ||
  window.lastX === undefined
)

  ctx.beginPath();

ctx.strokeStyle = isErasing ? "white" : "black";
ctx.lineWidth = isErasing ? 20 : 3;
ctx.lineCap = "round";

ctx.moveTo(window.lastX, window.lastY);
ctx.lineTo(x, y);
ctx.stroke();

  socket.emit("draw", {
  meetingId,
  x,
  y,
  prevX: window.lastX,
  prevY: window.lastY,
  isErasing,
});
socket.on(
  "draw",
  ({ x, y, prevX, prevY, isErasing }) => {
    const ctx = canvas.getContext("2d");
     if (isErasing) {
  ctx.globalCompositeOperation = "destination-out";
  ctx.lineWidth = 20;
} else {
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = "black";
  ctx.lineWidth = 3;
}

    ctx.lineCap = "round";

    ctx.beginPath();
  ctx.moveTo(window.lastX, window.lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
);

  window.lastX = x;
  window.lastY = y;
};
  // ================= UI =================
 // ================= UI =================
return (
  <div className="meeting-container">

    {notification && (
      <div className="notification-popup">
        {notification}
      </div>
    )}

   
      <div className="meeting-header">
        <h2>🎥 Meeting Room</h2>
        <p>Meeting ID: {meetingId}</p>
      </div>

      <div className="main-layout">

        {/* VIDEO SECTION */}
        <div className="video-area">

          <div className="remote-grid">
            {Object.entries(remoteStreams).map(([id, stream]) => (
  <RemoteVideo
    key={id}
    stream={stream}
  />
))}
          </div>

          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="local-video"
          />
        </div>

        {/* CHAT PANEL */}
        {showChat && (
          <div className="chat-panel">

            <h3>Chat</h3>

            <div className="chat-messages">
           {messages.map((msg, i) => (
  <div key={i}>
    <strong>
      {msg.userId === socket.id
        ? `You (${usernameRef.current})`
        : msg.username || "Participant"}
    </strong>
    : {msg.message}
  </div>
))}
              <div ref={chatEndRef} />
            </div>

            <div className="chat-input">
              <input
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                placeholder="Type..."
              />

              <button onClick={sendMessage}>Send</button>
            </div>

          </div>
        )}

      </div>
{showWhiteboard && (
  <div className="whiteboard-overlay">
    <div className="whiteboard-container">

      <button
        className="close-whiteboard"
        onClick={() => setShowWhiteboard(false)}
      >
        ✖
        <button
  className="eraser-btn"
  onClick={() => setIsErasing(!isErasing)}
>
  {isErasing ? "🖊 Pen" : "🧽 Eraser"}
</button>
      </button>

      <canvas
        ref={canvasRef}
        width={900}
        height={500}
        onMouseDown={startDrawing}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onMouseMove={draw}
        className="whiteboard"
      />

      <button
        className="clear-board-btn"
        onClick={() => {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d");

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          socket.emit("clear-board", {
            meetingId,
          });
        }}
      >
        🗑 Clear Board
      </button>
      

    </div>
  </div>
)}
      {/* CONTROLS */}
      <div className="controls">

        <button onClick={toggleMute}>
          {isMuted ? "🎤 Unmute" : "🎤 Mute"}
        </button>

        <button onClick={toggleCamera}>
          {isCameraOff ? "📷 Camera On" : "📷 Camera Off"}
        </button>

        <button onClick={() => setShowChat(!showChat)}>
          💬 Chat
        </button>
        <button onClick={shareScreen}>
  🖥️ Share Screen
</button>
<button onClick={() => setShowWhiteboard(!showWhiteboard)}>
  🎨 Whiteboard
</button>

        <button onClick={leaveMeeting}>
          🚪 Leave
        </button>

      </div>

    </div>
  );
};

export default MeetingRoom;