
import React, { useState } from 'react';
import { FlightData, GameState, MapObjectType } from '../types';
import { Camera, Pause, Hammer, Save, X, Box, Triangle, Mic, MicOff, Radio } from 'lucide-react';

interface HUDProps {
  flightData: FlightData;
  gameState: GameState;
  onReset: () => void;
  toggleCamera: () => void;
  cameraMode: 'THIRD' | 'FIRST';
  onPause: () => void;
  // Editor Props
  isEditorMode: boolean;
  toggleEditor: () => void;
  setSelectedType: (t: MapObjectType) => void;
  onExportMap: () => void;
  // Voice Props
  isVoiceActive: boolean;
  toggleVoice: () => void;
  voiceStatus: string;
}

// Minimalistic Bar Component
const StatBar = ({ value, max, label, color = "bg-amber-500", align = "left" }: any) => {
    const pct = Math.min(100, Math.max(0, (value / max) * 100));
    return (
        <div className={`flex flex-col ${align === 'right' ? 'items-end' : 'items-start'} w-48`}>
            <div className="flex justify-between w-full text-xs font-bold text-white/80 mb-1 tracking-widest font-rajdhani">
                <span>{align === 'left' ? label : Math.round(value)}</span>
                <span>{align === 'left' ? Math.round(value) : label}</span>
            </div>
            <div className="w-full h-1 bg-white/10 skew-x-[-12deg]">
                <div 
                    className={`h-full ${color} shadow-[0_0_10px_currentColor] transition-all duration-100`} 
                    style={{ width: `${pct}%`, float: align === 'right' ? 'right' : 'left' }}
                ></div>
            </div>
        </div>
    );
};

