export const rtcConfiguration: RTCConfiguration = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302"
    },
    {
      urls: "stun:stun1.l.google.com:19302"
    }
  ]
};

export function createPeerConnection(
  onIceCandidate: (candidate: RTCIceCandidate) => void,
  onTrack: (event: RTCTrackEvent) => void,
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void
): RTCPeerConnection {
  const peer = new RTCPeerConnection(rtcConfiguration);

  peer.onicecandidate = (event) => {
    if (event.candidate) {
      onIceCandidate(event.candidate);
    }
  };

  peer.ontrack = onTrack;

  peer.onconnectionstatechange = () => {
    onConnectionStateChange?.(peer.connectionState);
  };

  return peer;
}

export async function createOffer(
  peer: RTCPeerConnection
): Promise<RTCSessionDescriptionInit> {
  const offer = await peer.createOffer();

  await peer.setLocalDescription(offer);

  return offer;
}

export async function createAnswer(
  peer: RTCPeerConnection
): Promise<RTCSessionDescriptionInit> {
  const answer = await peer.createAnswer();

  await peer.setLocalDescription(answer);

  return answer;
}