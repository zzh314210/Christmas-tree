import React, { useState, useEffect } from 'react';
import { Photo } from '../types';

interface PhotoRingProps {
  photos: Photo[];
  isVisible: boolean;
}

// 子组件：独立处理每张照片的加载状态
const PhotoCard: React.FC<{ photo: Photo; index: number; radius: number; total: number }> = ({ photo, index, radius, total }) => {
  const [hasError, setHasError] = useState(false);
  const angle = (360 / total) * index;

  // 当 photo 属性变化时，重置错误状态
  useEffect(() => {
    setHasError(false);
  }, [photo.url]);

  return (
    <div
      className="absolute w-32 h-44 md:w-40 md:h-56 lg:w-56 lg:h-72 bg-black/40 p-1 rounded-xl border border-yellow-500/50 shadow-[0_0_25px_rgba(255,215,0,0.15)] overflow-hidden backdrop-blur-sm transition-all duration-1000 hover:scale-110 pointer-events-auto hover:border-yellow-400 hover:shadow-[0_0_35px_rgba(255,215,0,0.4)]"
      style={{
        transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
      }}
    >
      <div className="w-full h-full relative group bg-gray-900/50 rounded-lg overflow-hidden">
        {!hasError ? (
            <img
                src={photo.url}
                alt={`Memory ${index + 1}`}
                className="w-full h-full object-cover rounded-lg"
                onError={() => setHasError(true)}
            />
        ) : (
            // 图片加载失败时的优雅降级 UI (Gift Box)
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-gray-800 to-black rounded-lg border border-white/5">
                <span className="text-3xl md:text-5xl mb-2 opacity-80 drop-shadow-lg">🎁</span>
                <span className="text-[10px] md:text-xs text-yellow-200/50 font-serif tracking-widest uppercase">Secret</span>
            </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex items-end justify-center p-2 md:p-3 pointer-events-none">
            <span className="text-yellow-100 text-[10px] md:text-sm font-serif italic tracking-wider opacity-90">
                {hasError ? `Gift ${index + 1}` : `Memory ${index + 1}`}
            </span>
        </div>
      </div>
    </div>
  );
};

const PhotoRing: React.FC<PhotoRingProps> = ({ photos, isVisible }) => {
  const [radius, setRadius] = useState(350); 

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      
      if (width < 768) {
        // Mobile: 
        // Card Width: 128px (w-32)
        // Radius: 145px
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
        {photos.map((photo, index) => (
          <PhotoCard 
            key={photo.id} 
            photo={photo} 
            index={index} 
            radius={radius} 
            total={photos.length} 
          />
        ))}
      </div>
    </div>
  );
};

export default PhotoRing;