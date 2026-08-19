"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";

import { socket } from "@/lib/socket";

import {
  ChatMessage,
  Participant,
  saveName
} from "@/lib/meeting";

import {
  createPeerConnection,
  createOffer,
  createAnswer
} from "@/lib/webrtc";

import VideoGrid from "./videogrid";
import Controls from "./controls";
import ParticipantList from "./participantlist";
import Chat from "./chat";
import MeetingHeader from "./meetingheader";
import HostControls from "./hostcontrols";

interface VideoRoomProps {
  roomId: string;
  name: string;
}

export default function VideoRoom({
  roomId,
  name
}: VideoRoomProps) {
  const [localStream, setLocalStream] =
    useState<MediaStream | null>(null);

  const [participants, setParticipants] =
    useState<Participant[]>([]);

  const [localParticipant, setLocalParticipant] =
    useState<Participant>({
      id: "",
      name,
      micEnabled: true,
      cameraEnabled: true,
      handRaised: false,
      isHost: false,
      isCoHost: false
    });

  const [remoteStreams, setRemoteStreams] =
    useState<Record<string, MediaStream>>({});

  const [connectionStates, setConnectionStates] =
    useState<Record<string, string>>({});

  const [messages, setMessages] =
    useState<ChatMessage[]>([]);

  const [micEnabled, setMicEnabled] = useState(true);

  const [cameraEnabled, setCameraEnabled] =
    useState(true);

  const [handRaised, setHandRaised] =
    useState(false);

  const [isScreenSharing, setIsScreenSharing] =
    useState(false);

  const [isRecording, setIsRecording] =
    useState(false);

  const [locked, setLocked] = useState(false);

  const [duration, setDuration] = useState(0);

  const [mediaError, setMediaError] = useState("");

  const [joinError, setJoinError] = useState("");

  const peersRef = useRef<
    Record<string, RTCPeerConnection>
  >({});

  const recorderRef =
    useRef<MediaRecorder | null>(null);

  const recordedChunksRef =
    useRef<Blob[]>([]);

  const cameraTrackRef =
    useRef<MediaStreamTrack | null>(null);

  const originalCameraTrackRef =
    useRef<MediaStreamTrack | null>(null);

  const startTimeRef =
    useRef<number>(Date.now());

  const mountedRef = useRef(false);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);

    const minutes = Math.floor(
      (seconds % 3600) / 60
    );

    const secs = seconds % 60;

    return [
      hours,
      minutes,
      secs
    ]
      .map((value) =>
        String(value).padStart(2, "0")
      )
      .join(":");
  };

  const updateParticipantState = useCallback(
    (
      newMic: boolean,
      newCamera: boolean,
      newHand: boolean
    ) => {
      socket.emit("participant-state", {
        micEnabled: newMic,
        cameraEnabled: newCamera,
        handRaised: newHand
      });
    },
    []
  );

  const createPeer = useCallback(
    (
      remoteId: string,
      stream: MediaStream
    ) => {
      if (peersRef.current[remoteId]) {
        return peersRef.current[remoteId];
      }

      const peer = createPeerConnection(
        (candidate) => {
          socket.emit("ice-candidate", {
            target: remoteId,
            candidate
          });
        },
        (event) => {
          const [remoteStream] = event.streams;

          if (!remoteStream) return;

          setRemoteStreams((current) => ({
            ...current,
            [remoteId]: remoteStream
          }));
        },
        (state) => {
          setConnectionStates((current) => ({
            ...current,
            [remoteId]: state
          }));
        }
      );

      stream.getTracks().forEach((track) => {
        peer.addTrack(track, stream);
      });

      peersRef.current[remoteId] = peer;

      return peer;
    },
    []
  );

  const startCall = useCallback(
    async (
      remoteId: string,
      stream: MediaStream
    ) => {
      const peer = createPeer(
        remoteId,
        stream
      );

      const offer = await createOffer(peer);

      socket.emit("offer", {
        target: remoteId,
        offer
      });
    },
    [createPeer]
  );

  useEffect(() => {
    mountedRef.current = true;

    if (!roomId) {
      return () => {
        mountedRef.current = false;
      };
    }

    saveName(name);

    let currentStream: MediaStream | null =
      null;

    const startMedia = async () => {
      try {
        currentStream =
          await navigator.mediaDevices.getUserMedia(
            {
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
              },
              video: {
                width: {
                  ideal: 1280
                },
                height: {
                  ideal: 720
                },
                facingMode: "user"
              }
            }
          );

        if (!mountedRef.current) {
          currentStream
            .getTracks()
            .forEach((track) => track.stop());

          return;
        }

        setLocalStream(currentStream);
        setMediaError("");

        const cameraTrack =
          currentStream.getVideoTracks()[0];

        cameraTrackRef.current =
          cameraTrack;

        originalCameraTrackRef.current =
          cameraTrack;

        socket.connect();

        socket.emit("join-room", {
          roomId,
          name
        });
      } catch (error) {
        console.error(
          "Media permission error:",
          error
        );

        setMediaError(
          "Camera or microphone access is unavailable. Check your browser permissions, then try again."
        );
      }
    };

    startMedia();

    return () => {
      mountedRef.current = false;

      currentStream
        ?.getTracks()
        .forEach((track) => track.stop());

      Object.values(peersRef.current).forEach(
        (peer) => peer.close()
      );

      peersRef.current = {};

      socket.disconnect();
    };
  }, [roomId, name]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setDuration(
        Math.floor(
          (Date.now() -
            startTimeRef.current) /
            1000
        )
      );
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const onRoomJoined = ({
      self,
      participants: existingParticipants,
      locked: roomLocked
    }: {
      self: Participant;
      participants: Participant[];
      locked: boolean;
    }) => {
      setLocalParticipant(self);
      setParticipants(existingParticipants);
      setLocked(roomLocked);
      setJoinError("");

      if (localStream) {
        existingParticipants
          .filter(
            (participant) =>
              participant.id !== self.id
          )
          .forEach((participant) => {
            startCall(
              participant.id,
              localStream
            ).catch(console.error);
          });
      }
    };

    const onJoinError = ({ message }: { message: string }) => {
      setJoinError(message);
    };

    const onUserJoined = (
      participant: Participant
    ) => {
      setParticipants((current) => {
        if (
          current.some(
            (item) =>
              item.id === participant.id
          )
        ) {
          return current;
        }

        return [...current, participant];
      });
    };

    const onOffer = async ({
      sender,
      offer
    }: {
      sender: string;
      offer: RTCSessionDescriptionInit;
    }) => {
      if (!localStream) return;

      const peer = createPeer(
        sender,
        localStream
      );

      await peer.setRemoteDescription(
        new RTCSessionDescription(offer)
      );

      const answer =
        await createAnswer(peer);

      socket.emit("answer", {
        target: sender,
        answer
      });
    };

    const onAnswer = async ({
      sender,
      answer
    }: {
      sender: string;
      answer: RTCSessionDescriptionInit;
    }) => {
      const peer =
        peersRef.current[sender];

      if (!peer) return;

      await peer.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    };

    const onIceCandidate = async ({
      sender,
      candidate
    }: {
      sender: string;
      candidate: RTCIceCandidateInit;
    }) => {
      const peer =
        peersRef.current[sender];

      if (!peer) return;

      try {
        await peer.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      } catch (error) {
        console.error(
          "ICE candidate error:",
          error
        );
      }
    };

    const onParticipantsUpdated = ({
      participants
    }: {
      participants: Participant[];
    }) => {
      setParticipants(participants);

      const me = participants.find(
        (participant) =>
          participant.id === socket.id
      );

      if (me) {
        setLocalParticipant(me);
      }
    };

    const onUserDisconnected = ({
      socketId
    }: {
      socketId: string;
    }) => {
      peersRef.current[
        socketId
      ]?.close();

      delete peersRef.current[
        socketId
      ];

      setRemoteStreams((current) => {
        const updated = {
          ...current
        };

        delete updated[socketId];

        return updated;
      });

      setConnectionStates((current) => {
        const updated = {
          ...current
        };

        delete updated[socketId];

        return updated;
      });

      setParticipants((current) =>
        current.filter(
          (participant) =>
            participant.id !== socketId
        )
      );
    };

    const onChatMessage = (
      message: ChatMessage
    ) => {
      setMessages((current) => [
        ...current,
        message
      ]);
    };

    const onMeetingLockChanged = ({
      locked: newLocked
    }: {
      locked: boolean;
    }) => {
      setLocked(newLocked);
    };

    const onForceMute = () => {
      if (!localStream) return;

      localStream
        .getAudioTracks()
        .forEach(
          (track) => {
            track.enabled = false;
          }
        );

      setMicEnabled(false);

      updateParticipantState(
        false,
        cameraEnabled,
        handRaised
      );
    };

    const onRemoved = () => {
      alert(
        "You were removed from the meeting."
      );

      window.location.href = "/";
    };

    const onMeetingEnded = () => {
      alert(
        "The host ended the meeting."
      );

      window.location.href = "/";
    };

    socket.on(
      "room-joined",
      onRoomJoined
    );

    socket.on("join-error", onJoinError);

    socket.on(
      "user-joined",
      onUserJoined
    );

    socket.on(
      "offer",
      onOffer
    );

    socket.on(
      "answer",
      onAnswer
    );

    socket.on(
      "ice-candidate",
      onIceCandidate
    );

    socket.on(
      "participants-updated",
      onParticipantsUpdated
    );

    socket.on(
      "user-disconnected",
      onUserDisconnected
    );

    socket.on(
      "chat-message",
      onChatMessage
    );

    socket.on(
      "meeting-lock-changed",
      onMeetingLockChanged
    );

    socket.on(
      "force-mute",
      onForceMute
    );

    socket.on(
      "removed-from-meeting",
      onRemoved
    );

    socket.on(
      "meeting-ended",
      onMeetingEnded
    );

    return () => {
      socket.off(
        "room-joined",
        onRoomJoined
      );

      socket.off("join-error", onJoinError);

      socket.off(
        "user-joined",
        onUserJoined
      );

      socket.off(
        "offer",
        onOffer
      );

      socket.off(
        "answer",
        onAnswer
      );

      socket.off(
        "ice-candidate",
        onIceCandidate
      );

      socket.off(
        "participants-updated",
        onParticipantsUpdated
      );

      socket.off(
        "user-disconnected",
        onUserDisconnected
      );

      socket.off(
        "chat-message",
        onChatMessage
      );

      socket.off(
        "meeting-lock-changed",
        onMeetingLockChanged
      );

      socket.off(
        "force-mute",
        onForceMute
      );

      socket.off(
        "removed-from-meeting",
        onRemoved
      );

      socket.off(
        "meeting-ended",
        onMeetingEnded
      );
    };
  }, [
    localStream,
    createPeer,
    startCall,
    cameraEnabled,
    handRaised,
    updateParticipantState
  ]);

  const toggleMic = () => {
    if (!localStream) return;

    const newValue = !micEnabled;

    localStream
      .getAudioTracks()
      .forEach(
        (track) => {
          track.enabled = newValue;
        }
      );

    setMicEnabled(newValue);

    updateParticipantState(
      newValue,
      cameraEnabled,
      handRaised
    );
  };

  const toggleCamera = () => {
    if (!localStream) return;

    const newValue = !cameraEnabled;

    localStream
      .getVideoTracks()
      .forEach(
        (track) => {
          track.enabled = newValue;
        }
      );

    setCameraEnabled(newValue);

    updateParticipantState(
      micEnabled,
      newValue,
      handRaised
    );
  };

  const switchCamera = async () => {
    if (!localStream) return;

    const currentTrack =
      cameraTrackRef.current;

    if (!currentTrack) return;

    try {
      const currentFacing =
        currentTrack.getSettings()
          .facingMode;

      const newFacing =
        currentFacing === "environment"
          ? "user"
          : "environment";

      const newStream =
        await navigator.mediaDevices.getUserMedia(
          {
            audio: false,
            video: {
              facingMode: {
                exact: newFacing
              }
            }
          }
        );

      const newTrack =
        newStream.getVideoTracks()[0];

      const oldTrack =
        cameraTrackRef.current;

      for (const peer of Object.values(
        peersRef.current
      )) {
        const sender =
          peer
            .getSenders()
            .find(
              (item) =>
                item.track?.kind ===
                "video"
            );

        if (sender) {
          await sender.replaceTrack(
            newTrack
          );
        }
      }

      if (oldTrack) {
        oldTrack.stop();

        localStream.removeTrack(
          oldTrack
        );
      }

      localStream.addTrack(
        newTrack
      );

      cameraTrackRef.current =
        newTrack;
    } catch (error) {
      console.error(
        "Camera switching failed:",
        error
      );

      alert(
        "This device/browser does not support switching cameras."
      );
    }
  };

  const toggleScreenShare = async () => {
    if (!localStream) return;

    if (!isScreenSharing) {
      try {
        const displayStream =
          await navigator.mediaDevices.getDisplayMedia(
            {
              video: true,
              audio: false
            }
          );

        const screenTrack =
          displayStream.getVideoTracks()[0];

        for (const peer of Object.values(
          peersRef.current
        )) {
          const sender =
            peer
              .getSenders()
              .find(
                (item) =>
                  item.track?.kind ===
                  "video"
              );

          if (sender) {
            await sender.replaceTrack(
              screenTrack
            );
          }
        }

        screenTrack.onended = () => {
          stopScreenShare();
        };

        setIsScreenSharing(true);
      } catch (error) {
        console.error(
          "Screen sharing failed:",
          error
        );
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = async () => {
    const cameraTrack =
      cameraTrackRef.current;

    if (!cameraTrack) return;

    for (const peer of Object.values(
      peersRef.current
    )) {
      const sender =
        peer
          .getSenders()
          .find(
            (item) =>
              item.track?.kind ===
              "video"
          );

      if (sender) {
        await sender.replaceTrack(
          cameraTrack
        );
      }
    }

    setIsScreenSharing(false);
  };

  const toggleHand = () => {
    const newValue = !handRaised;

    setHandRaised(newValue);

    updateParticipantState(
      micEnabled,
      cameraEnabled,
      newValue
    );
  };

  const sendMessage = (
    text: string,
    file?: {
      name: string;
      data: string;
    }
  ) => {
    if (!localParticipant.id) return;

    const message: ChatMessage = {
      id:
        crypto.randomUUID(),
      text,
      senderName:
        localParticipant.name,
      timestamp: Date.now(),
      fileName: file?.name,
      fileData: file?.data
    };

    socket.emit(
      "chat-message",
      message
    );
  };

  const toggleRecording = () => {
    if (!localStream) return;

    if (isRecording) {
      recorderRef.current?.stop();

      setIsRecording(false);

      return;
    }

    recordedChunksRef.current = [];

    try {
      const recorder =
        new MediaRecorder(
          localStream
        );

      recorder.ondataavailable = (
        event
      ) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(
            event.data
          );
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(
          recordedChunksRef.current,
          {
            type: "video/webm"
          }
        );

        const url =
          URL.createObjectURL(blob);

        const anchor =
          document.createElement("a");

        anchor.href = url;

        anchor.download =
          `pulsemeet-${roomId}-${Date.now()}.webm`;

        anchor.click();

        URL.revokeObjectURL(url);
      };

      recorder.start();

      recorderRef.current = recorder;

      setIsRecording(true);
    } catch (error) {
      console.error(
        "Recording failed:",
        error
      );

      alert(
        "Recording is not supported by this browser."
      );
    }
  };

  const leaveMeeting = () => {
    localStream
      ?.getTracks()
      .forEach(
        (track) => track.stop()
      );

    Object.values(
      peersRef.current
    ).forEach((peer) => {
      peer.close();
    });

    socket.disconnect();

    window.location.href = "/";
  };

  const toggleLock = () => {
    socket.emit("toggle-lock", {
      locked: !locked
    });
  };

  const muteParticipant = (
    id: string
  ) => {
    socket.emit(
      "mute-participant",
      {
        target: id
      }
    );
  };

  const removeParticipant = (
    id: string
  ) => {
    socket.emit(
      "remove-participant",
      {
        target: id
      }
    );
  };

  const setCoHost = (
    id: string,
    value: boolean
  ) => {
    socket.emit("set-cohost", {
      target: id,
      value
    });
  };

  const endMeeting = () => {
    if (
      !confirm(
        "End the meeting for everyone?"
      )
    ) {
      return;
    }

    socket.emit("end-meeting");
  };

  if (mediaError || joinError) {
    return (
      <main className="meeting-error-page">
        <div className="meeting-error-card">
          <span className="live-pill"><i className="status-dot" />PULSEMEET</span>
          <h1>{mediaError ? "Permission needed" : "Can't enter this room"}</h1>
          <p>{mediaError || joinError}</p>
          <button className="primary-button" onClick={() => window.location.reload()}>
            Try again
          </button>
          <button className="text-button" onClick={() => { window.location.href = "/"; }}>
            Return home
          </button>
        </div>
      </main>
    );
  }

  const allParticipants = [
    localParticipant,
    ...participants.filter(
      (participant) =>
        participant.id !==
        localParticipant.id
    )
  ];

  return (
    <div className="meeting-page">
      <MeetingHeader
        roomId={roomId}
        duration={formatDuration(duration)}
        participantCount={
          allParticipants.length
        }
        locked={locked}
        onToggleLock={toggleLock}
        isHost={
          localParticipant.isHost
        }
      />

      <div className="meeting-layout">
        <main className="meeting-main">
          <VideoGrid
            participants={participants}
            streams={remoteStreams}
            localStream={localStream}
            localParticipant={
              localParticipant
            }
            connectionStates={
              connectionStates
            }
          />

          <Controls
            micEnabled={micEnabled}
            cameraEnabled={
              cameraEnabled
            }
            handRaised={handRaised}
            isScreenSharing={
              isScreenSharing
            }
            isRecording={
              isRecording
            }
            onToggleMic={toggleMic}
            onToggleCamera={
              toggleCamera
            }
            onSwitchCamera={
              switchCamera
            }
            onToggleScreenShare={
              toggleScreenShare
            }
            onToggleHand={toggleHand}
            onToggleRecording={
              toggleRecording
            }
            onLeave={leaveMeeting}
          />
        </main>

        <aside className="sidebar">
          <ParticipantList
            participants={
              allParticipants
            }
          />

          <Chat
            messages={messages}
            onSendMessage={
              sendMessage
            }
            disabled={false}
          />

          <HostControls
            participants={
              participants
            }
            isHost={
              localParticipant.isHost
            }
            onMute={
              muteParticipant
            }
            onRemove={
              removeParticipant
            }
            onCoHost={
              setCoHost
            }
            onEndMeeting={
              endMeeting
            }
          />
        </aside>
      </div>
    </div>
  );
}