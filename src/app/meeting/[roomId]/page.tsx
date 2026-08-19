"use client";

import { use, useEffect, useState } from "react";

import VideoRoom from "@/components/videoroom";
import { getStoredName } from "@/lib/meeting";

interface MeetingPageProps {
  params: Promise<{ roomId: string }>;
}

export default function MeetingPage({ params }: MeetingPageProps) {
  const [name, setName] = useState("");
  const { roomId } = use(params);

  useEffect(() => {
    setName(getStoredName());
  }, []);

  if (!name) {
    return null;
  }

  return <VideoRoom roomId={roomId} name={name} />;
}
