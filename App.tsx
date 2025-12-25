import { useState, useEffect, useCallback, useRef } from 'react';
import ChristmasTree from './components/ChristmasTree';
import PhotoRing from './components/PhotoRing';
import HandGestureOverlay from './components/HandGestureOverlay';
import StarField from './components/StarField';
import { Photo, GestureType } from './types';
import { generateGreeting } from './services/geminiService';

// 使用纯相对路径，浏览器会基于当前的 /christmas/ 路径自动解析为 /christmas/assets/1.jpg
const DEFAULT_PHOTOS: Photo[] = [
  { 
    id: '1', 
    url: 'assets/1.jpg'
  }, 
  { 
    id: '2', 
    url: 'assets/2.jpg'
  }, 
  { 
    id: '3', 
    url: 'assets/3.jpg'
  }, 
];

const App: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>(DEFAULT_PHOTOS);
  const [gestureActive, setGestureActive] = useState(false);
  const [greeting, setGreeting] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasStartedMusic = useRef(false);

  useEffect(() => {
    const playMusic = async () => {
      if (audioRef.current && !hasStartedMusic.current) {
        try {
          await audioRef.current.play();
          hasStartedMusic.current = true;
        } catch (err) {
          console.log("Auto-play blocked, waiting for interaction");
        }
      }
    };
    playMusic();
  }, []);

  const handleUserInteraction = () => {
    if (audioRef.current && !hasStartedMusic.current) {
      audioRef.current.play().then(() => {
        hasStartedMusic.current = true;
      }).catch(e => console.error("Play failed", e));
    }
  };

  useEffect(() => {
    if (isOpen && !greeting) {
      generateGreeting().then(setGreeting);
    } else if (!isOpen) {
      setGreeting("");
    }
  }, [isOpen, greeting]);

  const handleGesture = useCallback((gesture: GestureType) => {
    if (audioRef.current && !hasStartedMusic.current) {
        audioRef.current.play().then(() => hasStartedMusic.current = true).catch(() => {});
    }

    setIsOpen((prevIsOpen) => {
      if (gesture === 'OPEN' && !prevIsOpen) return true;
      if (gesture === 'CLOSE' && prevIsOpen) return false;
      return prevIsOpen;
    });
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsUploading(true);
    const newPhotos: Photo[] = [];
    const filesArray = Array.from(files).slice(0, 3) as File[];

    let loadedCount = 0;
    filesArray.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          newPhotos.push({
            id: `upload-${Date.now()}-${index}`,
            url: event.target.result as string,
          });
        }
        loadedCount++;
        if (loadedCount === filesArray.length) {
          setPhotos(newPhotos.length === 3 ? newPhotos : [...newPhotos, ...DEFAULT_PHOTOS.slice(newPhotos.length)]);
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const baseButtonClass = "flex-1 py-3 rounded-2xl font-bold transition-all shadow-lg border text-xs md:text-sm whitespace-nowrap flex items-center justify-center gap-2 backdrop-blur-md";

  return (
    <div 
        className="relative w-screen h-screen bg-black overflow-hidden flex flex-col items-center justify-center font-sans text-white"
        onClick={handleUserInteraction}
        onTouchStart={handleUserInteraction}
    >
      <audio 
        ref={audioRef} 
        loop 
        src="https://actions.google.com/sounds/v1/holidays/silent_night_piano.ogg" 
      />
      
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_80%,_#1a2035_0%,_#000000_100%)] z-0" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-purple-900/20 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-emerald-900/20 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
      </div>

      <StarField isWarping={isOpen} />

      <div className="absolute top-4 text-center z-50 pointer-events-none mix-blend-screen opacity-80">
        <h1 className="text-3xl md:text-5xl font-serif text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-yellow-200 to-yellow-600 mb-1 drop-shadow-[0_0_25px_rgba(255,215,0,0.5)]">
          Magical Holiday
        </h1>
      </div>

      <div className="relative w-full h-full flex items-center justify-center z-20">
        <div className={`w-full h-full flex items-center justify-center transition-all duration-1000 transform ${isOpen ? 'scale-125 opacity-60 blur-sm' : 'scale-100 opacity-100'}`}>
           <ChristmasTree isOpen={isOpen} onToggle={() => setIsOpen(!isOpen)} />
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

      <div 
        className="absolute bottom-8 left-0 w-full flex items-center justify-center px-4 z-50" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex w-full max-w-md gap-3">
          <button
            onClick={() => setGestureActive(!gestureActive)}
            className={`${baseButtonClass} ${
              gestureActive 
                ? 'bg-emerald-500/20 text-emerald-100 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                : 'bg-white/5 text-emerald-200/80 border-white/10 hover:bg-white/10 hover:border-emerald-500/30'
            }`}
          >
            <span>{gestureActive ? '✋ On' : '🖐️ Gesture'}</span>
          </button>

          <label className={`${baseButtonClass} cursor-pointer bg-white/5 text-blue-200/80 border-white/10 hover:bg-white/10 hover:border-blue-400/30`}>
            <span>🖼️ {isUploading ? '...' : 'Photos'}</span>
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`${baseButtonClass} ${
               isOpen
               ? 'bg-red-500/20 text-red-100 border-red-400 shadow-[0_0_15px_rgba(220,38,38,0.3)]'
               : 'bg-white/5 text-red-200/80 border-white/10 hover:bg-white/10 hover:border-red-500/30'
            }`}
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