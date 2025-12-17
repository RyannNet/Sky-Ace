
import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Vector3, Quaternion, Euler, MathUtils, Group } from 'three';
import { io, Socket } from 'socket.io-client';
import { PlaneModel } from './components/Plane';
import { World } from './components/World';
import { HUD } from './components/HUD';
import { MainMenu, Garage, ProfileScreen, SettingsScreen, LoadingScreen, RoomSelection } from './components/Menus';
import { SoundManager } from './components/SoundManager';
import { MobileControls } from './components/Controls';
import { GameState, FlightData, ControlsState, GRAVITY, MAX_FUEL, PlayerProfile, SKINS, MapObject, NetworkPlayerData, MAX_SPEED_BASE, STALL_SPEED } from './types';

const INITIAL_MAP_DATA: MapObject[] = [
    { id: 'canyon-1', type: 'BUILDING_TALL', position: [-80, 0, -400], scale: [30, 180, 30] },
    { id: 'canyon-2', type: 'BUILDING_TALL', position: [80, 0, -400], scale: [30, 200, 30] },
    { id: 'slalom-1', type: 'PYRAMID', position: [0, 0, -1200], scale: [60, 60, 60] },
];

const loadProfile = (): PlayerProfile => {
    try {
        const saved = localStorage.getItem('skyace_v7_profile');
        if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
        name: "Pilot_" + Math.floor(Math.random() * 9999),
        coins: 1000,
        unlockedSkins: ['default'],
        equippedSkin: 'default',
        upgrades: { turbo: 1, handling: 1 },
        stats: { flights: 0, crashes: 0, flightTime: 0, maxAltitude: 0 },
        settings: { musicVolume: 0.5, sfxVolume: 0.5, sensitivity: 1.0, invertedLook: false },
        customAudio: { engine: '', idle: '', music: '', click: '', coin: '', buy: '', win: '' }
    };
};

const NetworkPlane: React.FC<{ data: NetworkPlayerData }> = ({ data }) => {
    const groupRef = useRef<Group>(null);
    const skin = SKINS.find(s => s.id === data.skin) || SKINS[0];
    useFrame(() => {
        if (groupRef.current) {
            groupRef.current.position.set(data.x, data.y, data.z);
            groupRef.current.quaternion.set(data.qx, data.qy, data.qz, data.qw);
        }
    });
    return <PlaneModel ref={groupRef} playerName={data.name} skin={skin} physicsPosition={new Vector3(data.x, data.y, data.z)} showNameTag={true} />;
};

