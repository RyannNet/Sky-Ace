
import React, { useState } from 'react';
import { SKINS, PlayerProfile } from '../types';
import { Play, ShoppingCart, User, Settings, X, ChevronLeft, Lock, Check, Coins, Zap, Shield, Globe, LockKeyhole } from 'lucide-react';

const GlassPanel = ({ children, className = "" }: any) => (
    <div className={`bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden relative ${className}`}>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-40"></div>
        {children}
    </div>
);

export const LoadingScreen = () => (
    <div className="absolute inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center font-rajdhani p-6 text-center">
        <div className="text-6xl md:text-8xl font-black italic tracking-tighter text-white animate-pulse">SKY ACE</div>
        <div className="mt-8 md:mt-12 w-48 md:w-64 h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 animate-[loading_2s_ease-in-out_infinite]"></div>
        </div>
        <div className="mt-4 text-[8px] md:text-[10px] text-slate-500 tracking-[0.5em] md:tracking-[0.8em] uppercase">Initializing Flight Deck</div>
        <style>{`@keyframes loading { 0% { width: 0%; transform: translateX(-100%); } 100% { width: 100%; transform: translateX(100%); } }`}</style>
    </div>
);

export const MainMenu = ({ onStart, profile, setScreen }: any) => (
    <div className="absolute inset-0 z-50 flex flex-col items-center md:items-start justify-center p-6 md:p-12 bg-gradient-to-b md:bg-gradient-to-r from-slate-950 via-slate-950/40 to-transparent font-rajdhani pointer-events-none">
        <div className="pointer-events-auto flex flex-col gap-4 md:gap-6 w-full max-w-xs md:max-w-md text-center md:text-left">
            <div className="mb-6 md:mb-12">
                <h1 className="text-7xl md:text-9xl font-black italic text-white tracking-tighter leading-[0.8]">SKY<br/><span className="text-amber-500">ACE</span></h1>
                <p className="text-slate-500 tracking-[0.3em] md:tracking-[0.4em] text-[10px] md:text-xs mt-3 md:mt-4 uppercase font-bold">Next-Gen Flight Simulator</p>
            </div>

            <button onClick={onStart} className="group relative px-6 py-4 md:px-8 md:py-6 bg-white text-black font-black text-xl md:text-2xl skew-x-[-15deg] transition-all hover:bg-amber-500 hover:shadow-[0_0_40px_rgba(245,158,11,0.5)] active:scale-95">
                <div className="skew-x-[15deg] flex items-center justify-center md:justify-start gap-4"><Play fill="black" size={24} /> START MISSION</div>
            </button>

            <div className="grid grid-cols-2 gap-3 md:gap-4 mt-2">
                <button onClick={()=>setScreen('GARAGE')} className="p-3 md:p-4 bg-white/5 border border-white/10 text-white font-bold text-sm md:text-base skew-x-[-15deg] hover:bg-white/10 transition-all active:scale-95">
                    <div className="skew-x-[15deg] flex items-center justify-center gap-2"><ShoppingCart size={16}/> HANGAR</div>
                </button>
                <button onClick={()=>setScreen('PROFILE')} className="p-3 md:p-4 bg-white/5 border border-white/10 text-white font-bold text-sm md:text-base skew-x-[-15deg] hover:bg-white/10 transition-all active:scale-95">
                    <div className="skew-x-[15deg] flex items-center justify-center gap-2"><User size={16}/> PILOT</div>
                </button>
            </div>

            <button onClick={()=>setScreen('SETTINGS')} className="p-3 md:p-4 bg-white/5 border border-white/10 text-white font-bold text-sm md:text-base skew-x-[-15deg] hover:bg-white/10 transition-all active:scale-95">
                <div className="skew-x-[15deg] flex items-center justify-center gap-2"><Settings size={16}/> SETTINGS</div>
            </button>
        </div>
        
        <div className="absolute top-6 right-6 md:top-12 md:right-12 pointer-events-auto flex items-center gap-3 md:gap-4 scale-90 md:scale-100">
            <div className="text-right">
                <div className="text-[8px] md:text-[10px] text-amber-500 font-bold tracking-widest uppercase">Balance</div>
                <div className="text-xl md:text-2xl font-black text-white">{profile.coins.toLocaleString()} <span className="text-[10px] opacity-50">CR</span></div>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center">
                <Coins className="text-amber-500" size={20} />
            </div>
        </div>
    </div>
);

