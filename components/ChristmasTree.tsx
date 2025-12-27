
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
  type: 'tree' | 'ribbon' | 'star' | 'ornament';
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
      // Color Palettes
      // CHANGED: Removed dark/muddy greens. Added brighter, vivid greens to pop against black.
      const treeGreens = ['#006400', '#008000', '#228B22', '#32CD32', '#00FF00', '#3CB371', '#2E8B57', '#7CFC00'];
      const ornamentColors = ['#FF0000', '#FFD700', '#00FFFF', '#FF00FF', '#FFFFFF', '#FF4500', '#FF69B4'];
      
      const treeHeight = 1700;
      const yBase = 900; // Positive Y is bottom of screen in Canvas

      // --- PART 1: The High-Density Tree Body ---
      const treeParticleCount = 15000; 

      for (let i = 0; i < treeParticleCount; i++) {
        // Generate Y from Base (bottom) to Top
        const y = yBase - Math.random() * treeHeight; 
        
        // Progress: 0 at Base, 1 at Top
        const progress = (yBase - y) / treeHeight;
        
        // Cone shape
        const maxRadius = 800 * (1 - progress); 

        const angle = Math.random() * Math.PI * 2;
        // Distribution: slightly more uniform to fill gaps
        const r = maxRadius * Math.sqrt(Math.random()); 
        
        const x = Math.cos(angle) * r;
        const z = Math.sin(angle) * r;

        // CHANGED: Reduced ornament frequency from 12% to 10% to let the green dominate
        const isOrnament = Math.random() > 0.90; 

        particlesRef.current.push({
          x: x,
          y: y,
          z: z,
          baseX: x,
          baseY: y,
          baseZ: z,
          color: isOrnament 
            ? ornamentColors[Math.floor(Math.random() * ornamentColors.length)] 
            : treeGreens[Math.floor(Math.random() * treeGreens.length)],
          size: isOrnament ? Math.random() * 5 + 3 : Math.random() * 2 + 1,
          randomOffset: Math.random() * 100,
          sparkleSpeed: isOrnament ? 0.05 + Math.random() * 0.05 : 0.005,
          sparklePhase: Math.random() * Math.PI * 2,
          orbitSpeed: 0,
          type: isOrnament ? 'ornament' : 'tree'
        });
      }

      // --- PART 2: The "Furry" Volumetric Golden Ribbon ---
      const ribbonParticleCount = 10000;
      const spirals = 8; // More twists
      
      for (let i = 0; i < ribbonParticleCount; i++) {
        const p = i / ribbonParticleCount; // 0 (start) to 1 (end)
        
        // Spiral center path
        const yCenter = yBase - p * treeHeight;
        const radiusCenter = 850 * (1 - p) + 30; // Float outside the tree
        const angleBase = p * Math.PI * 2 * spirals;

        // Volumetric Scattering (The "Furry" Effect)
        // Instead of a single point, we scatter particles around the center point of the ribbon
        const ribbonThickness = 35; // The width/fuzziness of the band
        
        // Random offset in a sphere/cloud around the ribbon center
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const rOffset = Math.pow(Math.random(), 1/3) * ribbonThickness;

        const offsetX = rOffset * Math.sin(phi) * Math.cos(theta);
        const offsetY = rOffset * Math.sin(phi) * Math.sin(theta);
        const offsetZ = rOffset * Math.cos(phi);

        const x = Math.cos(angleBase) * radiusCenter + offsetX;
        const y = yCenter + offsetY; // Add vertical volume
        const z = Math.sin(angleBase) * radiusCenter + offsetZ;

        // Mix of gold shades for texture
        const goldColors = ['#FFD700', '#FDB931', '#FFFFE0', '#DAA520'];
        const color = goldColors[Math.floor(Math.random() * goldColors.length)];

        particlesRef.current.push({
          x: x,
          y: y,
          z: z,
          baseX: x,
          baseY: y,
          baseZ: z,
          color: color,
          size: Math.random() * 2.5 + 1, // Smaller, denser particles for the "fur" look
          randomOffset: Math.random() * 100,
          sparkleSpeed: 0.1 + Math.random() * 0.1, // Fast sparkle
          sparklePhase: Math.random() * Math.PI * 2,
          orbitSpeed: 0,
          type: 'ribbon'
        });
      }
      
      // --- PART 3: The Top Glow Sphere (Star) ---
      const sphereY = yBase - treeHeight - 20; 
      const sphereRadius = 50;
      const sphereCount = 400; // Denser star

      for (let i = 0; i < sphereCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = Math.pow(Math.random(), 1/3) * sphereRadius;

        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = sphereY + r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);

        particlesRef.current.push({
          x, y, z, baseX: x, baseY: y, baseZ: z,
          color: '#FFFFFF', 
          size: Math.random() * 4 + 2,
          randomOffset: 0, 
          sparkleSpeed: 0.1,
          sparklePhase: Math.random() * Math.PI * 2, 
          orbitSpeed: 0,
          type: 'star'
        });
      }
    }

    const animate = () => {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 'lighter' gives that glowing, additive blending look crucial for "magic"
      ctx.globalCompositeOperation = 'lighter';
      
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      
      const fov = 800; 

      rotationRef.current += 0.003;

      // Z-sorting for correct depth occlusion (though 'lighter' mitigates need, it helps structure)
      // particlesRef.current.sort((a, b) => b.z - a.z); 

      particlesRef.current.forEach(p => {
        let targetX, targetY, targetZ;

        if (isOpenRef.current) {
          // Explosion logic
          const explodeFactor = 5; 
          const time = Date.now() * 0.0005;
          
          if (p.type === 'ribbon') {
             // Ribbon unravels gracefully
             targetX = p.baseX * explodeFactor * 1.5 + Math.cos(time * 2 + p.baseY * 0.01) * 300;
             targetY = p.baseY * explodeFactor;
             targetZ = p.baseZ * explodeFactor * 1.5 + Math.sin(time * 2 + p.baseY * 0.01) * 300;
          } else {
             // Tree explodes outward
             targetX = p.baseX * explodeFactor + Math.sin(time + p.randomOffset) * 200;
             targetY = p.baseY * explodeFactor + Math.cos(time + p.randomOffset) * 200;
             targetZ = p.baseZ * explodeFactor;
          }
        } else {
          targetX = p.baseX;
          targetY = p.baseY;
          targetZ = p.baseZ;
        }

        // Smooth interpolation
        p.x += (targetX - p.x) * 0.06;
        p.y += (targetY - p.y) * 0.06;
        p.z += (targetZ - p.z) * 0.06;

        // 3D Rotation
        const cos = Math.cos(rotationRef.current);
        const sin = Math.sin(rotationRef.current);
        
        const rx = p.x * cos - p.z * sin;
        const rz = p.x * sin + p.z * cos;
        const ry = p.y; 

        // Projection
        const scale = fov / (fov + rz + 200); 
        const x2d = rx * scale + cx;
        const y2d = ry * scale + cy + 100;

        // Sparkle / Alpha Calculation
        const pulse = Math.sin(Date.now() * p.sparkleSpeed + p.sparklePhase);
        
        let alpha = 1;
        if (p.type === 'ribbon') {
            // Ribbons shimmer intensely
            alpha = Math.min(1, scale * (0.7 + pulse * 0.3)); 
        } else if (p.type === 'ornament') {
            alpha = Math.min(1, scale * (0.8 + pulse * 0.5)); 
        } else {
            // Tree base is more solid
            alpha = Math.min(1, scale * (0.7 + pulse * 0.1)); 
        }
        
        if (scale > 0 && rz > -fov) {
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
