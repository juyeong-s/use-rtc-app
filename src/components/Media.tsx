import { useState } from "react";
import { io } from "socket.io-client";
import useRTC from "../useRTC";

import Button from "./Button";
import Video from "./Video";

function Media() {
  const socket = io("http://localhost:8080", { path: "/ws" });
  const [participants, setParticipants] = useState<Map<string, MediaStream>>(new Map());

  const {
    participants: p,
    myStreamRef,
    peerConnectionRef,
    myStreams,
    setMyStreams,
    pc: pcs,
    setPc,
  } = useRTC({
    cameraOn: false,
    socket,
    participants,
    setParticipants,
  });

  // console.log("participants", participants);

  const handleClick = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
    });
    for (const track of stream.getTracks()) {
      myStreamRef.current?.addTrack(track);
    }

    myStreamRef.current?.getTracks().forEach((track) => {
      if (!myStreamRef.current) return;

      // 다른 유저에게 전달해주기 위해 내 미디어를 peerConnection 에 추가한다.
      // track이 myStreamRef.current(내 스트림)에 추가됨
      if (peerConnectionRef.current) {
        for (const pc of Object.values(pcs)) {
          console.log("pc", pc);
          pc.addTrack(track);
        }
      }
    });

    if (myStreamRef.current) {
      console.log("실행");
      setMyStreams(myStreamRef.current);
    }
  };

  console.log("pcs", pcs);
  console.log("p, peerConnectionRef", p, peerConnectionRef);
  console.log("myStreamRef.current", myStreamRef.current);

  return (
    <div>
      {myStreamRef.current && <Video key={"my"} stream={myStreamRef.current} />}
      {/* <video ref={myStreamRef}></video> */}

      {pcs &&
        Object.entries(pcs).map(([key, pc]) => {
          const stream = p.get(key);
          return stream ? (
            <Video key={key} stream={stream} />
          ) : (
            <video key={key} style={{ backgroundColor: "blue", margin: "10px" }}></video>
          );
        })}
      <Button onClick={handleClick}></Button>
    </div>
  );
}

export default Media;
