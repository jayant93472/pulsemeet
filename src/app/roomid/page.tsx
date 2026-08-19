"use client";

import { useEffect, useState } from "react";

import VideoRoom from "@/components/videoroom";
import { getStoredName } from "@/lib/meeting";

export default function MeetingPage() {
  const [roomId, setRoomId] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    setRoomId(window.location.pathname.split("/").filter(Boolean).pop() ?? "");
    setName(getStoredName());
  }, []);

  if (!roomId || !name) {
    return null;
  }

  return (
    <VideoRoom roomId={roomId} name={name} />
  );
}