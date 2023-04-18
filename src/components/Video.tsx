import { useEffect, useRef } from "react";

interface Props {
  stream: MediaStream;
}

function Video({ stream }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.srcObject = stream;
  }, [stream]);

  return <video ref={ref} autoPlay width={200} height={200} />;
}

export default Video;