function GameLoop({ onUpdate, onGameOver, controls, gameState, cameraMode, profile, setPlayerCount, setNetworkStatus, chatMessages, setChatMessages }: any) {
  const planeRef = useRef<Group>(null);
  const planePosition = useRef(new Vector3((Math.random() - 0.5) * 10, 0, 400));
  const planeRotation = useRef(new Quaternion());
  const planeEuler = useRef(new Euler(0, 0, 0));
  const speedRef = useRef(0);
  const throttleRef = useRef(0);
  const { camera } = useThree();

  const socketRef = useRef<Socket | null>(null);
  const [networkPlayers, setNetworkPlayers] = useState<Record<string, NetworkPlayerData>>({});
  const updateTimer = useRef(0);

  // Stats from Upgrades
  const maxSpeed = MAX_SPEED_BASE + (profile.upgrades.turbo - 1) * 25;
  const handlingMult = 1 + (profile.upgrades.handling - 1) * 0.15;

  useEffect(() => {
    const socket = io({ transports: ['websocket'], upgrade: false });
    socketRef.current = socket;

    socket.on('connect', () => {
        setNetworkStatus("CONNECTED");
        socket.emit('join', { name: profile.name, skin: profile.equippedSkin, room: gameState.currentRoom });
    });

    socket.on('currentPlayers', (players: any) => {
        const others: Record<string, NetworkPlayerData> = {};
        let count = 0;
        Object.keys(players).forEach(id => {
            if (id !== socket.id && players[id].room === gameState.currentRoom) {
                others[id] = players[id];
            }
            if (players[id].room === gameState.currentRoom) count++;
        });
        setNetworkPlayers(others);
        setPlayerCount(count);
    });

    socket.on('playerJoined', (player: any) => {
        if (player.room === gameState.currentRoom) {
            setNetworkPlayers(prev => ({ ...prev, [player.id]: player }));
            setPlayerCount((c: number) => c + 1);
        }
    });

    socket.on('playerMoved', ({ id, data }: any) => {
        setNetworkPlayers(prev => prev[id] ? { ...prev, [id]: { ...prev[id], ...data } } : prev);
    });

    socket.on('playerLeft', (id: string) => {
        setNetworkPlayers(prev => {
            const next = { ...prev };
            if (next[id]) {
                delete next[id];
                setPlayerCount((c: number) => Math.max(1, c - 1));
            }
            return next;
        });
    });

    socket.on('chatMessage', (msg: any) => {
        if (msg.room === gameState.currentRoom) {
            setChatMessages((prev: any) => [...prev, msg].slice(-5));
        }
    });

    return () => { socket.disconnect(); };
  }, [profile.name, gameState.currentRoom]);

  useFrame((state, delta) => {
    if (!gameState.isPlaying || gameState.isGameOver || gameState.isPaused) return;
    const dt = Math.min(delta, 0.1);

    if (controls.current.throttleUp) throttleRef.current = Math.min(throttleRef.current + 0.6 * dt, 1);
    if (controls.current.throttleDown) throttleRef.current = Math.max(throttleRef.current - 0.6 * dt, 0);

    const pitchInput = ((controls.current.pitchUp ? 1 : 0) - (controls.current.pitchDown ? 1 : 0) + (controls.current.joyPitch || 0)) * handlingMult;
    const rollInput = ((controls.current.rollLeft ? 1 : 0) - (controls.current.rollRight ? 1 : 0) - (controls.current.joyRoll || 0)) * handlingMult;
    const finalPitch = profile.settings.invertedLook ? -pitchInput : pitchInput;

    const isGrounded = planePosition.current.y <= 0.1;
    const authority = Math.min(speedRef.current / 60, 1.0) * profile.settings.sensitivity;

    if (isGrounded) {
        planeEuler.current.y += rollInput * dt * Math.max(0.2, 1 - (speedRef.current / maxSpeed));
        if (speedRef.current > 60 && finalPitch > 0) planeEuler.current.x += finalPitch * authority * dt;
        else planeEuler.current.x = MathUtils.lerp(planeEuler.current.x, 0, dt * 5);
        planeEuler.current.z = MathUtils.lerp(planeEuler.current.z, 0, dt * 10);
    } else {
        planeEuler.current.x += finalPitch * authority * dt * 1.5;
        planeEuler.current.z += rollInput * authority * dt * 2.5;
        planeEuler.current.y += planeEuler.current.z * authority * dt * 0.8;
    }

    planeEuler.current.x = MathUtils.clamp(planeEuler.current.x, -1.2, 1.2);
    planeRotation.current.setFromEuler(planeEuler.current);
    const forward = new Vector3(0, 0, -1).applyQuaternion(planeRotation.current);
    
    speedRef.current += (throttleRef.current * 160 - speedRef.current * speedRef.current * 0.00025 + forward.y * -35) * dt;
    if (isGrounded) speedRef.current -= speedRef.current * 0.25 * dt;
    speedRef.current = Math.max(0, Math.min(speedRef.current, maxSpeed));

    const move = forward.clone().multiplyScalar(speedRef.current * dt);
    if (!isGrounded && speedRef.current < STALL_SPEED) move.y -= 20 * dt;
    planePosition.current.add(move);

    if (planePosition.current.y < 0) {
       if (move.y < -3.5 || Math.abs(planeEuler.current.z) > 0.7) onGameOver('CRASH');
       else { planePosition.current.y = 0; planeEuler.current.x = 0; planeEuler.current.z = 0; }
    }

    if (planeRef.current) {
        planeRef.current.position.copy(planePosition.current);
        planeRef.current.quaternion.copy(planeRotation.current);
    }

    if (socketRef.current?.connected) {
        updateTimer.current += dt;
        if (updateTimer.current > 0.05) {
            socketRef.current.emit('updateMovement', {
                x: planePosition.current.x, y: planePosition.current.y, z: planePosition.current.z,
                qx: planeRotation.current.x, qy: planeRotation.current.y, qz: planeRotation.current.z, qw: planeRotation.current.w,
            });
            updateTimer.current = 0;
        }
    }

    const camOffset = cameraMode === 'FIRST' ? new Vector3(0, 0.6, -0.5) : new Vector3(0, 7, 16);
    const camTarget = planePosition.current.clone().add(camOffset.applyQuaternion(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), planeEuler.current.y)));
    camera.position.lerp(camTarget, cameraMode === 'FIRST' ? 0.6 : 0.1);
    camera.lookAt(planePosition.current.clone().add(forward.multiplyScalar(30)));

    onUpdate({ speed: speedRef.current, altitude: planePosition.current.y, fuel: 100, heading: MathUtils.radToDeg(planeEuler.current.y), pitch: MathUtils.radToDeg(planeEuler.current.x), roll: MathUtils.radToDeg(planeEuler.current.z), isGrounded });
  });

  return (
    <>
        <PlaneModel ref={planeRef} playerName={profile.name} skin={SKINS.find(s=>s.id===profile.equippedSkin)||SKINS[0]} physicsPosition={planePosition.current} showNameTag={true} />
        {Object.values(networkPlayers).map((p: any) => <NetworkPlane key={p.id} data={p} />)}
        <World mapObjects={INITIAL_MAP_DATA} isEditorMode={false} onPlaceObject={()=>{}} onRemoveObject={()=>{}} />
    </>
  );
}

