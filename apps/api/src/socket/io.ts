import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { config } from "../config/env";

let io: Server;

export function initializeSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: config.frontend.url,
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket: Socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Patient subscribes to their personal channel
    socket.on("subscribe:patient", (userId: string) => {
      socket.join(`patient:${userId}`);
      console.log(`[Socket] Patient ${userId} subscribed`);
    });

    // Patient/Staff subscribes to a queue entry
    socket.on("subscribe:queue", (queueEntryId: string) => {
      socket.join(`queue:${queueEntryId}`);
    });

    // Subscribe to a department's queue feed
    socket.on("subscribe:department", (departmentId: string) => {
      socket.join(`dept:${departmentId}`);
    });

    // Staff subscribes to their own feed
    socket.on("subscribe:staff", (staffProfileId: string) => {
      socket.join(`staff:${staffProfileId}`);
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
}
