
import React, { useState, useEffect } from 'react';
import { Photo } from '../types';

interface PhotoRingProps {
  photos: Photo[];
  isVisible: boolean;
}

const PhotoRing: React.FC<PhotoRingProps> = ({ photos, isVisible }) => {
  const [radius, setRadius] = useState(350); 

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      
      if (width < 768) {
        // Mobile: 
        // Card Width: 128px (w-32)
        // Radius: 145px (Increased from 110px)
        // Logic: Radius (145) > Card Width (128), creating natural gaps between photos.
        // Total Width: ~336px, fits safely within 360px screens without overflow.
        setRadius(145);
      } else if (width < 1024) {
        // Tablet: Radius 200px fits well with w-40 (160px)
        setRadius(200);
      } else {
        // Desktop: Original grand scale
        setRadius(350);
      }
    };

    // Initial calculation
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center perspective-1000">
      <div className="relative w-full h-full flex items-center justify-center preserve-3d animate-rotate-ring">
        {photos.map((photo, index) => {
          const angle = (360 / photos.length) * index;
          return (
            <div
              key={photo.id}
              // Responsive Sizing (Kept exactly as requested):
              // Mobile: w-32 h-44
              // Tablet: w-40 h-56
              // Desktop: w-56 h-72
              className="absolute w-32 h-44 md:w-40 md:h-56 lg:w-56 lg:h-72 bg-black/40 p-1 rounded-xl border border-yellow-500/50 shadow-[0_0_25px_rgba(255,215,0,0.15)] overflow-hidden backdrop-blur-sm transition-all duration-1000 hover:scale-110 pointer-events-auto hover:border-yellow-400 hover:shadow-[0_0_35px_rgba(255,215,0,0.4)]"
              style={{
                transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
              }}
            >
              <div className="w-full h-full relative">
                <img
                    src={photo.url}
                    alt={`Memory ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                        console.error("Image load failed:", photo.url);
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-center p-2 md:p-3">
                    <span className="text-yellow-100 text-[10px] md:text-sm font-serif italic tracking-wider">Memory {index + 1}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PhotoRing;
