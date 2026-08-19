"use client";

import VideoTile from "./videotile";
import { Fragment } from "react";
import { Participant } from "@/lib/meeting";

interface VideoGridProps {
  participants: Participant[];
  streams: Record<string, MediaStream>;
  localStream?: MediaStream | null;
  localParticipant: Participant;
  connectionStates: Record<string, string>;
}

export default function VideoGrid({
  participants,
  streams,
  localStream,
  localParticipant,
  connectionStates
}: VideoGridProps) {
  const allParticipants = [
    localParticipant,
    ...participants.filter(
      (participant) => participant.id !== localParticipant.id
    )
  ];

  return (
    <div
      className="video-grid"
      style={{
        gridTemplateColumns:
          allParticipants.length <= 1
            ? "1fr"
            : allParticipants.length <= 4
              ? "repeat(2, 1fr)"
              : "repeat(3, 1fr)"
      }}
    >
      {allParticipants.map((participant) => (
        <Fragment key={participant.id}>
          <VideoTile
            participant={participant}
            stream={
              participant.id === localParticipant.id
                ? localStream || undefined
                : streams[participant.id]
            }
            isLocal={participant.id === localParticipant.id}
            connectionState={connectionStates[participant.id]}
          />
        </Fragment>
      ))}
    </div>
  );
}