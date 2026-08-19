"use client";

import { Participant } from "@/lib/meeting";

interface ParticipantListProps {
  participants: Participant[];
}

export default function ParticipantList({
  participants
}: ParticipantListProps) {
  return (
    <div className="participant-list">
      <h3>Participants ({participants.length})</h3>

      {participants.map((participant) => (
        <div
          className="participant-row"
          key={participant.id}
        >
          <div className="participant-info">
            <div className="small-avatar">
              {participant.name.charAt(0).toUpperCase()}
            </div>

            <span>{participant.name}</span>

            {participant.isHost && <span>👑</span>}

            {participant.isCoHost && <span>🛡️</span>}

            {participant.handRaised && <span>✋</span>}
          </div>

          <div className="participant-status">
            {participant.micEnabled ? (
              <span>🎤</span>
            ) : (
              <span>🔇</span>
            )}

            {participant.cameraEnabled ? (
              <span>📹</span>
            ) : (
              <span>📵</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}