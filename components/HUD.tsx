
import React, { useState, useEffect } from 'react';
import { Camera, Pause, Users, Signal, Maximize2, Minimize2, Waves, BellRing } from 'lucide-react';

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
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col p-4 md:p-6 text-white font-rajdhani select-none">
        
        {/* Top: Room & Network */}
        <div className="flex justify-between items-start pointer-events-auto">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 md:gap-3 bg-black/60 backdrop-blur px-3 py-1.5 md:px-4 md:py-2 border border-white/10 rounded-lg">
                    <Signal size={12} className={networkStatus === "CONNECTED" ? "text-green-400" : "text-red-400"} />
                    <span className="text-[10px] md:text-xs font-bold tracking-widest">{gameState.currentRoom}</span>
                    <div className="w-[1px] h-3 md:h-4 bg-white/10 mx-1 md:mx-2"></div>
                    <Users size={12} className="text-amber-500" />
                    <span className="text-[10px] md:text-xs font-bold">{playerCount}</span>
                </div>
            </div>

            <div className="flex gap-1 md:gap-2">
                <button onClick={toggleFullscreen} className="p-2 md:p-3 bg-black/60 border border-white/10 rounded-lg hover:bg-white/10 transition-colors">
                    {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
                <button onClick={toggleCamera} className="p-2 md:p-3 bg-black/60 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"><Camera size={18}/></button>
                <button onClick={onPause} className="p-2 md:p-3 bg-black/60 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"><Pause size={18}/></button>
            </div>
        </div>

        {/* Region Toast (Bottom Left) */}
        {regionNotification && (
            <div className="absolute bottom-32 left-8 pointer-events-none flex flex-col gap-2 animate-[slide_0.3s_ease-out]">
                <div className="bg-amber-500 text-black px-4 py-2 font-black italic text-xs md:text-sm skew-x-[-10deg] flex items-center gap-2">
                    <BellRing size={14} className="animate-bounce" /> 
                    <span className="skew-x-[10deg]">VOCÊ ESTÁ SAINDO DE {regionNotification.old.toUpperCase()}</span>
                </div>
                <div className="bg-white/10 backdrop-blur text-white px-4 py-1.5 font-bold text-[10px] md:text-xs border-l-4 border-amber-500">
                    OTIMIZANDO CENA: DESATIVANDO ELEMENTOS DISTANTES...
                </div>
                <div className="bg-cyan-500 text-black px-4 py-1.5 font-black italic text-[10px] md:text-xs skew-x-[10deg]">
                   <span className="skew-x-[-10deg]">ENTRANDO EM {regionNotification.new.toUpperCase()}</span>
                </div>
            </div>
        )}

        {/* Instruments */}
        <div className="flex justify-between items-end mt-auto mb-2 md:mb-4 px-2 md:px-0">
             <div className="flex flex-col items-start gap-0 md:gap-1">
                 <div className="text-[8px] md:text-xs text-amber-500 font-bold tracking-widest uppercase">SPD</div>
                 <div className="text-4xl md:text-6xl font-black italic tracking-tighter tabular-nums">
                    {Math.round(flightData.speed)}<span className="text-xs md:text-lg ml-0.5 md:ml-1 opacity-50">KTS</span>
                 </div>
             </div>

             <div className="flex flex-col items-end gap-0 md:gap-1">
                 <div className="text-[8px] md:text-xs text-cyan-400 font-bold tracking-widest uppercase">ALT</div>
                 <div className="text-4xl md:text-6xl font-black italic tracking-tighter tabular-nums">
                    {Math.round(flightData.altitude)}<span className="text-xs md:text-lg ml-0.5 md:ml-1 opacity-50">FT</span>
                 </div>
             </div>
        </div>
        
        <style>{`
            @keyframes slide {
                0% { transform: translateX(-50px); opacity: 0; }
                100% { transform: translateX(0); opacity: 1; }
            }
        `}</style>
    </div>
  );
};
