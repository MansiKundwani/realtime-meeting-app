require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const authRoutes = require("./routes/authRoutes");  
const app = express();
const meetingRoutes = require("./routes/meetingRoutes");

// Middleware
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/meeting", meetingRoutes);
let dbError = null;

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    dbError = null;
  })
  .catch((err) => {
    console.error("❌ Database Error:");
    console.error(err);
    dbError = err.message || err.toString();
  });

// Test Routes
app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "Frontend and Backend are connected!",
  });
});

app.get("/api/db-status", (req, res) => {
  res.json({
    uriDefined: !!process.env.MONGODB_URI,
    readyState: mongoose.connection.readyState,
    readyStateText: ["disconnected", "connected", "connecting", "disconnecting"][mongoose.connection.readyState],
    error: dbError
  });
});

// Serve static files from the React frontend app
app.use(express.static(path.join(__dirname, "../frontend/dist")));

// Anything that doesn't match API routes, serve index.html
app.get("*splat", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist", "index.html"));
});

// Start Server


const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Store active users
let users = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

socket.on("webrtc-offer", ({ offer, to }) => {
  socket.to(to).emit("webrtc-offer", {
    offer,
    from: socket.id,
  });
});

socket.on("webrtc-answer", ({ answer, to }) => {
  socket.to(to).emit("webrtc-answer", {
    answer,
    from: socket.id,
  });
});

socket.on("webrtc-ice-candidate", ({ candidate, to }) => {
  socket.to(to).emit("webrtc-ice-candidate", {
    candidate,
    from: socket.id,
  });
});
   // Join meeting room
  socket.on("join-room", ({ meetingId }) => {
  socket.join(meetingId);

  users[socket.id] = { socketId: socket.id, meetingId };

  const usersInRoom = Object.keys(users)
    .filter(id => id !== socket.id && users[id].meetingId === meetingId);

  socket.emit("all-users", usersInRoom);

  socket.to(meetingId).emit("user-joined", {
    socketId: socket.id,
  });
});


 ;
 
 
  // Chat message
 socket.on(
  "send-message",
  ({ meetingId, message, userId, username, timestamp }) => {
    io.to(meetingId).emit("receive-message", {
      message,
      userId,
      username,
      timestamp,
    });
  }
);
socket.on("draw", (data) => {
  socket.to(data.meetingId).emit("draw", data);
});

socket.on("clear-board", ({ meetingId }) => {
  socket.to(meetingId).emit("clear-board");
});
  // Disconnect
  socket.on("disconnect", () => {
    const user = users[socket.id];

    if (user) {
      socket.to(user.meetingId).emit("user-left", {
        userId: user.userId,
      });

      delete users[socket.id];
    }

    console.log("User disconnected:", socket.id);
  });
});

// Start Server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

