
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Vector3, Quaternion, Euler, MathUtils, Group } from 'three';
import { io, Socket } from 'socket.io-client';
import { PlaneModel } from './components/Plane';
import { World } from './components/World';
import { HUD } from './components/HUD';
import { MainMenu, Garage, ProfileScreen, SettingsScreen, LoadingScreen } from './components/Menus';
import { SoundManager } from './components/SoundManager';
import { MobileControls } from './components/Controls';
import { GameState, FlightData, ControlsState, GRAVITY, MAX_SPEED, STALL_SPEED, MAX_FUEL, PlayerProfile, SKINS, MapObject, MapObjectType, NetworkPlayerData } from './types';
import { v4 as uuidv4 } from 'uuid';

// --- INITIAL MAP DATA ---
const INITIAL_MAP_DATA: MapObject[] = [
    { id: 'canyon-1', type: 'BUILDING_TALL', position: [-80, 0, -400], scale: [30, 180, 30] },
    { id: 'canyon-2', type: 'BUILDING_TALL', position: [80, 0, -400], scale: [30, 200, 30] },
    { id: 'canyon-3', type: 'BUILDING_TALL', position: [-90, 0, -600], scale: [40, 220, 40] },
    { id: 'canyon-4', type: 'BUILDING_TALL', position: [90, 0, -600], scale: [40, 150, 40] },
    { id: 'slalom-1', type: 'PYRAMID', position: [0, 0, -1200], scale: [60, 60, 60] },
    { id: 'gate-1', type: 'BUILDING_TALL', position: [-150, 0, -3000], scale: [50, 300, 50] },
    { id: 'gate-2', type: 'BUILDING_TALL', position: [150, 0, -3000], scale: [50, 300, 50] },
];

