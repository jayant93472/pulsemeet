export interface Participant {
  id: string;
  name: string;
  micEnabled: boolean;
  cameraEnabled: boolean;
  handRaised: boolean;
  isHost: boolean;
  isCoHost: boolean;
}

export interface ChatMessage {
  id: string;
  text: string;
  senderId?: string;
  senderName: string;
  timestamp: number;
  fileName?: string;
  fileData?: string;
}

export function generateRoomId(length = 8): string {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  let result = "";

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

export function getStoredName(): string {
  if (typeof window === "undefined") {
    return "Guest";
  }

  return localStorage.getItem("pulsemeet-name") || "Guest";
}

export function saveName(name: string): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem("pulsemeet-name", name);
}