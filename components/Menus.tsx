
import React, { useState } from 'react';
import { SKINS, PlayerProfile } from '../types';
import { Play, ShoppingCart, User, Settings, X, ChevronLeft, Lock, Check, Coins, Zap, Shield, Globe, LockKeyhole, PlusSquare, RefreshCw, Maximize, Smartphone } from 'lucide-react';

const GlassPanel = ({ children, className = "" }: any) => (
    <div className={`bg-slate-900/40 backdrop-blur-md border border-white/5 shadow-2xl overflow-hidden relative ${className}`}>
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
        {children}
    </div>
);

export const SplashScreen = ({ onStart }: any) => (
    <div className="absolute inset-0 z-[200] bg-slate-950 flex flex-col items-center justify-center font-rajdhani p-4 text-center bg-[url('https://images.unsplash.com/photo-1517976487492-5750f3195933?q=80&w=2070')] bg-cover bg-center">
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"></div>
        <div className="relative z-10 flex flex-col items-center max-w-lg">
            <h1 className="text-6xl md:text-9xl font-black italic text-white tracking-tighter leading-none mb-2">SKY<span className="text-amber-500">ACE</span></h1>
            <p className="text-slate-300 font-bold tracking-[0.4em] uppercase text-[10px] mb-8">System Status: Ready</p>
            
            <button 
                onClick={onStart}
                className="group relative flex items-center gap-4 px-10 py-4 bg-white text-black font-black text-xl skew-x-[-15deg] transition-all hover:bg-amber-500 active:scale-95"
            >
                <div className="skew-x-[15deg] flex items-center gap-3 uppercase">
                    <Maximize size={20} /> Iniciar Voo
                </div>
            </button>
        </div>
    </div>
);

export const LoadingScreen = () => (
    <div className="absolute inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center font-rajdhani p-6 text-center">
        <div className="text-4xl md:text-7xl font-black italic tracking-tighter text-white animate-pulse uppercase">Carregando Mundo...</div>
        <div className="mt-8 w-48 h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 animate-[loading_2s_ease-in-out_infinite]"></div>
        </div>
    </div>
);

export const MainMenu = ({ onStart, profile, setScreen }: any) => (
    <div className="absolute inset-0 z-50 flex flex-col md:flex-row items-center justify-between p-6 md:p-12 font-rajdhani pointer-events-none overflow-hidden">
        {/* Top/Left Section: Title & Profile Compact */}
        <div className="flex flex-col gap-4 pointer-events-auto self-start md:self-center">
            <div className="mb-4">
                <h1 className="text-5xl md:text-8xl font-black italic text-white tracking-tighter leading-none">SKY<br/><span className="text-amber-500">ACE</span></h1>
                <p className="text-slate-500 tracking-[0.2em] text-[8px] md:text-[10px] mt-2 uppercase font-bold">Flight Simulator Pro</p>
            </div>
            
            {/* Compact Pilot Info */}
            <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-2 md:p-3 pr-6 rounded-lg backdrop-blur-sm">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-500/20 rounded-md flex items-center justify-center text-amber-500">
                    <User size={20} />
                </div>
                <div>
                    <div className="text-white font-black text-sm md:text-lg leading-tight truncate max-w-[120px]">{profile.name}</div>
                    <div className="text-amber-500 text-[8px] md:text-[10px] font-bold uppercase tracking-widest">Patente: Ás</div>
                </div>
            </div>
        </div>

        {/* Center/Right Section: Main Actions */}
        <div className="pointer-events-auto flex flex-col gap-3 w-full max-w-[280px] md:max-w-xs mt-auto md:mt-0">
            <button onClick={onStart} className="group relative px-6 py-4 bg-white text-black font-black text-lg md:text-xl skew-x-[-15deg] transition-all hover:bg-amber-500 hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] active:scale-95">
                <div className="skew-x-[15deg] flex items-center justify-center gap-3 uppercase"><Play fill="black" size={20} /> Decolar</div>
            </button>

            <div className="grid grid-cols-2 gap-2">
                <button onClick={()=>setScreen('GARAGE')} className="p-3 bg-white/5 border border-white/10 text-white font-bold text-xs skew-x-[-15deg] hover:bg-white/10 transition-all uppercase">
                    <div className="skew-x-[15deg] flex items-center justify-center gap-2"><ShoppingCart size={14}/> Hangar</div>
                </button>
                <button onClick={()=>setScreen('PROFILE')} className="p-3 bg-white/5 border border-white/10 text-white font-bold text-xs skew-x-[-15deg] hover:bg-white/10 transition-all uppercase">
                    <div className="skew-x-[15deg] flex items-center justify-center gap-2"><User size={14}/> Perfil</div>
                </button>
            </div>
            
            <button onClick={()=>setScreen('SETTINGS')} className="p-2 text-slate-500 hover:text-white font-bold text-[10px] uppercase tracking-widest transition-all">Configurações de Voo</button>
        </div>
        
        {/* Balance Corner */}
        <div className="absolute top-6 right-6 pointer-events-auto flex items-center gap-3 scale-75 md:scale-100">
            <div className="text-right">
                <div className="text-[10px] text-amber-500 font-bold tracking-widest uppercase leading-none">Saldo</div>
                <div className="text-xl font-black text-white">{profile.coins.toLocaleString()} <span className="text-[10px] opacity-50 italic">CR</span></div>
            </div>
            <div className="w-10 h-10 bg-amber-500 flex items-center justify-center rounded-sm rotate-45">
                <Coins className="text-black -rotate-45" size={20} />
            </div>
        </div>
    </div>
);

