
import React, { useEffect, useRef } from 'react';
import { GestureType } from '../types';

interface HandGestureOverlayProps {
  onGesture: (gesture: GestureType) => void;
  isActive: boolean;
}

// Add type declaration for window globals added by MediaPipe scripts
declare global {
  interface Window {
    Hands: any;
    Camera: any;
  }
}

const HandGestureOverlay: React.FC<HandGestureOverlayProps> = ({ onGesture, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const handsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  
  // Ref to track the last emitted gesture to avoid spamming the parent component
  const lastGestureRef = useRef<GestureType>('NONE');
  // Timestamp to prevent rapid flickering
  const lastGestureTimeRef = useRef<number>(0);

  // Keep latest onGesture to avoid stale closure in onResults
  const onGestureRef = useRef(onGesture);
  useEffect(() => {
    onGestureRef.current = onGesture;
  }, [onGesture]);

  // 1. Initialize MediaPipe Hands ONCE on mount (with retry logic)
  useEffect(() => {
    let isMounted = true;
    let retryInterval: any = null;

    const initHands = () => {
      // Check if global scripts are loaded
      if (!window.Hands) {
        // Scripts not loaded yet, wait for next interval
        return;
      }

      if (handsRef.current) return; // Already initialized

      try {
        console.log("Initializing MediaPipe Hands...");
        const hands = new window.Hands({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1, // Increased to 1 for better accuracy
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        hands.onResults((results: any) => {
          if (!isMounted) return;

          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            for (const landmarks of results.multiHandLandmarks) {
              const thumbTip = landmarks[4];
              const pinkyTip = landmarks[20];
              const wrist = landmarks[0];

              // Calculate reference scale
              const indexBase = landmarks[5];
              const handSize = Math.sqrt(
                 Math.pow(indexBase.x - wrist.x, 2) + Math.pow(indexBase.y - wrist.y, 2)
              );

              const distance = Math.sqrt(
                Math.pow(thumbTip.x - pinkyTip.x, 2) + 
                Math.pow(thumbTip.y - pinkyTip.y, 2)
              );

              // Normalized distance
              const normalizedDist = distance / (handSize || 0.1); // Avoid div by zero

              let detectedGesture: GestureType = 'NONE';
              if (normalizedDist > 1.1) {
                detectedGesture = 'OPEN';
              } else if (normalizedDist < 0.9) {
                 detectedGesture = 'CLOSE';
              }

              // Debounce/Throttle Logic
              const now = Date.now();
              if (detectedGesture !== 'NONE' && detectedGesture !== lastGestureRef.current) {
                 if (now - lastGestureTimeRef.current > 300) { 
                    lastGestureRef.current = detectedGesture;
                    lastGestureTimeRef.current = now;
                    console.log(`Gesture Detected: ${detectedGesture}`); // Debug log
                    if (onGestureRef.current) {
                      onGestureRef.current(detectedGesture);
                    }
                 }
              }
            }
          }
        });

        handsRef.current = hands;
        // Stop retrying once successful
        if (retryInterval) clearInterval(retryInterval);

      } catch (e) {
        console.error("MediaPipe Hands Init Error:", e);
      }
    };

    // Try to init immediately, then poll if scripts aren't ready
    initHands();
    retryInterval = setInterval(initHands, 1000);

    // Cleanup: Only close hands when component completely unmounts
    return () => {
      isMounted = false;
      if (retryInterval) clearInterval(retryInterval);
      if (handsRef.current) {
        try {
            handsRef.current.close();
        } catch(e) {
            console.warn("Error closing hands:", e);
        }
        handsRef.current = null;
      }
    };
  }, []);

  // 2. Manage Camera Lifecycle based on isActive
  useEffect(() => {
    // If not active, ensure camera is stopped
    if (!isActive) {
      if (cameraRef.current) {
        cameraRef.current.stop();
        cameraRef.current = null;
      }
      return;
    }

    // Security checks
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn("Camera API not accessible");
        alert("Camera API unavailable. Please check permissions or use HTTPS.");
        return;
    }

    if (!videoRef.current) return;

    // Retry camera init if window.Camera not ready yet
    const startCamera = () => {
        if (!window.Camera) {
            setTimeout(startCamera, 500);
            return;
        }
        
        try {
          const camera = new window.Camera(videoRef.current, {
            onFrame: async () => {
              // Check if hands is initialized and video is ready
              if (handsRef.current && videoRef.current && 
                  videoRef.current.readyState >= 2) {
                try {
                    await handsRef.current.send({ image: videoRef.current });
                } catch (err) {
                    // Catch Wasm aborts or processing errors silently
                }
              }
            },
            width: 640,
            height: 480
          });
    
          camera.start()
            .then(() => {
                cameraRef.current = camera;
            })
            .catch((e: any) => {
                console.error("Camera Start Error:", e);
            });
    
        } catch (e) {
          console.error("Camera Init Error:", e);
        }
    };

    startCamera();

    // Cleanup
    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop();
        cameraRef.current = null;
      }
    };
  }, [isActive]);

  return (
    // Fixed: Do not use display:none (className="hidden"), as it stops video playback in some browsers.
    // Use opacity-0 and pointer-events-none to hide it visually but keep it active in DOM.
    <video 
        ref={videoRef} 
        className="fixed top-0 left-0 w-px h-px opacity-0 pointer-events-none" 
        playsInline 
        muted 
    />
  );
};

export default HandGestureOverlay;
