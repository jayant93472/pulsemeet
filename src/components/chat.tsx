"use client";

import { useRef, useState } from "react";
import { ChatMessage } from "@/lib/meeting";

function PaperclipIcon({ size = 18 }: { size?: number }) {
  return (
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
      <path d="M21.44 11.05 12.25 20.24a6.5 6.5 0 0 1-9.19-9.19l9.19-9.19a4.34 4.34 0 0 1 6.13 6.13L9.19 17.18a2.17 2.17 0 0 1-3.07-3.07l9.19-9.18" />
    </svg>
  );
}

function SendIcon({ size = 18 }: { size?: number }) {
  return (
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
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22 11 13 2 9 22 2Z" />
    </svg>
  );
}

interface ChatProps {
  messages: ChatMessage[];
  onSendMessage: (
    text: string,
    file?: {
      name: string;
      data: string;
    }
  ) => void;
  disabled?: boolean;
}

export default function Chat({
  messages,
  onSendMessage,
  disabled = false
}: ChatProps) {
  const [text, setText] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const send = () => {
    const trimmed = text.trim();

    if (!trimmed) return;

    onSendMessage(trimmed);

    setText("");
  };

  const handleFile = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      onSendMessage("", {
        name: file.name,
        data: String(reader.result)
      });
    };

    reader.readAsDataURL(file);

    event.target.value = "";
  };

  return (
    <div className="chat">
      <div className="chat-header">
        <h3>In-call Chat</h3>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <p className="empty-chat">
            No messages yet.
          </p>
        )}

        {messages.map((message) => (
          <div
            className="chat-message"
            key={message.id}
          >
            <strong>{message.senderName}</strong>

            {message.text && (
              <p>{message.text}</p>
            )}

            {message.fileName && message.fileData && (
              <a
                href={message.fileData}
                download={message.fileName}
                className="file-message"
              >
                📎 {message.fileName}
              </a>
            )}

            <small>
              {new Date(message.timestamp).toLocaleTimeString()}
            </small>
          </div>
        ))}
      </div>

      <div className="chat-input">
        <button
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
        >
          <PaperclipIcon size={18} />
        </button>

        <input
          disabled={disabled}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              send();
            }
          }}
          placeholder={
            disabled
              ? "Chat disabled"
              : "Type a message..."
          }
        />

        <button
          disabled={disabled}
          onClick={send}
        >
          <SendIcon size={18} />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          hidden
          onChange={handleFile}
        />
      </div>

      <div className="emoji-row">
        {["😀", "😂", "❤️", "👍", "👏", "🔥"].map(
          (emoji) => (
            <button
              key={emoji}
              disabled={disabled}
              onClick={() => {
                setText((current) => current + emoji);
              }}
            >
              {emoji}
            </button>
          )
        )}
      </div>
    </div>
  );
}