
import React, { useEffect, useRef } from 'react';

interface ChristmasTreeProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface Particle {
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  baseZ: number;
  color: string;
  size: number;
  randomOffset: number;
  sparkleSpeed: number;
  sparklePhase: number;
  orbitSpeed: number;
}

const ChristmasTree: React.FC<ChristmasTreeProps> = ({ isOpen, onToggle }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isOpenRef = useRef(isOpen);
  const requestRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rotationRef = useRef(0);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. High resolution canvas
    canvas.width = 2000;
    canvas.height = 2000;

    if (particlesRef.current.length === 0) {
      const colors = ['#FFD700', '#FFFFFF', '#50C878', '#FF4500', '#00FFFF', '#FF00FF', '#FFFACD']; 
      
      // --- PART 1: The Main Tree ---
      const treeParticleCount = 4000; 

      for (let i = 0; i < treeParticleCount; i++) {
        const height = 1600; 
        const yOffset = -900; 
        const y = (Math.random()) * height + yOffset; 
        
        const progress = (y - yOffset) / height;
        const maxRadius = 750 * progress; 
        
        const angle = Math.random() * Math.PI * 2;
        const r = maxRadius * Math.pow(Math.random(), 0.4); 
        
        const x = Math.cos(angle) * r;
        const z = Math.sin(angle) * r;

        particlesRef.current.push({
          x: x,
          y: y,
          z: z,
          baseX: x,
          baseY: y,
          baseZ: z,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 3 + 1,
          randomOffset: Math.random() * 100,
          sparkleSpeed: 0.01 + Math.random() * 0.08,
          sparklePhase: Math.random() * Math.PI * 2,
          orbitSpeed: (Math.random() - 0.5) * 0.02
        });
      }
      
      // --- PART 2: The Top Glow Sphere (Star Replacement) ---
      // A tight, bright sphere at the very top
      const sphereY = -920; 
      const sphereRadius = 35;
      const sphereCount = 300;

      for (let i = 0; i < sphereCount; i++) {
        // Uniform sphere distribution
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = Math.pow(Math.random(), 1/3) * sphereRadius; // cubic root for uniform volume

        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = sphereY + r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);

        particlesRef.current.push({
          x, y, z, baseX: x, baseY: y, baseZ: z,
          // Pure white and bright yellow for intense glow
          color: Math.random() > 0.3 ? '#FFFFFF' : '#FFFACD', 
          size: Math.random() * 4 + 2, // Larger particles
          randomOffset: 0, 
          sparkleSpeed: 0.05 + Math.random() * 0.1, // Fast sparkle
          sparklePhase: Math.random() * Math.PI * 2, 
          orbitSpeed: 0
        });
      }
      
      // Add a few "rays" emitting from center
      for(let i = 0; i < 20; i++) {
         particlesRef.current.push({
            x: 0, y: sphereY, z: 0, baseX: 0, baseY: sphereY, baseZ: 0,
            color: '#FFFFFF',
            size: 15 + Math.random() * 10, // Big glow flares
            randomOffset: 0,
            sparkleSpeed: 0.02,
            sparklePhase: Math.random(),
            orbitSpeed: 0
         });
      }
    }

    const animate = () => {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      ctx.globalCompositeOperation = 'lighter';
      
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      
      const fov = 800; 

      rotationRef.current += 0.003;

      particlesRef.current.sort((a, b) => b.z - a.z);

      particlesRef.current.forEach(p => {
        let targetX, targetY, targetZ;

        if (isOpenRef.current) {
          // Explosion logic
          const explodeFactor = 5; 
          const time = Date.now() * 0.0005;
          targetX = p.baseX * explodeFactor + Math.sin(time + p.randomOffset) * 200;
          targetY = p.baseY * explodeFactor + Math.cos(time + p.randomOffset) * 200;
          targetZ = p.baseZ * explodeFactor;
        } else {
          targetX = p.baseX;
          targetY = p.baseY;
          targetZ = p.baseZ;
        }

        p.x += (targetX - p.x) * 0.06;
        p.y += (targetY - p.y) * 0.06;
        p.z += (targetZ - p.z) * 0.06;

        const cos = Math.cos(rotationRef.current);
        const sin = Math.sin(rotationRef.current);
        
        const rx = p.x * cos - p.z * sin;
        const rz = p.x * sin + p.z * cos;
        const ry = p.y; 

        const scale = fov / (fov + rz + 200); 
        
        const x2d = rx * scale + cx;
        const y2d = ry * scale + cy + 100; 

        const pulse = Math.sin(Date.now() * p.sparkleSpeed + p.sparklePhase);
        // Base alpha 0.8 for brighter tree
        const alpha = Math.min(1, scale * (0.8 + pulse * 0.2));
        
        if (scale > 0) {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(x2d, y2d, p.size * scale, 0, Math.PI * 2);
            ctx.fill();
        }
      });

      ctx.globalAlpha = 1.0;
      ctx.globalCompositeOperation = 'source-over';
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return (
    <div className="relative flex items-center justify-center cursor-pointer group w-full h-full" onClick={onToggle}>
      <canvas 
        ref={canvasRef} 
        className="w-full h-full object-contain transition-all duration-1000"
        style={{ 
          filter: isOpen ? 'blur(0px)' : 'none',
          maxHeight: '100vh',
          maxWidth: '100vw'
        }}
      />
      
      {!isOpen && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="w-[60%] h-[80%] bg-white/5 rounded-full blur-3xl" />
        </div>
      )}
    </div>
  );
};

export default ChristmasTree;
