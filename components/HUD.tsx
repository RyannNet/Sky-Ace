
import React, { useState, useEffect } from 'react';
import { Camera, Pause, Users, Signal, Maximize2, Minimize2, BellRing, Settings, Map, MessageSquare, Radio, Box } from 'lucide-react';
// Import Vector3 from three to resolve distance calculation errors
import { Vector3 } from 'three';

export const HUD = ({ 
    flightData, gameState, onReset, toggleCamera, cameraMode, onPause, 
    playerCount, networkStatus, currentMission, onAcceptMission, isEditor, toggleEditor,
    onPassengerAnnouncement
}: any) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAnnouncements, setShowAnnouncements] = useState(false);

  const announcements = [
    { label: "Bem-vindos", icon: "👋", msg: "Senhores passageiros, bem-vindos a bordo." },
    { label: "Turbulência", icon: "☁️", msg: "Estamos passando por uma área de instabilidade." },
    { label: "Cintos", icon: "💺", msg: "Por favor, apertem os cintos de segurança." },
    { label: "Aterrissagem", icon: "🛬", msg: "Iniciando procedimentos de descida." }
  ];

  if (gameState.isGameOver) {
      return (
          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center text-white z-50 p-4">
              <div className="text-6xl md:text-9xl font-black italic mb-2 text-red-500 animate-pulse">CRASHED</div>
              <p className="text-slate-400 tracking-widest mb-12 uppercase">Mission Failed</p>
              <button onClick={onReset} className="px-12 py-6 bg-white text-black font-black text-2xl skew-x-[-15deg] hover:bg-amber-500 transition-all">
                 <span className="skew-x-[15deg] block">RESTART SIM</span>
              </button>
          </div>
      );
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col p-4 md:p-6 text-white font-rajdhani select-none overflow-hidden">
        
        {/* Top Info Bar */}
        <div className="flex justify-between items-start pointer-events-auto">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 border border-white/10 rounded-xl">
                    <Signal size={14} className={networkStatus === "CONNECTED" ? "text-green-400" : "text-red-400"} />
                    <span className="text-xs font-black uppercase tracking-widest">{gameState.currentRoom}</span>
                    <div className="w-[1px] h-3 bg-white/20"></div>
                    <Users size={14} className="text-amber-500" />
                    <span className="text-xs font-black">{playerCount}</span>
                </div>
                
                {/* Active Mission Display */}
                {currentMission && (
                    <div className="bg-amber-500 text-black px-4 py-2 rounded-lg font-black italic flex items-center gap-3 animate-bounce">
                        <Map size={16} /> DESTINO: {currentMission.destinationName} ({currentMission.distance}KM)
                    </div>
                )}
            </div>

            <div className="flex gap-2">
                <button onClick={toggleEditor} className={`p-3 rounded-xl border transition-all ${isEditor ? 'bg-amber-500 border-white text-black' : 'bg-black/60 border-white/10 hover:bg-white/10'}`}>
                    <Box size={20} />
                </button>
                <button onClick={toggleCamera} className="p-3 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl hover:bg-white/10 active:scale-90 transition-all">
                    <Camera size={20}/>
                </button>
                <button onClick={onPause} className="p-3 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl hover:bg-white/10 active:scale-90 transition-all">
                    <Pause size={20}/>
                </button>
            </div>
        </div>

        {/* Passenger Announcement Panel */}
        <div className="absolute top-20 right-6 pointer-events-auto flex flex-col items-end gap-2">
            <button 
                onClick={() => setShowAnnouncements(!showAnnouncements)}
                className="flex items-center gap-3 bg-cyan-600 px-4 py-2 rounded-lg font-black text-xs hover:bg-cyan-500 transition-all"
            >
                <Radio size={14} /> ANÚNCIOS PA
            </button>
            
            {showAnnouncements && (
                <div className="bg-black/80 backdrop-blur-xl border border-white/10 p-3 rounded-xl flex flex-col gap-2 w-48 shadow-2xl">
                    {announcements.map((a, i) => (
                        <button 
                            key={i} 
                            onClick={() => { onPassengerAnnouncement(a.msg); setShowAnnouncements(false); }}
                            className="flex items-center gap-3 p-2 hover:bg-white/10 rounded-lg text-left text-[10px] font-bold uppercase tracking-tighter transition-all"
                        >
                            <span>{a.icon}</span> {a.label}
                        </button>
                    ))}
                </div>
            )}
        </div>

        {/* Central HUD / Crosshair */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center opacity-40 pointer-events-none">
            <div className="w-48 h-[1px] bg-white/50"></div>
            <div className="h-48 w-[1px] bg-white/50 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
            <div className="border border-white/50 w-24 h-24 rounded-full mt-4"></div>
        </div>

        {/* Bottom Instruments - Redesigned for wide screens */}
        <div className="mt-auto flex justify-between items-end pointer-events-auto pb-4">
             {/* Speedometer */}
             <div className="flex flex-col gap-1">
                 <div className="text-[10px] text-amber-500 font-bold uppercase tracking-widest px-2">Ground Velocity</div>
                 <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border-l-8 border-amber-500 flex items-baseline gap-2">
                    <span className="text-5xl md:text-8xl font-black italic tracking-tighter tabular-nums">{Math.round(flightData.speed)}</span>
                    <span className="text-xl opacity-40 font-bold italic">KTS</span>
                 </div>
             </div>

             {/* Center Panel: Distance to Target */}
             {currentMission && (
                 <div className="flex flex-col items-center gap-1 mb-2">
                    <div className="text-[8px] font-bold tracking-[0.5em] text-white/40 uppercase">Distance Tracking</div>
                    <div className="bg-cyan-900/40 px-6 py-2 rounded-full border border-cyan-500/50 text-cyan-300 font-black italic text-xl">
                        {Math.max(0, (currentMission.distance - (Vector3.prototype.distanceTo.call(new Vector3(flightData.x, 0, flightData.z), new Vector3(currentMission.targetPos[0], 0, currentMission.targetPos[2])) / 1000))).toFixed(1)} KM
                    </div>
                 </div>
             )}

             {/* Altimeter */}
             <div className="flex flex-col gap-1 items-end">
                 <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest px-2">Flight Altitude</div>
                 <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border-r-8 border-cyan-400 flex items-baseline gap-2">
                    <span className="text-5xl md:text-8xl font-black italic tracking-tighter tabular-nums">{Math.round(flightData.altitude)}</span>
                    <span className="text-xl opacity-40 font-bold italic">FT</span>
                 </div>
             </div>
        </div>
        
        {/* Editor Info (if active) */}
        {isEditor && (
            <div className="absolute bottom-32 left-1/2 -translate-x-1/2 bg-amber-500 text-black px-6 py-2 rounded-full font-black text-sm uppercase shadow-[0_0_20px_rgba(245,158,11,0.5)] animate-pulse">
                AXIS EDITOR ACTIVE - Clique nos prédios para editar
            </div>
        )}
    </div>
  );
};