const loadProfile = (): PlayerProfile => {
    try {
        const saved = localStorage.getItem('skyace_profile_v6'); 
        if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
        name: "Piloto_" + Math.floor(Math.random() * 999),
        coins: 500,
        unlockedSkins: ['default'], 
        equippedSkin: 'default',
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

function GameLoop({ 
  onUpdate, onGameOver, controls, gameState, cameraMode, profile, onAddCoin, mapObjects, isVoiceEnabled, setVoiceStatus, setPlayerCount, setNetworkStatus, handlePlaceObject, handleRemoveObject
}: any) {
  const planeRef = useRef<Group>(null);
  const planePosition = useRef(new Vector3((Math.random() - 0.5) * 5, 0, 400)); 
  const planeRotation = useRef(new Quaternion());
  const planeEuler = useRef(new Euler(0, 0, 0)); 
  const speedRef = useRef(0);
  const throttleRef = useRef(0); 
  const { camera } = useThree();

  const socketRef = useRef<Socket | null>(null);
  const [networkPlayers, setNetworkPlayers] = useState<Record<string, NetworkPlayerData>>({});
  const updateTimer = useRef(0);

  useEffect(() => {
    const socket = io({ transports: ['websocket'], upgrade: false });
    socketRef.current = socket;

    socket.on('connect', () => {
        setNetworkStatus("CONNECTED");
        socket.emit('join', { name: profile.name, skin: profile.equippedSkin });
    });

    socket.on('disconnect', () => setNetworkStatus("DISCONNECTED"));
    socket.on('connect_error', () => setNetworkStatus("ERROR"));

    socket.on('currentPlayers', (players: any) => {
        const others = { ...players };
        if (socket.id) delete others[socket.id];
        setNetworkPlayers(others);
        setPlayerCount(Object.keys(players).length);
    });

    socket.on('playerJoined', (player: any) => {
        setNetworkPlayers(prev => {
            const next = { ...prev, [player.id]: player };
            setPlayerCount(Object.keys(next).length + 1);
            return next;
        });
    });

    socket.on('playerMoved', ({ id, data }: any) => {
        setNetworkPlayers(prev => prev[id] ? { ...prev, [id]: { ...prev[id], ...data } } : prev);
    });

    socket.on('playerLeft', (id: string) => {
        setNetworkPlayers(prev => {
            const next = { ...prev };
            delete next[id];
            setPlayerCount(Object.keys(next).length + 1);
            return next;
        });
    });

    return () => { socket.disconnect(); };
  }, [profile.name]);

  useFrame((state, delta) => {
    if (!gameState.isPlaying || gameState.isGameOver || gameState.isPaused) return;

    const dt = Math.min(delta, 0.1); 

    // Controls
    if (controls.current.throttleUp) throttleRef.current = Math.min(throttleRef.current + 0.5 * dt, 1);
    if (controls.current.throttleDown) throttleRef.current = Math.max(throttleRef.current - 0.5 * dt, 0);

    const pitchInput = (controls.current.pitchUp ? 1 : 0) - (controls.current.pitchDown ? 1 : 0) + (controls.current.joyPitch || 0);
    const rollInput = (controls.current.rollLeft ? 1 : 0) - (controls.current.rollRight ? 1 : 0) - (controls.current.joyRoll || 0);
    const finalPitch = profile.settings.invertedLook ? -pitchInput : pitchInput;

    const isGrounded = planePosition.current.y <= 0.1;
    const airSpeed = speedRef.current;
    const authority = Math.min(airSpeed / 60, 1.0) * profile.settings.sensitivity; 

    if (isGrounded) {
        planeEuler.current.y += rollInput * dt * Math.max(0.2, 1 - (airSpeed / MAX_SPEED)); 
        if (airSpeed > 60 && finalPitch > 0) planeEuler.current.x += finalPitch * authority * dt;
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
    
    speedRef.current += (throttleRef.current * 150 - airSpeed * airSpeed * 0.00025 + forward.y * -30) * dt;
    if (isGrounded) speedRef.current -= speedRef.current * 0.2 * dt;
    speedRef.current = Math.max(0, Math.min(speedRef.current, MAX_SPEED));

    const move = forward.clone().multiplyScalar(speedRef.current * dt);
    if (!isGrounded && airSpeed < STALL_SPEED) move.y -= 15 * dt;
    planePosition.current.add(move);

    if (planePosition.current.y < 0) {
       if (move.y < -3 || Math.abs(planeEuler.current.z) > 0.6) onGameOver('CRASH');
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

    const camOffset = cameraMode === 'FIRST' ? new Vector3(0, 0.6, -0.5) : new Vector3(0, 8, 18);
    const camTarget = planePosition.current.clone().add(camOffset.applyQuaternion(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), planeEuler.current.y)));
    camera.position.lerp(camTarget, cameraMode === 'FIRST' ? 0.5 : 0.1);
    camera.lookAt(planePosition.current.clone().add(forward.multiplyScalar(30)));

    onUpdate({ speed: airSpeed, altitude: planePosition.current.y, fuel: 100, heading: MathUtils.radToDeg(planeEuler.current.y), pitch: MathUtils.radToDeg(planeEuler.current.x), roll: MathUtils.radToDeg(planeEuler.current.z), isGrounded });
  });

  return (
    <>
        <PlaneModel ref={planeRef} playerName={profile.name} skin={SKINS.find(s=>s.id===profile.equippedSkin)||SKINS[0]} physicsPosition={planePosition.current} showNameTag={true} />
        {Object.values(networkPlayers).map((p: any) => <NetworkPlane key={p.id} data={p} />)}
        <World mapObjects={mapObjects} isEditorMode={false} onPlaceObject={handlePlaceObject} onRemoveObject={handleRemoveObject} />
    </>
  );
}

export default function App() {
  const [profile, setProfile] = useState<PlayerProfile>(loadProfile());
  const [screen, setScreen] = useState<'LOADING'|'MENU'|'GAME'|'GARAGE'|'PROFILE'|'SETTINGS'>('LOADING');
  const [gameState, setGameState] = useState<GameState>({ isPlaying: false, isPaused: false, isGameOver: false, gameOverReason: null });
  const [flightData, setFlightData] = useState<FlightData>({ speed: 0, altitude: 0, fuel: 100, heading: 0, pitch: 0, roll: 0, isGrounded: true });
  const [cameraMode, setCameraMode] = useState<'THIRD' | 'FIRST'>('THIRD');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [playerCount, setPlayerCount] = useState(1);
  const [networkStatus, setNetworkStatus] = useState("DISCONNECTED");
  const controls = useRef<ControlsState>({ throttleUp: false, throttleDown: false, pitchUp: false, pitchDown: false, rollLeft: false, rollRight: false, yawLeft: false, yawRight: false, joyPitch: 0, joyRoll: 0 });

  useEffect(() => {
      setTimeout(() => setScreen('MENU'), 2000);
  }, []);

  useEffect(() => localStorage.setItem('skyace_profile_v6', JSON.stringify(profile)), [profile]);

  const handleRedeemCode = (code: string) => {
      const c = code.toUpperCase().trim();
      if (c === "GABI" || c === "KAZADA") {
          setProfile(p => ({ ...p, unlockedSkins: Array.from(new Set([...p.unlockedSkins, 'kazada'])), coins: p.coins + 5000 }));
          alert("GABI SKIN DESBLOQUEADA!");
      } else if (c === "PEDRO" || c === "SKYKING") {
          setProfile(p => ({ ...p, unlockedSkins: Array.from(new Set([...p.unlockedSkins, 'pedro'])), coins: p.coins + 5000 }));
          alert("PEDRO SKIN DESBLOQUEADA!");
      } else { alert("CÓDIGO INVÁLIDO"); }
  };

  return (
    <div className="w-full h-full relative bg-slate-950 overflow-hidden font-rajdhani">
        {screen === 'LOADING' && <LoadingScreen />}
        <Canvas shadows camera={{ position: [5, 5, 410], fov: 60 }}>
            <SoundManager throttle={0} speed={0} isPaused={false} isGameOver={false} volume={{music:0.5, sfx:0.5}} customAudio={profile.customAudio} triggerSfx={null} />
            {screen === 'GAME' ? (
                <GameLoop 
                    onUpdate={setFlightData} onGameOver={(r:any)=>setGameState({isPlaying:false, isPaused:false, isGameOver:true, gameOverReason:r})}
                    controls={controls} gameState={gameState} cameraMode={cameraMode} profile={profile} onAddCoin={()=>setProfile(p=>({...p, coins:p.coins+1}))}
                    mapObjects={INITIAL_MAP_DATA} isVoiceEnabled={isVoiceActive} setVoiceStatus={()=>{}} setPlayerCount={setPlayerCount} setNetworkStatus={setNetworkStatus}
                    handlePlaceObject={()=>{}} handleRemoveObject={()=>{}}
                />
            ) : (
                <group position={[0,0,400]}><ambientLight intensity={1}/><PlaneModel playerName={profile.name} skin={SKINS.find(s=>s.id===profile.equippedSkin)||SKINS[0]} physicsPosition={new Vector3(0,0,400)} /></group>
            )}
        </Canvas>

        {screen === 'MENU' && <MainMenu onStart={()=>{setGameState({isPlaying:true,isPaused:false,isGameOver:false,gameOverReason:null});setScreen('GAME')}} profile={profile} setScreen={(s:any)=>setScreen(s)} />}
        {screen === 'GARAGE' && <Garage profile={profile} onBuy={(id:string)=>setProfile(p=>({...p, coins:p.coins-500, unlockedSkins:[...p.unlockedSkins, id]})) } onEquip={(id:string)=>setProfile(p=>({...p, equippedSkin:id}))} onClose={()=>setScreen('MENU')} />}
        {screen === 'PROFILE' && <ProfileScreen profile={profile} onRedeemCode={handleRedeemCode} onClose={()=>setScreen('MENU')} />}
        
        {screen === 'GAME' && (
            <HUD 
                flightData={flightData} gameState={gameState} onReset={()=>setScreen('MENU')} toggleCamera={()=>setCameraMode(m=>m==='THIRD'?'FIRST':'THIRD')} cameraMode={cameraMode} onPause={()=>setGameState(g=>({...g,isPaused:!g.isPaused}))}
                isVoiceActive={isVoiceActive} toggleVoice={()=>setIsVoiceActive(!isVoiceActive)} voiceStatus="ACTIVE" playerCount={playerCount} networkStatus={networkStatus}
            />
        )}
        {screen === 'GAME' && !gameState.isGameOver && <MobileControls controls={controls} />}
    </div>
  );
}