export const RoomSelection = ({ onJoin, onBack }: any) => {
    const [code, setCode] = useState("");
    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4 font-rajdhani">
            <GlassPanel className="w-full max-w-xl p-6 md:p-12">
                <h2 className="text-3xl md:text-5xl font-black italic text-white mb-1 md:mb-2">LOBBY SELECT</h2>
                <p className="text-slate-500 mb-8 md:mb-12 tracking-widest uppercase text-[10px] md:text-xs">Choose your operational theatre</p>
                
                <div className="grid grid-cols-1 gap-4 md:gap-6">
                    <button onClick={()=>onJoin('GLOBAL')} className="flex items-center justify-between p-4 md:p-6 bg-amber-500 text-black font-black text-lg md:text-xl skew-x-[-10deg] hover:shadow-2xl transition-all active:scale-95">
                        <div className="skew-x-[10deg] flex items-center gap-3 md:gap-4"><Globe /> GLOBAL THEATRE</div>
                        <span className="skew-x-[10deg] text-[10px] opacity-70">OPEN</span>
                    </button>

                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                        <div className="relative flex justify-center text-[10px] uppercase text-slate-500 tracking-widest"><span className="bg-slate-900 px-3 md:px-4">Private Sector</span></div>
                    </div>

                    <div className="flex gap-2 md:gap-3">
                        <input 
                            value={code} onChange={e=>setCode(e.target.value.toUpperCase())}
                            className="flex-1 bg-white/5 border border-white/10 p-3 md:p-5 text-white font-bold tracking-widest outline-none focus:border-amber-500 transition-all skew-x-[-10deg] text-sm md:text-base" 
                            placeholder="ROOM CODE" 
                        />
                        <button onClick={()=>code && onJoin(code)} className="px-5 md:px-8 bg-white text-black font-black skew-x-[-10deg] hover:bg-amber-400 transition-all disabled:opacity-50 active:scale-95" disabled={!code}>
                            <div className="skew-x-[10deg]"><LockKeyhole size={20}/></div>
                        </button>
                    </div>
                </div>

                <button onClick={onBack} className="mt-8 md:mt-12 text-slate-500 hover:text-white flex items-center gap-2 font-bold uppercase tracking-widest text-[10px] md:text-xs">
                    <ChevronLeft size={14} /> Abort Selection
                </button>
            </GlassPanel>
        </div>
    );
};

