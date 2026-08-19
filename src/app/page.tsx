"use client";

// React is provided by tnpm he Next.js runtime; allow this file to type-check when
// the workspace has not installed React's declarations yet.
// @ts-ignore
import { useState } from "react";

import {
  generateRoomId,
  saveName
} from "@/lib/meeting";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elementName: string]: Record<string, unknown>;
    }
  }
}

type InputChangeEvent = {
  currentTarget: {
    value: string;
  };
};

export default function HomePage() {
  const [name, setName] =
    useState("");

  const [roomId, setRoomId] =
    useState("");

  const createMeeting = () => {
    const cleanName =
      name.trim();

    if (!cleanName) {
      alert(
        "Please enter your name."
      );

      return;
    }

    saveName(cleanName);

    const newRoom =
      generateRoomId();

    window.location.href = `/meeting/${newRoom}`;
  };

  const joinMeeting = () => {
    const cleanName =
      name.trim();

    const cleanRoom =
      roomId.trim();

    if (!cleanName) {
      alert(
        "Please enter your name."
      );

      return;
    }

    if (!cleanRoom) {
      alert(
        "Please enter a meeting ID."
      );

      return;
    }

    saveName(cleanName);

    window.location.href = `/meeting/${cleanRoom}`;
  };

  return (
    <main className="home-page">
      <div className="home-shell">
        <section className="home-intro">
          <div className="brand-mark"><span aria-hidden="true">+</span></div>
          <p className="eyebrow">PRIVATE VIDEO ROOMS</p>
          <h1>Meet in the moment.</h1>
          <p className="intro-copy">Clear conversations, thoughtful controls, and a room that stays yours.</p>
          <div className="feature-row">
            <span><i className="status-dot" />End-to-end ready</span>
            <span>Up to 10 people</span>
            <span>HD adaptive video</span>
          </div>
        </section>

        <section className="home-card">
          <div className="form-heading">
            <span className="live-pill"><i className="status-dot" />LIVE</span>
            <h2>Start a room</h2>
            <p>Use your name to create a private meeting or join a room already in progress.</p>
          </div>

          <label htmlFor="name">Your name</label>
          <input id="name" value={name} onChange={(event: InputChangeEvent) => setName(event.currentTarget.value)} placeholder="e.g. Maya Chen" autoComplete="name" />

          <button className="primary-button" onClick={createMeeting}>
            <span aria-hidden="true">+</span> Create new meeting
          </button>

          <div className="divider"><span>OR JOIN WITH A ROOM ID</span></div>

          <label htmlFor="room-id">Room ID</label>
          <div className="join-row">
            <input id="room-id" value={roomId} onChange={(event: InputChangeEvent) => setRoomId(event.currentTarget.value)} placeholder="Paste an ID" />
            <button className="secondary-button" onClick={joinMeeting}>Join room <span aria-hidden="true">↗</span></button>
          </div>
          <small className="form-note">Your camera and microphone permissions are requested only after you enter the room.</small>
        </section>
      </div>
    </main>
  );
}