import { io } from "socket.io-client";

const socketUrl = window.location.port === "5173"
  ? `http://${window.location.hostname}:5000`
  : window.location.origin;

const socket = io(socketUrl, {
  autoConnect: false,
});

export default socket;