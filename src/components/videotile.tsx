"use client";

import type { ReactNode } from "react";
import { Participant } from "@/lib/meeting";

function Icon({ children, size = 17 }: { children: ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

const Mic = ({ size = 17 }: { size?: number }) => <Icon size={size}><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10a7 7 0 0 0 14 0M12 19v3M8 22h8" /></Icon>;
const MicOff = ({ size = 17 }: { size?: number }) => <Icon size={size}><path d="m2 2 20 20M9 9v3a3 3 0 0 0 5 2.2M15 9V5a3 3 0 0 0-5-2.2M5 10a7 7 0 0 0 11.4 5.4M19 10v2M12 19v3M8 22h8" /></Icon>;
const Video = ({ size = 17 }: { size?: number }) => <Icon size={size}><path d="M15 10 21 7v10l-6-3M3 6h12v12H3z" /></Icon>;
const VideoOff = ({ size = 17 }: { size?: number }) => <Icon size={size}><path d="m2 2 20 20M15 10l6-3v10l-6-3M3 6h12v12H3z" /></Icon>;
const UserRound = ({ size = 48 }: { size?: number }) => <Icon size={size}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Icon>;

interface VideoTileProps {
  participant: Participant;
  stream?: MediaStream;
  isLocal?: boolean;
  connectionState?: string;
}

export default function VideoTile({
  participant,
  stream,
  isLocal = false,
  connectionState
}: VideoTileProps) {
  return (
    <div className="video-tile">
      {stream && participant.cameraEnabled ? (
        <video
          autoPlay
          playsInline
          muted={isLocal}
          ref={(video) => {
            if (video) {
              video.srcObject = stream;
            }
          }}
        />
      ) : (
        <div className="avatar">
          <UserRound size={48} />
          <span>{participant.name.charAt(0).toUpperCase()}</span>
        </div>
      )}

      <div className="video-overlay">
        <div className="participant-name">
          {participant.name}

          {participant.isHost && " 👑"}

          {participant.isCoHost && " ⭐"}

          {participant.handRaised && " ✋"}
        </div>

        <div className="status-icons">
          {participant.micEnabled ? (
            <Mic size={17} />
          ) : (
            <MicOff size={17} />
          )}

          {participant.cameraEnabled ? (
            <Video size={17} />
          ) : (
            <VideoOff size={17} />
          )}

          {connectionState && (
            <span className="connection-state">
              {connectionState}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}