export const Garage = ({ profile, onEquip, onBuy, onUpgrade, onClose }: any) => {
    const [selId, setSelId] = useState(profile.equippedSkin);
    const skin = SKINS.find(s=>s.id===selId) || SKINS[0];
    const owned = profile.unlockedSkins.includes(selId);

    return (
        <div className="absolute inset-0 z-50 flex flex-col md:flex-row font-rajdhani">
            <div className="w-full md:w-80 lg:w-96 bg-slate-950/90 border-b md:border-b-0 md:border-r border-white/10 p-4 md:p-8 flex flex-col backdrop-blur-2xl max-h-[40vh] md:max-h-none">
                <button onClick={onClose} className="flex items-center gap-2 text-slate-500 hover:text-white font-bold uppercase tracking-widest text-[10px] md:text-xs mb-4 md:mb-12"><ChevronLeft size={14}/> Back</button>
                <h2 className="text-2xl md:text-4xl font-black italic text-white mb-4 md:mb-8">HANGAR</h2>
                
                <div className="flex-1 space-y-2 md:space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                    {SKINS.map(s => (
                        <button key={s.id} onClick={()=>setSelId(s.id)} className={`w-full p-3 md:p-4 flex items-center justify-between border-l-2 md:border-l-4 transition-all ${selId===s.id?'bg-white/10 border-amber-500':'bg-transparent border-transparent hover:bg-white/5'}`}>
                            <div className="text-left">
                                <div className="font-bold text-white text-sm md:text-base">{s.name}</div>
                                <div className="text-[9px] md:text-[10px] text-slate-500 uppercase">{s.price===0?'Standard':'Prototype'}</div>
                            </div>
                            {profile.unlockedSkins.includes(s.id)?<Check size={12} className="text-green-500"/>:<Lock size={12} className="text-slate-600"/>}
                        </button>
                    ))}
                </div>

                <div className="mt-4 md:mt-8 grid grid-cols-2 md:grid-cols-1 gap-2 md:gap-4">
                    <div className="p-3 md:p-4 bg-white/5 border border-white/5 rounded">
                        <div className="flex justify-between items-center mb-1 md:mb-2">
                            <span className="text-[8px] md:text-[10px] text-amber-500 font-bold uppercase"><Zap size={10} className="inline mr-1"/> Turbo</span>
                            <span className="text-[9px] md:text-xs text-white">L{profile.upgrades.turbo}</span>
                        </div>
                        <div className="flex gap-1 h-1 bg-white/10 mb-2">
                            {[1,2,3,4,5].map(i=><div key={i} className={`flex-1 ${profile.upgrades.turbo>=i?'bg-amber-500':'bg-transparent'}`}/>)}
                        </div>
                        <button onClick={()=>onUpgrade('turbo')} disabled={profile.upgrades.turbo>=5 || profile.coins<500} className="w-full py-1 md:py-2 bg-amber-500/20 text-amber-500 font-bold text-[8px] md:text-[10px] uppercase transition-all disabled:opacity-30">Upgrade</button>
                    </div>

                    <div className="p-3 md:p-4 bg-white/5 border border-white/5 rounded">
                        <div className="flex justify-between items-center mb-1 md:mb-2">
                            <span className="text-[8px] md:text-[10px] text-cyan-400 font-bold uppercase"><Shield size={10} className="inline mr-1"/> Aero</span>
                            <span className="text-[9px] md:text-xs text-white">L{profile.upgrades.handling}</span>
                        </div>
                        <div className="flex gap-1 h-1 bg-white/10 mb-2">
                            {[1,2,3,4,5].map(i=><div key={i} className={`flex-1 ${profile.upgrades.handling>=i?'bg-cyan-400':'bg-transparent'}`}/>)}
                        </div>
                        <button onClick={()=>onUpgrade('handling')} disabled={profile.upgrades.handling>=5 || profile.coins<500} className="w-full py-1 md:py-2 bg-cyan-400/20 text-cyan-400 font-bold text-[8px] md:text-[10px] uppercase transition-all disabled:opacity-30">Upgrade</button>
                    </div>
                </div>
            </div>

            <div className="flex-1 relative pointer-events-none md:pointer-events-auto">
                <div className="absolute bottom-6 md:bottom-12 right-6 md:right-12 flex flex-col items-center md:items-end gap-4 md:gap-6 pointer-events-auto w-[calc(100%-3rem)] md:w-auto">
                    <GlassPanel className="p-6 md:p-10 w-full md:w-96">
                        <div className="text-[10px] text-amber-500 font-bold tracking-widest mb-1 md:mb-2 uppercase">Specifications</div>
                        <h3 className="text-3xl md:text-5xl font-black italic text-white mb-1">{skin.name}</h3>
                        <p className="text-slate-500 text-xs md:text-sm mb-6 md:mb-8">Combat-ready aerospace technology.</p>
                        
                        {owned ? (
                            <button onClick={()=>onEquip(selId)} disabled={profile.equippedSkin===selId} className="w-full py-4 md:py-5 bg-white text-black font-black text-lg md:text-xl skew-x-[-15deg] hover:bg-amber-500 transition-all disabled:opacity-30 active:scale-95">
                                <span className="skew-x-[15deg] block">{profile.equippedSkin===selId?'ACTIVE':'DEPLOY'}</span>
                            </button>
                        ) : (
                            <button onClick={()=>onBuy(selId)} disabled={profile.coins<skin.price} className="w-full py-4 md:py-5 bg-amber-500 text-black font-black text-lg md:text-xl skew-x-[-15deg] hover:bg-amber-400 transition-all disabled:opacity-30 active:scale-95">
                                <span className="skew-x-[15deg] block">BUY {skin.price} CR</span>
                            </button>
                        )}
                    </GlassPanel>
                </div>
            </div>
        </div>
    );
};