export default function App() {
  const [profile, setProfile] = useState<PlayerProfile>(loadProfile());
  const [screen, setScreen] = useState<'LOADING'|'MENU'|'GAME'|'GARAGE'|'PROFILE'|'SETTINGS'|'ROOMS'>('LOADING');
  const [gameState, setGameState] = useState<GameState>({ isPlaying: false, isPaused: false, isGameOver: false, gameOverReason: null, currentRoom: 'GLOBAL' });
  const [flightData, setFlightData] = useState<FlightData>({ speed: 0, altitude: 0, fuel: 100, heading: 0, pitch: 0, roll: 0, isGrounded: true });
  const [cameraMode, setCameraMode] = useState<'THIRD' | 'FIRST'>('THIRD');
  const [playerCount, setPlayerCount] = useState(1);
  const [networkStatus, setNetworkStatus] = useState("OFFLINE");
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const controls = useRef<ControlsState>({ throttleUp: false, throttleDown: false, pitchUp: false, pitchDown: false, rollLeft: false, rollRight: false, yawLeft: false, yawRight: false, joyPitch: 0, joyRoll: 0 });

  useEffect(() => { setTimeout(() => setScreen('MENU'), 2500); }, []);
  useEffect(() => localStorage.setItem('skyace_v7_profile', JSON.stringify(profile)), [profile]);

  const handleRedeemCode = (code: string) => {
      const c = code.toUpperCase().trim();
      if (c === "GABI" || c === "KAZADA") {
          setProfile(p => ({ ...p, unlockedSkins: Array.from(new Set([...p.unlockedSkins, 'kazada'])), coins: p.coins + 5000 }));
          alert("GABI SKIN & 5K COINS UNLOCKED!");
      } else if (c === "PEDRO" || c === "SKYKING") {
          setProfile(p => ({ ...p, unlockedSkins: Array.from(new Set([...p.unlockedSkins, 'pedro'])), coins: p.coins + 5000 }));
          alert("PEDRO SKIN & 5K COINS UNLOCKED!");
      } else { alert("INVALID CODE"); }
  };

  const handleUpgrade = (type: 'turbo'|'handling') => {
      const currentLevel = profile.upgrades[type];
      if (currentLevel < 5 && profile.coins >= 500) {
          setProfile(p => ({ ...p, coins: p.coins - 500, upgrades: { ...p.upgrades, [type]: currentLevel + 1 } }));
      }
  };

  return (
    <div className="w-full h-full relative bg-slate-950 overflow-hidden font-rajdhani">
        {screen === 'LOADING' && <LoadingScreen />}
        <Canvas shadows camera={{ position: [5, 5, 410], fov: 60 }}>
            <SoundManager throttle={0} speed={0} isPaused={false} isGameOver={false} volume={{music:profile.settings.musicVolume, sfx:profile.settings.sfxVolume}} customAudio={profile.customAudio} triggerSfx={null} />
            {screen === 'GAME' ? (
                <GameLoop 
                    onUpdate={setFlightData} onGameOver={(r:any)=>setGameState(prev=>({...prev, isPlaying:false, isGameOver:true, gameOverReason:r}))}
                    controls={controls} gameState={gameState} cameraMode={cameraMode} profile={profile} setPlayerCount={setPlayerCount} setNetworkStatus={setNetworkStatus}
                    chatMessages={chatMessages} setChatMessages={setChatMessages}
                />
            ) : (
                <group position={[0,0,400]}>
                    <ambientLight intensity={1.5}/><pointLight position={[10,10,10]} intensity={2}/>
                    <PlaneModel playerName={profile.name} skin={SKINS.find(s=>s.id===profile.equippedSkin)||SKINS[0]} physicsPosition={new Vector3(0,0,400)} />
                </group>
            )}
        </Canvas>

        {screen === 'MENU' && <MainMenu onStart={()=>setScreen('ROOMS')} profile={profile} setScreen={(s:any)=>setScreen(s)} />}
        {screen === 'ROOMS' && <RoomSelection onJoin={(code:string)=>{setGameState(p=>({...p, isPlaying:true, currentRoom:code})); setScreen('GAME');}} onBack={()=>setScreen('MENU')} />}
        {screen === 'GARAGE' && <Garage profile={profile} onEquip={(id)=>setProfile(p=>({...p, equippedSkin:id}))} onBuy={(id)=>setProfile(p=>({...p, coins:p.coins-SKINS.find(s=>s.id===id)!.price, unlockedSkins:[...p.unlockedSkins, id]}))} onUpgrade={handleUpgrade} onClose={()=>setScreen('MENU')} />}
        {screen === 'PROFILE' && <ProfileScreen profile={profile} onRedeemCode={handleRedeemCode} onClose={()=>setScreen('MENU')} />}
        {screen === 'SETTINGS' && <SettingsScreen profile={profile} updateSettings={(k:any,v:any)=>setProfile(p=>({...p,settings:{...p.settings,[k]:v}}))} onClose={()=>setScreen('MENU')} />}

        {screen === 'GAME' && (
            <HUD 
                flightData={flightData} gameState={gameState} onReset={()=>setScreen('MENU')} toggleCamera={()=>setCameraMode(m=>m==='THIRD'?'FIRST':'THIRD')} cameraMode={cameraMode} onPause={()=>setGameState(g=>({...g,isPaused:!g.isPaused}))}
                playerCount={playerCount} networkStatus={networkStatus} chatMessages={chatMessages}
            />
        )}
        {screen === 'GAME' && !gameState.isGameOver && <MobileControls controls={controls} />}
    </div>
  );
}
