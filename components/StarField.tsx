
import React, { useEffect, useRef } from 'react';

interface StarFieldProps {
  isWarping: boolean;
}

interface Star {
  x: number;
  y: number;
  z: number;
  pz: number; // Previous Z for trail effect
  opacity: number;
  blinkOffset: number;
}

const StarField: React.FC<StarFieldProps> = ({ isWarping }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const requestRef = useRef<number | null>(null);
  const speedRef = useRef<number>(0.2); // Current speed for smooth transition
  
  // Configuration
  const STAR_COUNT = 400; 
  const SPEED_IDLE = 0.1;
  const SPEED_WARP = 15.0; // Faster warp
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize stars
    if (starsRef.current.length === 0) {
      for (let i = 0; i < STAR_COUNT; i++) {
        starsRef.current.push({
          x: (Math.random() - 0.5) * canvas.width * 2,
          y: (Math.random() - 0.5) * canvas.height * 2,
          z: Math.random() * canvas.width,
          pz: 0,
          opacity: Math.random(),
          blinkOffset: Math.random() * Math.PI * 2
        });
      }
    }

    const animate = () => {
      // Resize handling
      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }

      // 1. Clear Canvas transparently (IMPORTANT: Allows CSS background to show through)
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // 2. Smooth Speed Transition (Lerp)
      const targetSpeed = isWarping ? SPEED_WARP : SPEED_IDLE;
      speedRef.current += (targetSpeed - speedRef.current) * 0.05;

      const speed = speedRef.current;
      const isFast = speed > 2.0; // Threshold to switch drawing mode

      starsRef.current.forEach(star => {
        // Update Z
        star.pz = star.z;
        star.z -= speed;

        // Reset if passed screen or too close
        if (star.z <= 1) {
          star.z = canvas.width;
          star.pz = star.z + speed; // Fix trail artifact on reset
          star.x = (Math.random() - 0.5) * canvas.width * 2;
          star.y = (Math.random() - 0.5) * canvas.height * 2;
        }

        // Project 3D to 2D
        const sx = (star.x / star.z) * cx + cx;
        const sy = (star.y / star.z) * cy + cy;

        // Calculate size based on depth
        const depthRatio = 1 - star.z / canvas.width;
        const size = depthRatio * (isFast ? 2.0 : 2.5);
        
        // Draw
        ctx.beginPath();
        
        if (isFast) {
            // WARP MODE: Draw Streaks (Trails)
            // Use previous Z to find where the star was
            const oldSx = (star.x / (star.z + speed * 0.5)) * cx + cx;
            const oldSy = (star.y / (star.z + speed * 0.5)) * cy + cy;
            
            // Trail color: bluish white, opacity fades with depth
            ctx.strokeStyle = `rgba(200, 230, 255, ${depthRatio * 0.4})`;
            ctx.lineWidth = size * 0.5;
            ctx.lineCap = 'round';
            ctx.moveTo(oldSx, oldSy);
            ctx.lineTo(sx, sy);
            ctx.stroke();
        } else {
            // IDLE MODE: Draw Twinkling Dots
            const time = Date.now() * 0.002;
            const blink = Math.sin(time + star.blinkOffset) * 0.3 + 0.7; // 0.4 to 1.0
            
            ctx.fillStyle = `rgba(255, 255, 230, ${depthRatio * star.opacity * blink})`;
            ctx.arc(sx, sy, size * 0.8, 0, Math.PI * 2);
            ctx.fill();
        }
      });

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isWarping]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full z-10 pointer-events-none"
    />
  );
};

export default StarField;
