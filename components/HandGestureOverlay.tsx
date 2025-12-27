import React, { useEffect, useRef } from 'react';
import { GestureType } from '../types';

interface HandGestureOverlayProps {
  onGesture: (gesture: GestureType) => void;
  isActive: boolean;
}

const HandGestureOverlay: React.FC<HandGestureOverlayProps> = ({ onGesture, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Ref to track the last emitted gesture to avoid spamming the parent component
  const lastGestureRef = useRef<GestureType>('NONE');
  // Timestamp to prevent rapid flickering
  const lastGestureTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!isActive) return;

    // Security Check: Detect if browser blocks camera due to HTTP
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const isHttps = window.location.protocol === 'https:';
      
      if (!isLocal && !isHttps) {
        alert("⚠️ 无法启动摄像头\n\n浏览器的安全策略禁止在非 HTTPS 环境下访问摄像头。\n\n请尝试：\n1. 配置 SSL 证书使用 HTTPS 访问\n2. 或在本地使用 localhost 访问");
      } else {
        alert("⚠️ 您的浏览器不支持或已禁用摄像头访问权限。");
      }
      return;
    }

    let hands: any = null;
    let camera: any = null;

    const onResults = (results: any) => {
      // Visual feedback removed as per request to hide the window.
      // We only process logic here.

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        
        for (const landmarks of results.multiHandLandmarks) {
          const thumbTip = landmarks[4];
          const pinkyTip = landmarks[20];
          const wrist = landmarks[0];

          // Calculate a reference scale (wrist to index finger base)
          const indexBase = landmarks[5];
          const handSize = Math.sqrt(
             Math.pow(indexBase.x - wrist.x, 2) + Math.pow(indexBase.y - wrist.y, 2)
          );

          const distance = Math.sqrt(
            Math.pow(thumbTip.x - pinkyTip.x, 2) + 
            Math.pow(thumbTip.y - pinkyTip.y, 2)
          );

          // Normalized distance
          const normalizedDist = distance / (handSize || 1);

          let detectedGesture: GestureType = 'NONE';

          if (normalizedDist > 1.2) {
            detectedGesture = 'OPEN';
          } else if (normalizedDist < 0.8) {
             detectedGesture = 'CLOSE';
          }

          // Debounce/Throttle Logic
          const now = Date.now();
          if (detectedGesture !== 'NONE' && detectedGesture !== lastGestureRef.current) {
             if (now - lastGestureTimeRef.current > 200) { 
                lastGestureRef.current = detectedGesture;
                lastGestureTimeRef.current = now;
                onGesture(detectedGesture);
             }
          }
        }
      }
    };

    // Load MediaPipe Hands
    try {
      // @ts-ignore
      hands = new window.Hands({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 0, // Lower complexity for better performance since we don't need visuals
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      hands.onResults(onResults);

      if (videoRef.current) {
        // @ts-ignore
        camera = new window.Camera(videoRef.current, {
          onFrame: async () => {
            if (hands) await hands.send({ image: videoRef.current! });
          },
          width: 640,
          height: 480
        });
        camera.start();
      }
    } catch (e) {
      console.error("MediaPipe Init Error:", e);
    }

    return () => {
      if (camera) camera.stop();
      if (hands) hands.close();
    };
  }, [isActive, onGesture]);

  // The visible UI is completely removed. 
  // We only keep the video element required for MediaPipe to work, but it is hidden.
  return (
    <video ref={videoRef} className="hidden" playsInline muted />
  );
};

export default HandGestureOverlay;