export const ProfileScreen = ({ profile, onRedeemCode, onClose }: any) => {
    const [code, setCode] = useState("");
    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-2xl p-4 font-rajdhani">
            <GlassPanel className="w-full max-w-2xl p-6 md:p-16">
                <div className="flex justify-between items-start mb-8 md:mb-12">
                    <div>
                        <h2 className="text-4xl md:text-6xl font-black italic text-white leading-tight">PILOT<br/>DOSSIER</h2>
                        <div className="h-1 w-16 md:w-24 bg-amber-500 mt-2 md:mt-4"></div>
                    </div>
                    <button onClick={onClose} className="p-2"><X className="text-slate-500 hover:text-white" size={28} /></button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 md:gap-8 mb-8 md:mb-12">
                    <div className="bg-white/5 p-4 md:p-6 border-l-2 border-amber-500">
                        <div className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mb-1">Callsign</div>
                        <div className="text-xl md:text-3xl text-white font-black truncate">{profile.name}</div>
                    </div>
                    <div className="bg-white/5 p-4 md:p-6 border-l-2 border-cyan-500">
                        <div className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mb-1">Missions</div>
                        <div className="text-xl md:text-3xl text-white font-black tabular-nums">{profile.stats.flights}</div>
                    </div>
                </div>

                <div className="flex flex-col gap-3 md:gap-4">
                    <div className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Secret Operations Code</div>
                    <div className="flex flex-col md:flex-row gap-2">
                        <input value={code} onChange={e=>setCode(e.target.value)} className="flex-1 bg-black border border-white/10 p-3 md:p-5 text-white font-black tracking-[0.2em] md:tracking-[0.5em] outline-none focus:border-amber-500 text-sm md:text-base uppercase" placeholder="ENTER CODE" />
                        <button onClick={()=>{onRedeemCode(code); setCode("")}} className="py-3 md:py-0 px-10 bg-white text-black font-black hover:bg-amber-500 transition-all active:scale-95">SUBMIT</button>
                    </div>
                </div>
            </GlassPanel>
        </div>
    );
};

export const SettingsScreen = ({ profile, updateSettings, onClose }: any) => (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-2xl p-4 font-rajdhani">
        <GlassPanel className="w-full max-w-xl p-6 md:p-12">
            <div className="flex justify-between items-center mb-8 md:mb-12">
                <h2 className="text-3xl md:text-5xl font-black italic text-white">SYSTEMS</h2>
                <button onClick={onClose} className="p-2"><X className="text-slate-500 hover:text-white" size={28} /></button>
            </div>
            
            <div className="space-y-6 md:space-y-8">
                <div className="space-y-3 md:space-y-4">
                    <div className="flex justify-between text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest"><span>Music Volume</span><span>{Math.round(profile.settings.musicVolume*100)}%</span></div>
                    <input type="range" max="1" step="0.05" value={profile.settings.musicVolume} onChange={e=>updateSettings('musicVolume', parseFloat(e.target.value))} className="w-full accent-amber-500 h-1 bg-white/10 rounded-full cursor-pointer" />
                </div>
                <div className="space-y-3 md:space-y-4">
                    <div className="flex justify-between text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest"><span>SFX Volume</span><span>{Math.round(profile.settings.sfxVolume*100)}%</span></div>
                    <input type="range" max="1" step="0.05" value={profile.settings.sfxVolume} onChange={e=>updateSettings('sfxVolume', parseFloat(e.target.value))} className="w-full accent-amber-500 h-1 bg-white/10 rounded-full cursor-pointer" />
                </div>
                
                <div className="flex items-center justify-between p-4 md:p-6 bg-white/5 border border-white/5">
                    <div className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">Inverted Pitch</div>
                    <button onClick={()=>updateSettings('invertedLook', !profile.settings.invertedLook)} className={`w-12 md:w-14 h-6 md:h-7 rounded-full transition-all relative ${profile.settings.invertedLook?'bg-amber-500':'bg-white/10'}`}>
                        <div className={`absolute top-1 w-4 md:w-5 h-4 md:h-5 rounded-full bg-white transition-all ${profile.settings.invertedLook?'left-7 md:left-8':'left-1'}`}></div>
                    </button>
                </div>
            </div>

            <div className="mt-8 md:mt-12 text-center text-[9px] text-slate-700 font-mono tracking-widest uppercase">SKY-ACE ENGINE v4.2.0 STABLE</div>
        </GlassPanel>
    </div>
);
