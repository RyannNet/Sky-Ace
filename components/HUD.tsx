
import React, { useState, useEffect } from 'react';
import { Camera, Pause, Users, Signal, Maximize2, Minimize2, BellRing } from 'lucide-react';

export const HUD = ({ flightData, gameState, onReset, toggleCamera, cameraMode, onPause, playerCount, networkStatus, chatMessages, regionNotification }: any) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  if (gameState.isGameOver) {
      const isWater = gameState.gameOverReason === 'WATER_CRASH';
      return (
          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center text-white z-50 backdrop-blur-xl p-4">
              <div className={`text-5xl md:text-8xl font-black italic mb-2 ${isWater ? 'text-cyan-500' : 'text-red-500'} animate-pulse text-center`}>
                {isWater ? 'DROWNED' : 'CRASHED'}
              </div>
              <p className="text-slate-400 tracking-[0.2em] md:tracking-[0.5em] mb-12 uppercase text-xs md:text-base text-center max-w-md">
                Structural Failure on Impact
              </p>
              <button onClick={onReset} className="w-full max-w-xs py-5 bg-white text-black font-black text-xl hover:bg-amber-500 transition-all skew-x-[-15deg]">
                 <span className="skew-x-[15deg] block">RETRY MISSION</span>
              </button>
          </div>
      );
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col p-4 md:p-10 text-white font-rajdhani select-none">
        
        {/* Top bar refined for landscape */}
        <div className="flex justify-between items-start pointer-events-auto">
            <div className="flex items-center gap-2 md:gap-4 bg-black/50 backdrop-blur-md px-4 py-2 border border-white/5 rounded-full">
                <div className="flex items-center gap-2">
                    <Signal size={14} className={networkStatus === "CONNECTED" ? "text-green-400 animate-pulse" : "text-red-400"} />
                    <span className="text-[10px] md:text-xs font-black tracking-widest uppercase">{gameState.currentRoom}</span>
                </div>
                <div className="w-[1px] h-3 bg-white/20"></div>
                <div className="flex items-center gap-2">
                    <Users size={14} className="text-amber-500" />
                    <span className="text-[10px] md:text-xs font-black">{playerCount}</span>
                </div>
            </div>

            <div className="flex gap-2">
                <button onClick={toggleFullscreen} className="p-2 md:p-3 bg-black/50 backdrop-blur-md border border-white/5 rounded-full hover:bg-white/10 active:scale-90 transition-all">
                    {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
                <button onClick={toggleCamera} className="p-2 md:p-3 bg-black/50 backdrop-blur-md border border-white/5 rounded-full hover:bg-white/10 active:scale-90 transition-all">
                    <Camera size={18}/>
                </button>
                <button onClick={onPause} className="p-2 md:p-3 bg-black/50 backdrop-blur-md border border-white/5 rounded-full hover:bg-white/10 active:scale-90 transition-all">
                    <Pause size={18}/>
                </button>
            </div>
        </div>

        {/* Region Toast - Moved slightly for better ergonomics */}
        {regionNotification && (
            <div className="absolute top-1/4 left-8 pointer-events-none flex flex-col gap-2 animate-[slide_0.4s_cubic-bezier(0.18,0.89,0.32,1.28)]">
                <div className="bg-amber-500 text-black px-5 py-2.5 font-black italic text-xs md:text-sm skew-x-[-15deg] flex items-center gap-3 shadow-xl">
                    <BellRing size={16} className="animate-bounce" /> 
                    <span className="skew-x-[15deg]">DEPARTING {regionNotification.old.toUpperCase()}</span>
                </div>
                <div className="bg-white/10 backdrop-blur-xl text-white px-5 py-2 font-bold text-[9px] md:text-xs border-l-4 border-amber-500 uppercase tracking-widest">
                    Optimizing World Data Clusters...
                </div>
                <div className="bg-cyan-500 text-black px-5 py-2 font-black italic text-[10px] md:text-xs skew-x-[15deg] shadow-lg">
                   <span className="skew-x-[-15deg]">APPROACHING {regionNotification.new.toUpperCase()}</span>
                </div>
            </div>
        )}

        {/* Bottom Instruments - Refined Scaling for Mobile Landscape */}
        <div className="flex justify-between items-end mt-auto px-2 md:px-0">
             <div className="flex flex-col items-start bg-black/20 backdrop-blur-sm p-4 rounded-xl border-l-4 border-amber-500">
                 <div className="text-[10px] md:text-xs text-amber-500 font-black tracking-[0.2em] uppercase">Airspeed</div>
                 <div className="text-4xl md:text-7xl font-black italic tracking-tighter tabular-nums leading-none">
                    {Math.round(flightData.speed)}<span className="text-xs md:text-xl ml-1 opacity-40">KTS</span>
                 </div>
             </div>

             <div className="flex flex-col items-end bg-black/20 backdrop-blur-sm p-4 rounded-xl border-r-4 border-cyan-400">
                 <div className="text-[10px] md:text-xs text-cyan-400 font-black tracking-[0.2em] uppercase">Altitude</div>
                 <div className="text-4xl md:text-7xl font-black italic tracking-tighter tabular-nums leading-none">
                    {Math.round(flightData.altitude)}<span className="text-xs md:text-xl ml-1 opacity-40">FT</span>
                 </div>
             </div>
        </div>
        
        <style>{`
            @keyframes slide {
                0% { transform: translateX(-100px); opacity: 0; filter: blur(10px); }
                100% { transform: translateX(0); opacity: 1; filter: blur(0); }
            }
        `}</style>
    </div>
  );
};
