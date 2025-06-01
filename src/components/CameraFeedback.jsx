import React, { useState, useEffect, useRef } from 'react';
import { Pose } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import Webcam from 'react-webcam';
import { loadPoseFromJson } from './loadPoseJson';

const overlayActions = ["Arabesque", "Attitude", "Ballon", "Battement"];

const BalletCameraFeedback = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [techniqueAccuracy, setTechniqueAccuracy] = useState({});

  const loadedTechniques = useRef({});

  useEffect(() => {
    const loadAllPoses = async () => {
      for (let technique of overlayActions) {
        const poseData = await loadPoseFromJson(technique);
        loadedTechniques.current[technique] = poseData;
      }
    };
    loadAllPoses();
  }, []);

  const calculateSimilarity = (poseA, poseB) => {
    let sum = 0;
    poseA.forEach((lm, idx) => {
      const dx = lm.x - poseB[idx].x;
      const dy = lm.y - poseB[idx].y;
      sum += dx * dx + dy * dy;
    });
    return Math.sqrt(sum);
  };

  useEffect(() => {
    const pose = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    pose.onResults((results) => {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      if (results.poseLandmarks) {
        const detectedPose = results.poseLandmarks;

        const accuracies = {};
        let totalInverseDist = 0;

        Object.entries(loadedTechniques.current).forEach(([name, refPose]) => {
          const dist = calculateSimilarity(detectedPose, refPose);
          const invDist = 1 / (dist + 1e-5);
          accuracies[name] = invDist;
          totalInverseDist += invDist;
        });

        const accuracyPercentages = {};
        Object.entries(accuracies).forEach(([name, invDist]) => {
          accuracyPercentages[name] = ((invDist / totalInverseDist) * 100).toFixed(2);
        });

        setTechniqueAccuracy(accuracyPercentages);

        detectedPose.forEach(({ x, y }) => {
          ctx.beginPath();
          ctx.arc(x * 640, y * 480, 5, 0, 2 * Math.PI);
          ctx.fillStyle = 'blue';
          ctx.fill();
        });
      }
    });

    if (webcamRef.current) {
      const camera = new Camera(webcamRef.current.video, {
        onFrame: async () => await pose.send({ image: webcamRef.current.video }),
        width: 640,
        height: 480,
      });
      camera.start();
    }
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      <Webcam ref={webcamRef} style={{ width: 640, height: 480 }} />
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        style={{ position: 'absolute', top: 0, left: 0 }}
      />
      <div style={{
        position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(255, 20, 147, 0.8)', padding: '10px 20px', color: '#fff',
        borderRadius: '5px', maxWidth: '90%', overflowX: 'auto', whiteSpace: 'nowrap'
      }}>
        {Object.entries(techniqueAccuracy).map(([technique, accuracy]) => (
          <span key={technique} style={{ marginRight: 15 }}>
            {technique}: {accuracy}%
          </span>
        ))}
      </div>
    </div>
  );
};

export default BalletCameraFeedback;
