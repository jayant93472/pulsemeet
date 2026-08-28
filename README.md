# PulseMeet

PulseMeet is a real-time video calling platform built with Next.js, WebRTC, and Socket.IO.

## Run locally

```powershell
cd src
npm install
npm run socket
```

In a second terminal:

```powershell
cd src
npm run dev
```

Open http://localhost:3000.

## Features

- One-to-one and group video rooms
- Microphone, camera, screen share, recording, and camera switching
- Participant list, in-call chat, emoji, and file sharing
- Host moderation, co-hosts, room locking, and participant limits

### Deployment

Deployed on Netlify. The Next.js app lives in `src/`, so `netlify.toml` sets `base = "src"` and builds with `npm run build`.
