
import React, { useState, useEffect } from 'react';
import { Camera, Pause, Users, Signal, Maximize2, Minimize2, Waves } from 'lucide-react';

export const HUD = ({ flightData, gameState, onReset, toggleCamera, cameraMode, onPause, playerCount, networkStatus, chatMessages }: any) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.error(`Error attempting to enable fullscreen: ${e.message}`);
      });
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
                {isWater ? (
                    <span className="flex items-center gap-2 justify-center">
                        <Waves className="text-cyan-500" /> ENGINE FLAMEOUT DUE TO WATER INGESTION
                    </span>
                ) : gameState.gameOverReason === 'CRASH' ? 'Structural Failure on Impact' : 'Fuel Exhaustion'}
              </p>
              <button onClick={onReset} className="w-full max-w-xs py-5 bg-white text-black font-black text-xl hover:bg-amber-500 transition-all skew-x-[-15deg]">
                 <span className="skew-x-[15deg] block">RETRY MISSION</span>
              </button>
          </div>
      );
  }

  const isConnected = networkStatus === "CONNECTED";

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col p-4 md:p-6 text-white font-rajdhani select-none">
        
        {/* Top: Room & Network */}
        <div className="flex justify-between items-start pointer-events-auto">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 md:gap-3 bg-black/60 backdrop-blur px-3 py-1.5 md:px-4 md:py-2 border border-white/10 rounded-lg">
                    <Signal size={12} className={isConnected ? "text-green-400" : "text-red-400"} />
                    <span className="text-[10px] md:text-xs font-bold tracking-widest">{gameState.currentRoom}</span>
                    <div className="w-[1px] h-3 md:h-4 bg-white/10 mx-1 md:mx-2"></div>
                    <Users size={12} className="text-amber-500" />
                    <span className="text-[10px] md:text-xs font-bold">{playerCount}</span>
                </div>
                
                <div className="flex flex-col gap-1 mt-2 max-h-24 md:max-h-none overflow-hidden">
                    {chatMessages.map((m: any, i: number) => (
                        <div key={i} className="text-[9px] md:text-[10px] bg-black/40 px-2 py-0.5 md:py-1 rounded w-fit border-l-2 border-amber-500 whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px] md:max-w-xs">
                            <span className="font-bold text-amber-500 mr-1 md:mr-2">{m.name}:</span>
                            <span className="text-white/80">{m.text}</span>
                        </div>
                    ))}
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

        {/* Center: Flight Director */}
        <div className="flex-1 flex items-center justify-center opacity-40 md:opacity-60 scale-75 md:scale-100">
            <div className="relative w-64 h-64 md:w-72 md:h-72">
                <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                    <div className="w-full h-full flex flex-col items-center justify-center transition-transform duration-75" style={{ transform: `rotate(${-flightData.roll}deg) translateY(${flightData.pitch * 5}px)` }}>
                         <div className="w-48 h-[2px] bg-cyan-400 shadow-[0_0_10px_#22d3ee]"></div>
                         {[-30, -15, 15, 30].map(d => (
                             <div key={d} className="w-24 h-[1px] bg-white/20 my-8 flex justify-between px-2 text-[8px]">
                                 <span>{Math.abs(d)}</span><span>{Math.abs(d)}</span>
                             </div>
                         ))}
                    </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 md:w-12 md:h-12 border-2 border-amber-500 rounded-full flex items-center justify-center">
                         <div className="w-1 h-1 bg-amber-500 rounded-full"></div>
                    </div>
                </div>
            </div>
        </div>

        {/* Distance Indicator */}
        <div className="absolute top-1/4 right-8 bg-black/40 p-4 border-r-4 border-amber-500 text-right">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">METRO RANGE</div>
            <div className="text-3xl font-black italic">{(Math.abs(flightData.z) / 1000).toFixed(1)}<span className="text-sm ml-1 opacity-50">KM</span></div>
        </div>

        {/* Bottom Bar: Instruments */}
        <div className="flex justify-between items-end mb-2 md:mb-4 px-2 md:px-0">
             <div className="flex flex-col items-start gap-0 md:gap-1">
                 <div className="text-[8px] md:text-xs text-amber-500 font-bold tracking-widest uppercase">SPD</div>
                 <div className="text-4xl md:text-6xl font-black italic tracking-tighter tabular-nums">
                    {Math.round(flightData.speed)}<span className="text-xs md:text-lg ml-0.5 md:ml-1 opacity-50">KTS</span>
                 </div>
                 <div className="w-24 md:w-48 h-1 md:h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${Math.min(100, (flightData.speed/350)*100)}%` }}></div>
                 </div>
             </div>

             <div className="flex flex-col items-end gap-0 md:gap-1">
                 <div className="text-[8px] md:text-xs text-cyan-400 font-bold tracking-widest uppercase">ALT</div>
                 <div className="text-4xl md:text-6xl font-black italic tracking-tighter tabular-nums">
                    {Math.round(flightData.altitude)}<span className="text-xs md:text-lg ml-0.5 md:ml-1 opacity-50">FT</span>
                 </div>
                 <div className="w-24 md:w-48 h-1 md:h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400 transition-all duration-300" style={{ width: `${Math.min(100, (flightData.altitude/1000)*100)}%` }}></div>
                 </div>
             </div>
        </div>

        {!flightData.isGrounded && flightData.speed < 70 && (
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 md:px-8 py-1.5 md:py-2 text-xs md:text-base font-black italic tracking-[0.4em] animate-pulse rounded z-20">STALL</div>
        )}
    </div>
  );
};
