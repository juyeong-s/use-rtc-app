import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";

export const STUN_SERVER = ["stun:stun.l.google.com:19302"];

export const peerConnectionConfig = {
  iceServers: [
    {
      urls: STUN_SERVER,
    },
  ],
};

export const RTC_MESSAGE = {
  SEND_HELLO: "send-hello",
  RECEIVE_HELLO: "receive-hello",
  SEND_OFFER: "send-offer",
  RECEIVE_OFFER: "receive-offer",
  SEND_ANSWER: "send-answer",
  RECEIVE_ANSWER: "receive-answer",
  SEND_ICE: "send-ice",
  RECEIVE_ICE: "receive-ice",
  SEND_BYE: "send-bye",
  RECEIVE_BYE: "receive-bye",
};

interface IPeerConnection {
  [id: string]: RTCPeerConnection; // key: 각 클라이언트의 socketId, value: RTCPeerConnection 객체
}

interface RTCProps {
  cameraOn: boolean;
  socket: Socket;
  participants: Map<string, MediaStream>;
  setParticipants: React.Dispatch<React.SetStateAction<Map<string, MediaStream>>>;
}

interface Return {
  participants: Map<string, MediaStream>;
  myStreamRef: React.MutableRefObject<MediaStream | null>;
  peerConnectionRef: React.MutableRefObject<IPeerConnection | null>;
  myStreams: MediaStream;
  setMyStreams: React.Dispatch<React.SetStateAction<MediaStream>>;
  pc: IPeerConnection;
  setPc: React.Dispatch<React.SetStateAction<IPeerConnection>>;
}

function useRTC({ cameraOn, socket, participants, setParticipants }: RTCProps): Return {
  const [myStreams, setMyStreams] = useState<MediaStream>(new MediaStream());
  const myStreamRef = useRef<MediaStream | null>(null);
  const myVideoRef = useRef<HTMLVideoElement | null>(null);
  const peerConnectionRef = useRef<IPeerConnection | null>(null);
  const [pc, setPc] = useState<IPeerConnection>({});

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const setMyStream = async () => {
    if (!cameraOn) {
      const stream = new MediaStream();
      // stream.onaddtrack = (event) => {
      //   console.log(event.track);
      // };
      myStreamRef.current = stream;
      // setMyStreams(stream);
    } else {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      myStreamRef.current = stream;
    }

    if (myVideoRef.current) {
      myVideoRef.current.srcObject = myStreamRef.current;
    }
  };

  /**
   * Peer와 연결하기
   * @param peerId 연결할 피어의 Id
   * @returns 새로 생성한 peerConnection 객체
   */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const setPeerConnection = (peerId: string) => {
    const peerConnection = new RTCPeerConnection(peerConnectionConfig);

    /* 이벤트 핸들러: Peer에게 candidate를 전달 할 필요가 있을때 마다 발생 */
    peerConnection.addEventListener("icecandidate", (e) => {
      socket.emit(RTC_MESSAGE.SEND_ICE, e.candidate, peerId);
    });

    /* 이벤트 핸들러: peerConnection에 새로운 트랙이 추가됐을 경우 호출됨 */
    peerConnection.addEventListener("track", (e) => {
      console.log("track 이벤트 발생");
      if (participants.has(peerId)) {
        return;
      }

      const [peerStream] = e.streams;

      // 새로운 peer를 참여자에 추가
      setParticipants((prev) => {
        const newState = new Map(prev);
        newState.set(peerId, peerStream);
        return newState;
      });
    });

    myStreamRef.current?.getTracks().forEach((track) => {
      if (!myStreamRef.current) return;

      // 다른 유저에게 전달해주기 위해 내 미디어를 peerConnection 에 추가한다.
      // track이 myStreamRef.current(내 스트림)에 추가됨
      console.log("addTrack함");
      peerConnection.addTrack(track);
    });

    return peerConnection;
  };

  useEffect(() => {
    setMyStream();

    /* 유저 join */
    socket.emit(RTC_MESSAGE.SEND_HELLO);

    /* 새로 들어온 유저의 socketId를 받음 */
    socket.on(RTC_MESSAGE.RECEIVE_HELLO, async (socketId) => {
      const peerConnection = setPeerConnection(socketId);

      peerConnectionRef.current = {
        ...peerConnectionRef.current,
        [socketId]: peerConnection,
      };
      setPc((prev) => ({
        ...prev,
        [socketId]: peerConnection,
      }));

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      socket.emit(RTC_MESSAGE.SEND_OFFER, offer, socketId);
    });

    /* offer 받기 */
    socket.on(RTC_MESSAGE.RECEIVE_OFFER, async (offer, senderId) => {
      console.log("offer받음", senderId);
      const peerConnection = setPeerConnection(senderId);

      peerConnectionRef.current = {
        ...peerConnectionRef.current,
        [senderId]: peerConnection,
      };
      setPc((prev) => ({
        ...prev,
        [senderId]: peerConnection,
      }));
      await peerConnection.setRemoteDescription(offer);

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      /* answer 전송 */
      socket.emit(RTC_MESSAGE.SEND_ANSWER, answer, senderId);
    });

    /* answer 받기 */
    socket.on(RTC_MESSAGE.RECEIVE_ANSWER, async (answer, senderId) => {
      const peerConnection = peerConnectionRef?.current?.[senderId];
      if (!peerConnection) {
        return console.log("Peer Connection does not exist");
      }

      await peerConnection.setRemoteDescription(answer);
    });

    /* ice candidate */
    socket.on(RTC_MESSAGE.RECEIVE_ICE, async (candidate, senderId) => {
      const peerConnection = peerConnectionRef?.current?.[senderId];

      if (!peerConnection) {
        return console.log("Peer Connection does not exist");
      }

      await peerConnection.addIceCandidate(candidate);
    });

    /* disconnected */
    socket.on(RTC_MESSAGE.RECEIVE_BYE, (senderId) => {
      delete peerConnectionRef?.current?.[senderId];

      setParticipants((prev) => {
        const newState = new Map(prev);
        newState.delete(senderId);
        return newState;
      });
      setPc((prev) => {
        const newState = { ...prev };
        delete newState[senderId];
        return newState;
      });
    });
  }, []);

  return { participants, myStreamRef, peerConnectionRef, myStreams, setMyStreams, pc, setPc };
}

export default useRTC;
