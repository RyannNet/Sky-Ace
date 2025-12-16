
import React, { useState, useEffect } from 'react';
import { PlayerProfile, SKINS } from '../types';
import { Play, Settings, ShoppingCart, User, X, ChevronRight, Coins, Lock, Check, Maximize, Upload, RefreshCw } from 'lucide-react';

const Panel = ({ children, className = "" }: { children?: React.ReactNode, className?: string }) => (
  <div 
    className={`bg-slate-900/60 backdrop-blur-md border border-white/10 relative overflow-hidden ${className}`}
  >
    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50"></div>
    {children}
  </div>
);

const Button = ({ onClick, children, variant = 'primary', className = "", disabled = false }: any) => {
    const base = "px-6 py-4 font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3 skew-x-[-10deg]";
    const variants = {
        primary: "bg-amber-500 text-black hover:bg-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]",
        secondary: "bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/30",
        disabled: "bg-white/5 text-white/30 cursor-not-allowed"
    };
    
    return (
        <button 
            onClick={disabled ? undefined : onClick} 
            className={`${base} ${disabled ? variants.disabled : variants[variant]} ${className}`}
        >
            <span className="skew-x-[10deg] flex items-center gap-2">{children}</span>
        </button>
    );
};

export const LoadingScreen = () => {
    return (
        <div className="absolute inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center font-rajdhani select-none">
            <div className="relative">
                <div className="text-8xl font-black italic tracking-tighter text-white mix-blend-difference z-10">SKY ACE</div>
                <div className="absolute top-1 left-1 text-8xl font-black italic tracking-tighter text-amber-600 opacity-50 blur-sm">SKY ACE</div>
            </div>
            <div className="mt-8 flex gap-2">
                <div className="w-2 h-2 bg-amber-500 animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-amber-500 animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-amber-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <div className="mt-4 text-xs text-slate-500 tracking-[0.5em]">INITIALIZING SYSTEMS</div>
        </div>
    );
};

