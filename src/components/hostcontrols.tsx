"use client";

import { Participant } from "@/lib/meeting";

interface HostControlsProps {
  participants: Participant[];
  isHost: boolean;
  onMute: (id: string) => void;
  onRemove: (id: string) => void;
  onCoHost: (id: string, value: boolean) => void;
  onEndMeeting: () => void;
}

export default function HostControls({
  participants,
  isHost,
  onMute,
  onRemove,
  onCoHost,
  onEndMeeting
}: HostControlsProps) {
  if (!isHost) {
    return null;
  }

  return (
    <div className="host-controls">
      <h3>Host Controls</h3>

      {participants
        .filter((participant) => !participant.isHost)
        .map((participant) => (
          <div
            className="host-participant"
            key={participant.id}
          >
            <span>{participant.name}</span>

            <div>
              <button
                title="Mute participant"
                onClick={() => onMute(participant.id)}
              >
                Mute
              </button>

              <button
                title="Co-host"
                onClick={() =>
                  onCoHost(
                    participant.id,
                    !participant.isCoHost
                  )
                }
              >
                Co-host
              </button>

              <button
                className="danger-icon"
                title="Remove participant"
                onClick={() =>
                  onRemove(participant.id)
                }
              >
                Remove
              </button>
            </div>
          </div>
        ))}

      <button
        className="end-meeting-btn"
        onClick={onEndMeeting}
      >
        End Meeting For Everyone
      </button>
    </div>
  );
}