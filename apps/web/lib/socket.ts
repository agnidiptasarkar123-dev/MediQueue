"use client";
import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5001";

let globalSocket: Socket | null = null;

export function getSocket(): Socket {
  if (!globalSocket) {
    globalSocket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
  }
  return globalSocket;
}

export function useSocket(
  events: Record<string, (data: unknown) => void>,
  rooms?: string[]
) {
  const socketRef = useRef<Socket | null>(null);

  const subscribe = useCallback(() => {
    const socket = getSocket();
    socketRef.current = socket;

    if (rooms) {
      for (const room of rooms) {
        const [type, id] = room.split(":");
        if (type && id) {
          socket.emit(`subscribe:${type}`, id);
        }
      }
    }

    for (const [event, handler] of Object.entries(events)) {
      socket.on(event, handler as (...args: unknown[]) => void);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    subscribe();

    return () => {
      const socket = socketRef.current;
      if (socket) {
        for (const event of Object.keys(events)) {
          socket.off(event);
        }
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
