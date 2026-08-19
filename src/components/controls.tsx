"use client";

import type { SVGProps } from "react";

function BaseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      width={props.width ?? 18}
      height={props.height ?? 18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    />
  );
}

function MicIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 1 1-6 0V6a3 3 0 0 1 3-3Z" />
      <path d="M19 10a7 7 0 0 1-14 0" />
      <path d="M12 17v4" />
      <path d="M8 21h8" />
    </BaseIcon>
  );
}

function MicOffIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M9 9V6a3 3 0 0 1 5.12-2.12L9 9Z" />
      <path d="M14 9.5V6a2 2 0 0 0-4 0v2.3" />
      <path d="M5 10a7 7 0 0 0 12 5" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M2 2l20 20" />
    </BaseIcon>
  );
}

function CameraIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M15 10.5l4.5-2.5v9l-4.5-2.5" />
      <rect x="3" y="6" width="13" height="12" rx="2" />
    </BaseIcon>
  );
}

function CameraOffIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M2 2l20 20" />
      <path d="M16 16l4.5 2.5v-9l-4.5 2.5" />
      <path d="M3 6h2.5L9 8.5h6.5L16 6h4v12H6.5" />
      <path d="M3 8.5V18a2 2 0 0 0 2 2h11.5" />
    </BaseIcon>
  );
}

function SwitchCameraIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M3 12a9 9 0 0 1 15-6.7" />
      <path d="M21 12a9 9 0 0 1-15 6.7" />
      <path d="M8 7h7l-1-3" />
      <path d="M16 17H9l1 3" />
    </BaseIcon>
  );
}

function MonitorUpIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <rect x="3" y="4" width="14" height="10" rx="2" />
      <path d="M8 20h6" />
      <path d="M12 14v6" />
      <path d="M9 17l3-3 3 3" />
    </BaseIcon>
  );
}

function HandIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M8 11V5.5a1.5 1.5 0 0 1 3 0V11" />
      <path d="M11 11V4.5a1.5 1.5 0 0 1 3 0V11" />
      <path d="M14 11V6.5a1.5 1.5 0 0 1 3 0V13" />
      <path d="M5 11V8.5a1.5 1.5 0 0 1 3 0V11" />
      <path d="M8 11l-2 6.5A2.5 2.5 0 0 0 8.5 20h7a2.5 2.5 0 0 0 2.5-2.5L17 11" />
    </BaseIcon>
  );
}

function RecordIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="7" />
    </BaseIcon>
  );
}

function PhoneOffIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M3 6.5A2.5 2.5 0 0 1 5.5 4h2.7a1.5 1.5 0 0 1 1.48 1.2l.67 3.3a1.5 1.5 0 0 1-.82 1.66l-1.76.79a12 12 0 0 0 7.92 7.92l.79-1.76a1.5 1.5 0 0 1 1.66-.82l3.3.67A1.5 1.5 0 0 1 20 15.8v2.7A2.5 2.5 0 0 1 17.5 21h-1.1" />
      <path d="M2 2l20 20" />
    </BaseIcon>
  );
}

interface ControlsProps {
  micEnabled: boolean;
  cameraEnabled: boolean;
  handRaised: boolean;
  isScreenSharing: boolean;
  isRecording: boolean;

  onToggleMic: () => void;
  onToggleCamera: () => void;
  onSwitchCamera: () => void;
  onToggleScreenShare: () => void;
  onToggleHand: () => void;
  onToggleRecording: () => void;
  onLeave: () => void;
}

export default function Controls({
  micEnabled,
  cameraEnabled,
  handRaised,
  isScreenSharing,
  isRecording,
  onToggleMic,
  onToggleCamera,
  onSwitchCamera,
  onToggleScreenShare,
  onToggleHand,
  onToggleRecording,
  onLeave
}: ControlsProps) {
  return (
    <div className="controls">
      <button
        className={micEnabled ? "control-btn" : "control-btn danger"}
        onClick={onToggleMic}
      >
        {micEnabled ? <MicIcon /> : <MicOffIcon />}
        <span>{micEnabled ? "Mute" : "Unmute"}</span>
      </button>

      <button
        className={cameraEnabled ? "control-btn" : "control-btn danger"}
        onClick={onToggleCamera}
      >
        {cameraEnabled ? <CameraIcon /> : <CameraOffIcon />}
        <span>{cameraEnabled ? "Camera" : "Camera Off"}</span>
      </button>

      <button
        className="control-btn"
        onClick={onSwitchCamera}
      >
        <SwitchCameraIcon />
        <span>Switch</span>
      </button>

      <button
        className={isScreenSharing ? "control-btn active" : "control-btn"}
        onClick={onToggleScreenShare}
      >
        <MonitorUpIcon />
        <span>{isScreenSharing ? "Stop Share" : "Share"}</span>
      </button>

      <button
        className={handRaised ? "control-btn active" : "control-btn"}
        onClick={onToggleHand}
      >
        <HandIcon />
        <span>Raise Hand</span>
      </button>

      <button
        className={isRecording ? "control-btn recording" : "control-btn"}
        onClick={onToggleRecording}
      >
        <RecordIcon />
        <span>{isRecording ? "Stop Rec" : "Record"}</span>
      </button>

      <button
        className="control-btn danger leave-btn"
        onClick={onLeave}
      >
        <PhoneOffIcon />
        <span>Leave</span>
      </button>
    </div>
  );
}