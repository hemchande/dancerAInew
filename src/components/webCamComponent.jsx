import React, { useRef, useEffect, useState } from "react";

const WebcamComponent = ({ sendFrame }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            setReady(true);
          };
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    };
    initCamera();
  }, []);

  const handleSendFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!ready || !video || !canvas) {
      console.warn("Video or canvas not ready");
      return;
    }

    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL("image/jpeg");

    sendFrame(imageData);
  };

  return (
    <div>
      <video ref={videoRef} autoPlay playsInline muted width="480" />
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <button onClick={handleSendFrame}>Send Frame</button>
    </div>
  );
};

export default WebcamComponent;