export const MainMenu = ({ onStart, profile, setScreen }: { onStart: () => void, profile: PlayerProfile, setScreen: (s: string) => void }) => {
    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none p-6 font-rajdhani">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/20 to-slate-950 pointer-events-none" />
            
            {/* Header */}
            <div className="absolute top-0 left-0 w-full p-8 flex justify-between pointer-events-auto">
                 <div className="text-left">
                     <div className="text-xs text-amber-500 tracking-[0.2em] font-bold">PILOT</div>
                     <div className="text-2xl font-bold text-white">{profile.name}</div>
                 </div>
                 <div className="flex items-center gap-2 bg-black/40 px-4 py-2 border border-white/10 rounded-full">
                     <Coins className="text-amber-500" size={16} />
                     <span className="text-white font-mono font-bold">{profile.coins.toLocaleString()}</span>
                 </div>
            </div>

            <div className="pointer-events-auto flex flex-col items-center gap-8 z-10 w-full max-w-md">
                <div className="text-center mb-8">
                     <h1 className="text-8xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 drop-shadow-2xl tracking-tighter leading-none">
                        SKY<br/>ACE
                     </h1>
                </div>

                <Button onClick={onStart} className="w-full text-xl py-6">
                    <Play size={24} fill="currentColor" /> LAUNCH
                </Button>
                
                <div className="grid grid-cols-2 gap-4 w-full">
                    <Button variant="secondary" onClick={() => setScreen('GARAGE')}>
                        <ShoppingCart size={18} /> HANGAR
                    </Button>
                    <Button variant="secondary" onClick={() => setScreen('PROFILE')}>
                        <User size={18} /> PROFILE
                    </Button>
                </div>

                <div className="flex gap-4 w-full">
                    <Button variant="secondary" onClick={() => setScreen('SETTINGS')} className="flex-1">
                        <Settings size={18} /> SETTINGS
                    </Button>
                     <Button variant="secondary" onClick={() => document.documentElement.requestFullscreen()} className="flex-none px-4">
                        <Maximize size={18} />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export const Garage = ({ profile, onEquip, onBuy, onClose }: { profile: PlayerProfile, onEquip: (id: string) => void, onBuy: (id: string) => void, onClose: () => void }) => {
    const [selectedId, setSelectedId] = useState(profile.equippedSkin);
    const selectedSkin = SKINS.find(s => s.id === selectedId) || SKINS[0];
    const isUnlocked = profile.unlockedSkins.includes(selectedId);
    
    return (
        <div className="absolute inset-0 z-50 flex font-rajdhani">
            {/* Left Panel */}
            <div className="w-80 h-full bg-slate-950/90 border-r border-white/10 pointer-events-auto flex flex-col backdrop-blur-xl">
                 <div className="p-6 border-b border-white/10 flex items-center gap-4">
                     <button onClick={onClose} className="text-white hover:text-amber-500 transition-colors"><ChevronRight className="rotate-180" size={24} /></button>
                     <h2 className="text-2xl font-black tracking-widest text-white">HANGAR</h2>
                 </div>

                 <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                     {SKINS.map(skin => {
                         const owned = profile.unlockedSkins.includes(skin.id);
                         const active = selectedId === skin.id;
                         return (
                             <button
                                key={skin.id}
                                onClick={() => setSelectedId(skin.id)}
                                className={`w-full p-4 flex items-center justify-between border-l-2 transition-all ${active ? 'bg-white/10 border-amber-500' : 'bg-transparent border-transparent hover:bg-white/5'}`}
                             >
                                 <div className="text-left">
                                     <div className={`font-bold ${active ? 'text-white' : 'text-slate-400'}`}>{skin.name}</div>
                                     <div className="text-[10px] text-slate-500">{skin.isSpecial ? 'PROTOTYPE' : 'STANDARD'}</div>
                                 </div>
                                 {owned ? <Check size={14} className="text-green-500" /> : <Lock size={14} className="text-slate-600" />}
                             </button>
                         )
                     })}
                 </div>
            </div>

            {/* Bottom Panel */}
            <div className="absolute bottom-8 left-96 right-8 pointer-events-auto">
                 <Panel className="p-6 flex items-center justify-between">
                      <div>
                          <div className="text-amber-500 text-xs tracking-widest mb-1">SPECIFICATIONS</div>
                          <div className="text-4xl font-black text-white italic">{selectedSkin.name}</div>
                          <div className="text-slate-400 text-sm mt-1">
                             COST: <span className="text-white">{selectedSkin.price === 0 ? 'FREE' : selectedSkin.price}</span>
                          </div>
                      </div>
                      
                      <div className="w-48">
                          {isUnlocked ? (
                              <Button 
                                variant={profile.equippedSkin === selectedId ? 'disabled' : 'primary'}
                                onClick={() => onEquip(selectedId)}
                                disabled={profile.equippedSkin === selectedId}
                                className="w-full"
                              >
                                  {profile.equippedSkin === selectedId ? 'EQUIPPED' : 'DEPLOY'}
                              </Button>
                          ) : (
                              <Button 
                                variant={profile.coins >= selectedSkin.price ? 'primary' : 'disabled'}
                                onClick={() => onBuy(selectedId)}
                                disabled={profile.coins < selectedSkin.price}
                                className="w-full"
                              >
                                  BUY
                              </Button>
                          )}
                      </div>
                 </Panel>
            </div>
        </div>
    );
};

export const ProfileScreen = ({ profile, onRedeemCode, onClose }: any) => {
    const [code, setCode] = useState("");
    
    const handleSubmit = () => {
        if (code) {
            onRedeemCode(code);
            setCode("");
        }
    };

    return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur font-rajdhani">
        <Panel className="w-full max-w-2xl p-8">
            <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                <h2 className="text-3xl font-black italic text-white">PILOT RECORD</h2>
                <button onClick={onClose}><X className="text-slate-500 hover:text-white" size={24} /></button>
            </div>
            {/* Simple stats layout */}
            <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="bg-white/5 p-4 rounded border border-white/5">
                    <div className="text-slate-500 text-xs tracking-widest">FLIGHTS</div>
                    <div className="text-3xl text-white font-bold">{profile.stats.flights}</div>
                </div>
                 <div className="bg-white/5 p-4 rounded border border-white/5">
                    <div className="text-slate-500 text-xs tracking-widest">RANK</div>
                    <div className="text-3xl text-amber-500 font-bold">ROOKIE</div>
                </div>
            </div>
             <div className="flex gap-2">
                    <input 
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="bg-black border border-white/20 text-white p-3 w-full font-mono uppercase focus:border-amber-500 outline-none" 
                        placeholder="REDEEM CODE" 
                    />
                    <Button onClick={handleSubmit}>SUBMIT</Button>
            </div>
        </Panel>
    </div>
    );
};

