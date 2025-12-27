
import React, { useState, useEffect, useCallback, useRef } from 'react';
import ChristmasTree from './components/ChristmasTree';
import PhotoRing from './components/PhotoRing';
import HandGestureOverlay from './components/HandGestureOverlay';
import StarField from './components/StarField';
import { Photo, GestureType } from './types';
import { generateGreeting } from './services/geminiService';

// CHANGED: Use relative paths for assets. 
const DEFAULT_PHOTOS: Photo[] = [
  { id: '1', url: 'assets/1.jpg' }, 
  { id: '2', url: 'assets/2.jpg' }, 
  { id: '3', url: 'assets/3.jpg' }, 
  { id: '4', url: 'assets/4.jpg' }, 
  { id: '5', url: 'assets/5.jpg' }, 
  { id: '6', url: 'assets/6.jpg' }, 
];

const App: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>(DEFAULT_PHOTOS);
  const [gestureActive, setGestureActive] = useState(false);
  const [greeting, setGreeting] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasStartedMusic = useRef(false);

  // Helper to play music on any interaction
  const tryPlayMusic = useCallback(async () => {
    if (audioRef.current && !hasStartedMusic.current) {
      try {
        await audioRef.current.play();
        hasStartedMusic.current = true;
      } catch (err) {
        // Autoplay policy might block this until user interacts
        console.log("Waiting for user interaction to play music");
      }
    }
  }, []);

  // 1. Try to play immediately on mount
  useEffect(() => {
    tryPlayMusic();

    // 2. Add global listeners to catch the very first interaction anywhere on screen
    const unlockAudio = () => {
        tryPlayMusic();
        // Once played, we can remove these specific global listeners
        if (hasStartedMusic.current) {
            window.removeEventListener('click', unlockAudio);
            window.removeEventListener('touchstart', unlockAudio);
            window.removeEventListener('keydown', unlockAudio);
        }
    };

    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);
    window.addEventListener('keydown', unlockAudio);

    return () => {
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
    };
  }, [tryPlayMusic]);

  // Handle direct interaction with the main container
  const handleUserInteraction = () => {
    tryPlayMusic();
  };

  useEffect(() => {
    if (isOpen && !greeting) {
      generateGreeting().then(setGreeting);
    } else if (!isOpen) {
      setGreeting("");
    }
  }, [isOpen, greeting]);

  const handleGesture = useCallback((gesture: GestureType) => {
    tryPlayMusic(); // Try to play music if gesture triggers (might be blocked, but worth a try)

    setIsOpen((prevIsOpen) => {
      if (gesture === 'OPEN' && !prevIsOpen) return true;
      if (gesture === 'CLOSE' && prevIsOpen) return false;
      return prevIsOpen;
    });
  }, [tryPlayMusic]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    tryPlayMusic(); // Uploading is an interaction, play music

    const processFiles = async () => {
        try {
            const newPhotos: Photo[] = [];
            const filesArray = Array.from(files).slice(0, 6) as File[];
            
            const promises = filesArray.map((file, index) => {
                return new Promise<void>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        if (event.target?.result) {
                            newPhotos.push({
                                id: `upload-${Date.now()}-${index}`,
                                url: event.target.result as string,
                            });
                        }
                        resolve();
                    };
                    reader.readAsDataURL(file);
                });
            });

            await Promise.all(promises);
            
            if (newPhotos.length > 0) {
                 setPhotos(prev => {
                    const combined = [...newPhotos, ...DEFAULT_PHOTOS];
                    return combined.slice(0, 6);
                 });
            }
        } catch (error) {
            console.error("Upload failed", error);
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    processFiles();
  };

  const baseButtonClass = "flex-1 py-3 rounded-2xl font-bold transition-all shadow-lg border text-xs md:text-sm whitespace-nowrap flex items-center justify-center gap-2 backdrop-blur-md";

  return (
    <div 
        className="relative w-screen h-screen bg-black overflow-hidden flex flex-col items-center justify-center font-sans text-white"
        onClick={handleUserInteraction}
        onTouchStart={handleUserInteraction}
    >
      <audio ref={audioRef} loop crossOrigin="anonymous" preload="auto">
        <source src="https://archive.org/download/SilentNight_603/SilentNight.mp3" type="audio/mpeg" />
        <source src="https://upload.wikimedia.org/wikipedia/commons/6/6b/Silent_Night_by_Kevin_MacLeod.ogg" type="audio/ogg" />
      </audio>
      
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_80%,_#1a2035_0%,_#000000_100%)] z-0" />

      <StarField isWarping={isOpen} />

      <div className="absolute top-4 text-center z-50 pointer-events-none mix-blend-screen opacity-80">
        <h1 className="text-3xl md:text-5xl font-serif text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-yellow-200 to-yellow-600 mb-1 drop-shadow-[0_0_25px_rgba(255,215,0,0.5)]">
          Merry Christmas
        </h1>
      </div>

      <div className="relative w-full h-full flex items-center justify-center z-20">
        <div className={`w-full h-full flex items-center justify-center transition-all duration-1000 transform ${isOpen ? 'scale-125 opacity-60 blur-sm' : 'scale-100 opacity-100'}`}>
           <ChristmasTree isOpen={isOpen} onToggle={() => {
               tryPlayMusic();
               setIsOpen(!isOpen);
           }} />
        </div>
        
        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 ${isOpen ? 'opacity-100 scale-100 delay-300' : 'opacity-0 scale-50 pointer-events-none'}`}>
           <PhotoRing photos={photos} isVisible={isOpen} />
        </div>
      </div>

      {isOpen && greeting && (
        <div className="absolute bottom-24 right-4 md:bottom-32 md:right-10 z-50 animate-fade-in-up max-w-[60vw] md:max-w-xs">
          <div className="bg-black/60 backdrop-blur-md border border-yellow-500/30 p-4 rounded-xl shadow-[0_0_30px_rgba(255,215,0,0.15)] flex items-center justify-center">
            <p className="text-xs md:text-base font-serif text-transparent bg-clip-text bg-gradient-to-br from-yellow-100 via-orange-100 to-yellow-200 italic leading-relaxed text-center">
              "{greeting}"
            </p>
          </div>
        </div>
      )}

      {/* Control Bar - Restored to original layout without Music Button */}
      <div className="absolute bottom-8 left-0 w-full flex items-center justify-center px-4 z-50">
        <div className="flex w-full max-w-md gap-3">
          
          <button
            onClick={(e) => { 
                e.stopPropagation(); 
                tryPlayMusic(); 
                setGestureActive(!gestureActive); 
            }}
            className={`${baseButtonClass} ${gestureActive ? 'bg-emerald-500/20 text-emerald-100 border-emerald-400' : 'bg-white/5 text-emerald-200/80 border-white/10'}`}
          >
            <span>{gestureActive ? '✋ On' : '🖐️ Gesture'}</span>
          </button>

          <label 
            className={`${baseButtonClass} cursor-pointer bg-white/5 text-blue-200/80 border-white/10 hover:border-blue-400/30`}
            onClick={(e) => { 
                e.stopPropagation(); 
                tryPlayMusic();
            }}
          >
            <span>🖼️ Photos</span>
            <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} />
          </label>

          <button
            onClick={(e) => { 
                e.stopPropagation(); 
                tryPlayMusic(); 
                setIsOpen(!isOpen); 
            }}
            className={`${baseButtonClass} ${isOpen ? 'bg-red-500/20 text-red-100 border-red-400' : 'bg-white/5 text-red-200/80 border-white/10'}`}
          >
            <span>✨ {isOpen ? 'Reset' : 'Magic'}</span>
          </button>
        </div>
      </div>

      <HandGestureOverlay isActive={gestureActive} onGesture={handleGesture} />
    </div>
  );
};

export default App;
