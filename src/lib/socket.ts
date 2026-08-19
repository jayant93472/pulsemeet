// The dependency is supplied by the app's runtime, but may not be present in
// the current TypeScript project configuration.
// @ts-ignore -- keep this module usable until socket.io-client is installed.
import { io, Socket } from "socket.io-client";

export const socket: Socket = io("http://localhost:3001", {
  autoConnect: false,
  transports: ["websocket"]
});