export const HUD: React.FC<HUDProps> = ({ 
  flightData, 
  gameState, 
  onReset, 
  toggleCamera,
  cameraMode,
  onPause,
  isEditorMode,
  toggleEditor,
  setSelectedType,
  onExportMap,
  isVoiceActive,
  toggleVoice,
  voiceStatus,
}) => {
  const isStalling = !flightData.isGrounded && flightData.speed < 50;
  const [activeTool, setActiveTool] = useState<string>('BUILDING_TALL');

  const handleToolSelect = (type: MapObjectType) => {
      setActiveTool(type);
      setSelectedType(type);
  };

  if (gameState.isGameOver) {
    return (
      <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center text-white z-50 backdrop-blur-lg">
        <div className="relative p-1 bg-gradient-to-r from-red-600 to-orange-600 rounded-sm">
            <div className="bg-black p-12 flex flex-col items-center gap-6">
                <h1 className="text-6xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                    MISSION FAILED
                </h1>
                <div className="text-red-500 font-mono tracking-[0.3em] uppercase border-y border-red-500/30 py-2 w-full text-center">
                    {gameState.gameOverReason === 'CRASH' ? 'CRITICAL STRUCTURAL FAILURE' : 'FUEL DEPLETION'}
                </div>
                
                <button 
                    onClick={onReset}
                    className="mt-8 px-12 py-3 bg-white text-black font-bold text-lg tracking-widest hover:bg-amber-400 transition-colors uppercase skew-x-[-12deg]"
                >
                    <span className="skew-x-[12deg] block">RETRY MISSION</span>
                </button>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-10 select-none overflow-hidden font-rajdhani text-white">
      
      {/* Top Bar: Compass (Hidden in Editor) */}
      {!isEditorMode && (
        <div className="absolute top-0 left-0 w-full h-16 flex justify-center items-start pt-4 mask-gradient-to-b">
            <div className="relative w-[600px] h-12 overflow-hidden border-b border-white/20">
                <div className="absolute bottom-0 left-1/2 w-4 h-4 border-l border-t border-amber-500 rotate-45 -translate-x-1/2 translate-y-2 z-10 bg-amber-500/20"></div>
                <div 
                    className="absolute top-2 left-1/2 flex items-center gap-12 transition-transform duration-75 text-sm font-bold text-white/50"
                    style={{ transform: `translateX(calc(-50% - ${flightData.heading * 4}px))` }}
                >
                    {Array.from({length: 120}).map((_, i) => (
                        <div key={i} className="w-12 text-center flex flex-col items-center">
                            <span className={i % 9 === 0 ? "text-amber-400 text-lg" : ""}>
                                {i * 3 === 0 ? 'N' : i * 3 === 90 ? 'E' : i * 3 === 180 ? 'S' : i * 3 === 270 ? 'W' : (i * 3) % 45 === 0 ? i*3 : '|'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}

      {/* Top Right: Controls */}
      <div className="absolute top-4 right-4 pointer-events-auto flex gap-2">
           <button onClick={toggleEditor} className={`backdrop-blur p-2 border transition-colors rounded ${isEditorMode ? 'bg-amber-500 text-black border-amber-500' : 'bg-black/40 text-white border-white/10 hover:bg-white/10'}`}>
                {isEditorMode ? <X size={20} /> : <Hammer size={20} />}
           </button>
           {!isEditorMode && (
               <>
                <button onClick={toggleCamera} className="bg-black/40 backdrop-blur p-2 text-white border border-white/10 hover:bg-amber-500 hover:text-black transition-colors rounded">
                        <Camera size={20} />
                </button>
                <button onClick={onPause} className="bg-black/40 backdrop-blur p-2 text-white border border-white/10 hover:bg-amber-500 hover:text-black transition-colors rounded">
                        <Pause size={20} />
                </button>
               </>
           )}
      </div>

      {/* Voice Chat Control (Top Left) */}
      {!isEditorMode && (
        <div className="absolute top-4 left-4 pointer-events-auto flex items-start gap-2">
             <button 
                onClick={toggleVoice} 
                className={`flex items-center gap-2 px-3 py-2 rounded border backdrop-blur transition-all ${isVoiceActive ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-black/40 border-white/10 text-slate-400 hover:bg-white/10'}`}
             >
                 {isVoiceActive ? <Mic size={18} className="animate-pulse" /> : <MicOff size={18} />}
                 <div className="flex flex-col text-left">
                     <span className="text-xs font-bold leading-none">RADIO</span>
                     <span className="text-[9px] font-mono leading-none opacity-70">{voiceStatus}</span>
                 </div>
             </button>
             {isVoiceActive && (
                 <div className="bg-black/60 backdrop-blur px-2 py-1 rounded border border-white/10 flex items-center gap-2">
                     <Radio size={14} className="text-amber-500 animate-pulse" />
                     <span className="text-[10px] font-mono text-amber-500">123.45 MHz</span>
                 </div>
             )}
        </div>
      )}

      {/* EDITOR UI PANEL */}
      {isEditorMode && (
          <div className="absolute top-20 right-4 pointer-events-auto flex flex-col gap-2">
              <div className="bg-slate-900/90 border border-white/20 p-4 rounded-lg backdrop-blur text-right">
                  <div className="text-amber-500 font-bold mb-2 text-xs tracking-widest">MAP EDITOR</div>
                  
                  <div className="flex flex-col gap-2 mb-4">
                      <button onClick={() => handleToolSelect('BUILDING_TALL')} className={`flex items-center gap-2 p-2 rounded text-xs font-bold ${activeTool === 'BUILDING_TALL' ? 'bg-white text-black' : 'bg-black/50 text-slate-400'}`}>
                          <Box size={14} /> SKYSCRAPER
                      </button>
                      <button onClick={() => handleToolSelect('BUILDING_SMALL')} className={`flex items-center gap-2 p-2 rounded text-xs font-bold ${activeTool === 'BUILDING_SMALL' ? 'bg-white text-black' : 'bg-black/50 text-slate-400'}`}>
                          <Box size={14} /> HOUSE
                      </button>
                       <button onClick={() => handleToolSelect('PYRAMID')} className={`flex items-center gap-2 p-2 rounded text-xs font-bold ${activeTool === 'PYRAMID' ? 'bg-white text-black' : 'bg-black/50 text-slate-400'}`}>
                          <Triangle size={14} /> OBSTACLE
                      </button>
                  </div>

                  <div className="border-t border-white/10 pt-4">
                      <button onClick={onExportMap} className="w-full bg-green-600 hover:bg-green-500 text-white p-2 rounded font-bold text-xs flex items-center justify-center gap-2">
                          <Save size={14} /> EXPORT MAP CODE
                      </button>
                      <div className="text-[10px] text-slate-500 mt-2 max-w-[150px]">
                          Click ground to place. Click object to remove. Export to save permanently.
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Center: Reticle & Horizon (Hidden in Editor) */}
      {!isEditorMode && (
        <div className="absolute inset-0 flex items-center justify-center opacity-80">
            <div style={{ transform: `rotate(${-flightData.roll}deg)` }} className="relative w-full h-full flex items-center justify-center transition-transform duration-75 ease-linear">
                    {/* Horizon Line */}
                    <div className="w-[800px] h-[1px] bg-white/30 absolute"></div>
                    
                    {/* Pitch Ladder */}
                    <div className="absolute transition-transform duration-75" style={{ transform: `translateY(${flightData.pitch * 8}px)` }}>
                        {[-40, -30, -20, -10, 10, 20, 30, 40].map(deg => (
                            <div key={deg} className="absolute w-[200px] flex justify-between items-center h-[1px]" style={{ top: `${-deg * 8}px`, left: '-100px' }}>
                                <div className="w-8 h-full bg-white/50"></div>
                                <span className="text-[10px] text-white/50">{Math.abs(deg)}</span>
                                <div className="w-8 h-full bg-white/50"></div>
                            </div>
                        ))}
                    </div>
            </div>
            
            {/* Static Crosshair */}
            <div className="absolute w-8 h-8 border border-amber-500/50 rounded-full flex items-center justify-center">
                <div className="w-1 h-1 bg-amber-500 rounded-full"></div>
            </div>
        </div>
      )}

      {/* Dynamic Data Labels near Reticle (Hidden in Editor) */}
      {!isEditorMode && (
        <>
            <div className="absolute top-1/2 left-1/2 -translate-x-[180px] -translate-y-4 text-right">
                <div className="text-3xl font-bold tracking-tighter text-white">{Math.round(flightData.speed)}</div>
                <div className="text-[10px] text-amber-500 tracking-widest">KNOTS</div>
            </div>
            
            <div className="absolute top-1/2 left-1/2 translate-x-[120px] -translate-y-4 text-left">
                <div className="text-3xl font-bold tracking-tighter text-white">{Math.round(flightData.altitude)}</div>
                <div className="text-[10px] text-amber-500 tracking-widest">FEET</div>
            </div>
        </>
      )}

      {/* Warnings */}
      {isStalling && !isEditorMode && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2">
            <div className="bg-red-600 text-black px-6 py-1 font-bold text-xl tracking-[0.5em] animate-pulse rounded skew-x-[-12deg]">
                STALL
            </div>
        </div>
      )}

      {/* Bottom Status Bars (Hidden in Editor) */}
      {!isEditorMode && (
        <div className="absolute bottom-8 left-8 space-y-4">
            <StatBar value={flightData.fuel} max={100} label="FUEL" color={flightData.fuel < 20 ? 'bg-red-500' : 'bg-amber-500'} />
            <StatBar value={100} max={100} label="THRUST" color="bg-cyan-500" />
        </div>
      )}

    </div>
  );
};