export const RoomSelection = ({ onJoin, onBack }: any) => {
    const [joinCode, setJoinCode] = useState("");
    const [mode, setMode] = useState<'SELECT' | 'CREATE' | 'JOIN'>('SELECT');
    const [newRoomCode, setNewRoomCode] = useState("");

    const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let res = '';
        for (let i = 0; i < 6; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
        setNewRoomCode(res);
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 font-rajdhani">
            <GlassPanel className="w-full max-w-lg p-6 md:p-10 flex flex-col items-center">
                {mode === 'SELECT' && (
                    <>
                        <h2 className="text-3xl font-black italic text-white mb-2 uppercase">Selecionar Setor</h2>
                        <div className="w-full space-y-3 mt-6">
                            <button onClick={()=>onJoin('GLOBAL')} className="w-full flex items-center justify-between p-4 bg-amber-500 text-black font-black text-lg skew-x-[-10deg] hover:bg-amber-400 active:scale-95 transition-all">
                                <div className="skew-x-[10deg] flex items-center gap-3"><Globe size={20} /> SETOR GLOBAL</div>
                                <span className="skew-x-[10deg] text-[10px] font-bold tracking-widest bg-black/20 px-2 py-0.5 rounded">ONLINE</span>
                            </button>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={()=>{generateCode(); setMode('CREATE')}} className="p-4 bg-white/5 border border-white/10 text-white font-bold text-sm uppercase skew-x-[-10deg] hover:bg-white/10 transition-all active:scale-95">
                                    <div className="skew-x-[10deg] flex items-center justify-center gap-2"><PlusSquare size={16} /> Criar</div>
                                </button>
                                <button onClick={()=>setMode('JOIN')} className="p-4 bg-white/5 border border-white/10 text-white font-bold text-sm uppercase skew-x-[-10deg] hover:bg-white/10 transition-all active:scale-95">
                                    <div className="skew-x-[10deg] flex items-center justify-center gap-2"><LockKeyhole size={16} /> Entrar</div>
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {mode === 'CREATE' && (
                    <>
                        <h2 className="text-3xl font-black italic text-white mb-1 uppercase">Criar Missão</h2>
                        <p className="text-slate-500 text-[10px] tracking-widest uppercase mb-8 text-center">Código da Operação Gerado</p>
                        <div className="bg-black/50 border border-white/10 p-6 rounded-lg mb-8 w-full text-center">
                            <div className="text-5xl font-black text-white tracking-[0.2em]">{newRoomCode}</div>
                        </div>
                        <button onClick={() => onJoin(newRoomCode)} className="w-full py-4 bg-amber-500 text-black font-black text-lg skew-x-[-10deg] hover:bg-amber-400 active:scale-95 transition-all mb-4">
                            <span className="skew-x-[10deg]">INICIAR OPERAÇÃO</span>
                        </button>
                        <button onClick={()=>setMode('SELECT')} className="text-slate-500 text-xs font-bold uppercase tracking-widest hover:text-white">Cancelar</button>
                    </>
                )}

                {mode === 'JOIN' && (
                    <>
                        <h2 className="text-3xl font-black italic text-white mb-6 uppercase">Entrar em Setor</h2>
                        <input 
                            autoFocus value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())}
                            className="w-full bg-white/5 border border-white/10 p-4 text-white font-black tracking-[0.5em] text-2xl text-center outline-none focus:border-amber-500 transition-all mb-4" 
                            placeholder="CÓDIGO" 
                        />
                        <button onClick={() => onJoin(joinCode)} disabled={joinCode.length < 3} className="w-full py-4 bg-white text-black font-black text-lg skew-x-[-10deg] hover:bg-amber-500 transition-all disabled:opacity-30 mb-4">
                            <span className="skew-x-[10deg]">CONECTAR AO RADAR</span>
                        </button>
                        <button onClick={()=>setMode('SELECT')} className="text-slate-500 text-xs font-bold uppercase tracking-widest hover:text-white">Cancelar</button>
                    </>
                )}

                {mode === 'SELECT' && (
                    <button onClick={onBack} className="mt-8 text-slate-500 hover:text-white flex items-center gap-2 font-bold uppercase tracking-widest text-[10px]">
                        <ChevronLeft size={14} /> Voltar ao Menu
                    </button>
                )}
            </GlassPanel>
        </div>
    );
};

