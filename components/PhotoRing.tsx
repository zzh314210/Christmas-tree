import React, { useState, useEffect } from 'react';
import { Photo } from '../types';

interface PhotoRingProps {
  photos: Photo[];
  isVisible: boolean;
}

const PhotoRing: React.FC<PhotoRingProps> = ({ photos, isVisible }) => {
  const [radius, setRadius] = useState(300);

  useEffect(() => {
    const handleResize = () => {
      setRadius(window.innerWidth < 768 ? 130 : 300);
    };
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
              className="absolute w-32 h-44 md:w-56 md:h-72 bg-black/40 p-1 rounded-xl border border-yellow-500/50 shadow-[0_0_25px_rgba(255,215,0,0.15)] overflow-hidden backdrop-blur-sm transition-all duration-1000 hover:scale-110 pointer-events-auto hover:border-yellow-400 hover:shadow-[0_0_35px_rgba(255,215,0,0.4)]"
              style={{
                transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
                backfaceVisibility: 'hidden', // 隐藏背面，解决镜像反转问题
              }}
            >
              <div className="w-full h-full relative">
                <img
                    src={photo.url}
                    alt={`Memory ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                        console.error("Image load failed:", photo.url);
                        // 如果加载失败，可以尝试打印当前路径
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