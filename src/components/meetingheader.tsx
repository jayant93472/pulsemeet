"use client";

import type { ReactNode } from "react";

type IconProps = { size?: number; children?: ReactNode };

const Icon = ({ size = 17, children }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const Copy = (props: IconProps) => (
  <Icon {...props}>
    <rect width="14" height="14" x="8" y="8" rx="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </Icon>
);

const Lock = (props: IconProps) => (
  <Icon {...props}>
    <rect width="18" height="11" x="3" y="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </Icon>
);

const Unlock = (props: IconProps) => (
  <Icon {...props}>
    <rect width="18" height="11" x="3" y="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 9.9-1" />
  </Icon>
);

const Users = (props: IconProps) => (
  <Icon {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </Icon>
);

interface MeetingHeaderProps {
  roomId: string;
  duration: string;
  participantCount: number;
  locked: boolean;
  onToggleLock?: () => void;
  isHost: boolean;
}

export default function MeetingHeader({
  roomId,
  duration,
  participantCount,
  locked,
  onToggleLock,
  isHost
}: MeetingHeaderProps) {
  const copyRoom = async () => {
    await navigator.clipboard.writeText(
      window.location.href
    );

    alert("Meeting link copied!");
  };

  return (
    <header className="meeting-header">
      <div>
        <h1>PulseMeet</h1>

        <span className="room-id">
          Room: {roomId}
        </span>
      </div>

      <div className="meeting-info">
        <span>
          <Users size={17} />
          {participantCount}
        </span>

        <span>
          ⏱ {duration}
        </span>

        {locked && (
          <span>
            <Lock size={16} />
            Locked
          </span>
        )}
      </div>

      <div className="header-actions">
        <button onClick={copyRoom}>
          <Copy size={17} />
          Copy Link
        </button>

        {isHost && onToggleLock && (
          <button onClick={onToggleLock}>
            {locked ? (
              <>
                <Unlock size={17} />
                Unlock
              </>
            ) : (
              <>
                <Lock size={17} />
                Lock
              </>
            )}
          </button>
        )}
      </div>
    </header>
  );
}