
import React from 'react';
import { FlightData, GameState } from '../types';
import { Camera, Pause, Mic, MicOff, Users, Signal, SignalHigh, SignalLow } from 'lucide-react';

export const HUD = ({ flightData, gameState, onReset, toggleCamera, cameraMode, onPause, isVoiceActive, toggleVoice, voiceStatus, playerCount, networkStatus }: any) => {
  if (gameState.isGameOver) {
      return (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-white z-50">
              <h1 className="text-6xl font-black mb-4 italic">FALLEN ACE</h1>
              <p className="text-red-500 tracking-widest mb-8 uppercase font-bold">{gameState.gameOverReason}</p>
              <button onClick={onReset} className="bg-white text-black px-12 py-4 font-black skew-x-[-12deg] hover:bg-amber-500 transition-colors">RETURN TO BASE</button>
          </div>
      );
  }

  const isConnected = networkStatus === "CONNECTED";

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col p-4 text-white font-rajdhani">
        {/* TOP LEFT: Multi / Voice */}
        <div className="flex flex-col gap-2 pointer-events-auto">
            <div className={`flex items-center gap-2 px-3 py-2 rounded border backdrop-blur ${isConnected ? 'bg-green-500/20 border-green-500/50' : 'bg-red-500/20 border-red-500/50'}`}>
                <Signal size={14} className={isConnected ? "text-green-400" : "text-red-400"} />
                <span className="text-[10px] font-bold uppercase tracking-widest">{networkStatus}</span>
            </div>
            
            <div className="flex items-center gap-4 bg-black/40 backdrop-blur p-3 rounded border border-white/10">
                <div className="flex items-center gap-2">
                    <Users size={16} className="text-amber-500" />
                    <span className="text-xl font-black">{playerCount}</span>
                </div>
                <button onClick={toggleVoice} className={`p-2 rounded ${isVoiceActive ? 'text-green-400' : 'text-slate-500'}`}>
                    {isVoiceActive ? <Mic size={20} /> : <MicOff size={20} />}
                </button>
            </div>
        </div>

        {/* TOP RIGHT: System */}
        <div className="absolute top-4 right-4 flex gap-2 pointer-events-auto">
            <button onClick={toggleCamera} className="p-3 bg-black/40 border border-white/10 rounded"><Camera size={20}/></button>
            <button onClick={onPause} className="p-3 bg-black/40 border border-white/10 rounded"><Pause size={20}/></button>
        </div>

        {/* CENTER: Flight Instruments */}
        <div className="flex-1 flex items-center justify-center">
            <div className="relative w-64 h-64 border-2 border-white/10 rounded-full flex items-center justify-center opacity-40">
                <div className="absolute w-full h-[1px] bg-white/40" style={{ transform: `rotate(${-flightData.roll}deg)` }}></div>
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
            </div>
        </div>

        {/* BOTTOM: Stats */}
        <div className="flex justify-between items-end mb-8">
            <div className="flex flex-col gap-1">
                <div className="text-4xl font-black tracking-tighter">{Math.round(flightData.speed)}<span className="text-xs text-amber-500 ml-1">KTS</span></div>
                <div className="w-32 h-1 bg-white/10 overflow-hidden"><div className="h-full bg-amber-500" style={{width: `${(flightData.speed/250)*100}%`}}></div></div>
            </div>
            <div className="flex flex-col items-end gap-1">
                <div className="text-4xl font-black tracking-tighter">{Math.round(flightData.altitude)}<span className="text-xs text-amber-500 ml-1">FT</span></div>
                <div className="w-32 h-1 bg-white/10 overflow-hidden"><div className="h-full bg-cyan-500" style={{width: `${(flightData.altitude/500)*100}%`}}></div></div>
            </div>
        </div>
    </div>
  );
};