export const SettingsScreen = ({ profile, updateSettings, updateCustomAudio, onClose }: any) => {
    const [devMode, setDevMode] = useState(false);
    const [accessKey, setAccessKey] = useState("");

    const checkAccess = (val: string) => {
        setAccessKey(val);
        if (val === "DEV_MASTER") {
            setDevMode(true);
        }
    };

    return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur font-rajdhani">
        <Panel className="w-full max-w-2xl p-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-black italic text-white">SYSTEM CONFIG</h2>
                <button onClick={onClose}><X className="text-slate-500 hover:text-white" size={24} /></button>
            </div>
            
            <div className="space-y-6">
                <div>
                    <div className="flex justify-between text-slate-300 text-sm mb-2">MUSIC LEVEL</div>
                    <input type="range" max="1" step="0.1" value={profile.settings.musicVolume} onChange={(e) => updateSettings('musicVolume', parseFloat(e.target.value))} className="w-full accent-amber-500 h-1 bg-white/10" />
                </div>
                 <div>
                    <div className="flex justify-between text-slate-300 text-sm mb-2">SFX LEVEL</div>
                    <input type="range" max="1" step="0.1" value={profile.settings.sfxVolume} onChange={(e) => updateSettings('sfxVolume', parseFloat(e.target.value))} className="w-full accent-amber-500 h-1 bg-white/10" />
                </div>
                
                <div className="border-t border-white/10 pt-6 mt-6">
                     <div className="text-xs text-slate-500 mb-2">ACCESS KEY</div>
                     <input 
                        type="text" 
                        value={accessKey}
                        onChange={(e) => checkAccess(e.target.value)}
                        className="bg-black/50 border border-white/10 text-white text-xs p-2 w-full font-mono mb-4"
                        placeholder="ENTER DEVELOPER KEY"
                     />
                     
                     {devMode && (
                        <div className="bg-amber-900/20 border border-amber-500/30 p-4 rounded space-y-4">
                            <h3 className="text-amber-500 font-bold flex items-center gap-2"><Upload size={16}/> CREATOR AUDIO PANEL (PERSISTENT)</h3>
                            <div className="text-[10px] text-slate-400 mb-2">NOTE: Files are saved permanently to this browser.</div>
                            
                            {[
                                {k: 'engine', label: 'ENGINE LOOP (PITCH SHIFTS)'},
                                {k: 'idle', label: 'IDLE ENGINE LOOP'},
                                {k: 'music', label: 'BG MUSIC'},
                                {k: 'click', label: 'UI CLICK SFX'},
                                {k: 'coin', label: 'COIN PICKUP SFX'},
                                {k: 'buy', label: 'SHOP BUY SFX'},
                                {k: 'win', label: 'WIN/TROPHY SFX'},
                            ].map((item) => (
                                <div key={item.k} className="border-b border-white/5 pb-2">
                                    <div className="flex justify-between items-center mb-1">
                                        <div className="text-[10px] text-amber-200">{item.label}</div>
                                        {profile.customAudio[item.k] && (
                                            <button 
                                                onClick={() => updateCustomAudio(item.k, '')}
                                                className="flex items-center gap-1 text-[9px] bg-red-500/20 text-red-300 px-2 rounded hover:bg-red-500 hover:text-white transition-colors"
                                            >
                                                <RefreshCw size={8} /> RESET
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="file"
                                            accept="audio/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    // Pass actual File object to App for IndexedDB saving
                                                    updateCustomAudio(item.k, file);
                                                }
                                            }}
                                            className="w-full text-xs text-slate-400
                                              file:mr-4 file:py-2 file:px-4
                                              file:rounded-full file:border-0
                                              file:text-xs file:font-semibold
                                              file:bg-amber-500 file:text-black
                                              hover:file:bg-amber-400 cursor-pointer"
                                        />
                                        {profile.customAudio[item.k] && (
                                             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                     )}
                </div>

                <div className="pt-4 text-center text-xs text-slate-600 font-mono">BUILD VERSION 2.6.0-BETA</div>
            </div>
        </Panel>
    </div>
    );
};