export const Garage = ({ profile, onEquip, onBuy, onUpgrade, onClose }: any) => {
    const [selId, setSelId] = useState(profile.equippedSkin);
    const skin = SKINS.find(s=>s.id===selId) || SKINS[0];
    const owned = profile.unlockedSkins.includes(selId);

    return (
        <div className="absolute inset-0 z-50 flex flex-col md:flex-row font-rajdhani overflow-hidden">
            <div className="w-full md:w-80 bg-slate-950/90 border-b md:border-b-0 md:border-r border-white/10 p-4 md:p-8 flex flex-col backdrop-blur-2xl">
                <button onClick={onClose} className="flex items-center gap-2 text-slate-500 hover:text-white font-bold uppercase tracking-widest text-[10px] mb-6"><ChevronLeft size={14}/> Voltar</button>
                <h2 className="text-3xl font-black italic text-white mb-6 uppercase">Hangar</h2>
                
                <div className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar max-h-[30vh] md:max-h-none">
                    {SKINS.map(s => (
                        <button key={s.id} onClick={()=>setSelId(s.id)} className={`w-full p-3 flex items-center justify-between border-l-2 transition-all ${selId===s.id?'bg-white/10 border-amber-500':'bg-transparent border-transparent hover:bg-white/5'}`}>
                            <div className="text-left">
                                <div className="font-bold text-white text-sm">{s.name}</div>
                                <div className="text-[8px] text-slate-500 uppercase">{s.price===0?'SÉRIE PILOTO':'PROTÓTIPO'}</div>
                            </div>
                            {profile.unlockedSkins.includes(s.id)?<Check size={12} className="text-green-500"/>:<Lock size={12} className="text-slate-600"/>}
                        </button>
                    ))}
                </div>

                <div className="mt-6 flex flex-col gap-2">
                    <div className="p-3 bg-white/5 rounded">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[8px] text-amber-500 font-bold uppercase">Turbo</span>
                            <span className="text-[10px] text-white">L{profile.upgrades.turbo}</span>
                        </div>
                        <div className="flex gap-1 h-0.5 bg-white/10 mb-2">
                            {[1,2,3,4,5].map(i=><div key={i} className={`flex-1 ${profile.upgrades.turbo>=i?'bg-amber-500':'bg-transparent'}`}/>)}
                        </div>
                        <button onClick={()=>onUpgrade('turbo')} disabled={profile.upgrades.turbo>=5 || profile.coins<500} className="w-full py-1.5 bg-amber-500/10 text-amber-500 font-bold text-[8px] uppercase disabled:opacity-30">Melhorar</button>
                    </div>
                </div>
            </div>

            <div className="flex-1 relative flex items-end justify-center md:justify-end p-6 md:p-12 pointer-events-none md:pointer-events-auto">
                <GlassPanel className="p-6 w-full max-w-sm">
                    <h3 className="text-3xl font-black italic text-white mb-1 uppercase">{skin.name}</h3>
                    <p className="text-slate-500 text-xs mb-6 uppercase tracking-widest">Tecnologia Aeroespacial Avançada</p>
                    
                    {owned ? (
                        <button onClick={()=>onEquip(selId)} disabled={profile.equippedSkin===selId} className="w-full py-4 bg-white text-black font-black text-lg skew-x-[-15deg] hover:bg-amber-500 active:scale-95 transition-all disabled:opacity-30">
                            <span className="skew-x-[15deg] block">{profile.equippedSkin===selId?'EM USO':'EQUIPAR'}</span>
                        </button>
                    ) : (
                        <button onClick={()=>onBuy(selId)} disabled={profile.coins<skin.price} className="w-full py-4 bg-amber-500 text-black font-black text-lg skew-x-[-15deg] hover:bg-amber-400 active:scale-95 transition-all disabled:opacity-30">
                            <span className="skew-x-[15deg] block">COMPRAR - {skin.price} CR</span>
                        </button>
                    )}
                </GlassPanel>
            </div>
        </div>
    );
};

export const ProfileScreen = ({ profile, onRedeemCode, onClose }: any) => {
    const [code, setCode] = useState("");
    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 font-rajdhani">
            <GlassPanel className="w-full max-w-xl p-8 md:p-12">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl md:text-5xl font-black italic text-white uppercase">Perfil do Piloto</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all"><X className="text-slate-500 hover:text-white" size={24} /></button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-white/5 p-4 border-l-2 border-amber-500">
                        <div className="text-[8px] text-slate-500 font-bold tracking-widest uppercase mb-1">Callsign</div>
                        <div className="text-lg md:text-xl text-white font-black">{profile.name}</div>
                    </div>
                    <div className="bg-white/5 p-4 border-l-2 border-cyan-500">
                        <div className="text-[8px] text-slate-500 font-bold tracking-widest uppercase mb-1">Missões Concluídas</div>
                        <div className="text-lg md:text-xl text-white font-black">{profile.stats.flights}</div>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <div className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Código Secreto</div>
                    <div className="flex gap-2">
                        <input value={code} onChange={e=>setCode(e.target.value)} className="flex-1 bg-black/50 border border-white/10 p-3 text-white font-black tracking-widest outline-none focus:border-amber-500 text-sm uppercase" placeholder="INSERIR CÓDIGO" />
                        <button onClick={()=>{onRedeemCode(code); setCode("")}} className="px-6 bg-white text-black font-black hover:bg-amber-500 transition-all uppercase text-xs">Ativar</button>
                    </div>
                </div>
            </GlassPanel>
        </div>
    );
};

export const SettingsScreen = ({ profile, updateSettings, onClose }: any) => (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 font-rajdhani">
        <GlassPanel className="w-full max-w-md p-8 md:p-10">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-black italic text-white uppercase">Sistemas</h2>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all"><X className="text-slate-500 hover:text-white" size={24} /></button>
            </div>
            
            <div className="space-y-6">
                <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest"><span>Volume Música</span><span>{Math.round(profile.settings.musicVolume*100)}%</span></div>
                    <input type="range" max="1" step="0.05" value={profile.settings.musicVolume} onChange={e=>updateSettings('musicVolume', parseFloat(e.target.value))} className="w-full accent-amber-500 h-1 bg-white/10 rounded-full cursor-pointer" />
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest"><span>Volume Efeitos</span><span>{Math.round(profile.settings.sfxVolume*100)}%</span></div>
                    <input type="range" max="1" step="0.05" value={profile.settings.sfxVolume} onChange={e=>updateSettings('sfxVolume', parseFloat(e.target.value))} className="w-full accent-amber-500 h-1 bg-white/10 rounded-full cursor-pointer" />
                </div>
                
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Inverter Eixo Y</div>
                    <button onClick={()=>updateSettings('invertedLook', !profile.settings.invertedLook)} className={`w-12 h-6 rounded-full transition-all relative ${profile.settings.invertedLook?'bg-amber-500':'bg-white/10'}`}>
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${profile.settings.invertedLook?'left-7':'left-1'}`}></div>
                    </button>
                </div>
            </div>
        </GlassPanel>
    </div>
);
