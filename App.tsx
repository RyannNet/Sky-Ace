
import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Vector3, Quaternion, Euler, MathUtils, Group } from 'three';
import { io, Socket } from 'socket.io-client';
import { PlaneModel } from './components/Plane';
import { World } from './components/World';
import { HUD } from './components/HUD';
import { MainMenu, Garage, ProfileScreen, SettingsScreen, LoadingScreen, RoomSelection, SplashScreen } from './components/Menus';
import { SoundManager } from './components/SoundManager';
import { MobileControls } from './components/Controls';
import { GameState, FlightData, ControlsState, PlayerProfile, SKINS, NetworkPlayerData, MAX_SPEED_BASE, STALL_SPEED, Mission, WorldObject } from './types';

const loadProfile = (): PlayerProfile => {
    try {
        const saved = localStorage.getItem('skyace_v8_profile');
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
        customAudio: { engine: '', idle: '', music: '', click: '', coin: '', buy: '', win: '' },
        customWorldObjects: []
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

function GameLoop({ onUpdate, onGameOver, controls, gameState, cameraMode, profile, setPlayerCount, setNetworkStatus, currentMission, isEditor, setCustomObjects }: any) {
  const planeRef = useRef<Group>(null);
  const planePosition = useRef(new Vector3(0, 10, 12000));
  const planeRotation = useRef(new Quaternion());
  const planeEuler = useRef(new Euler(0, 0, 0));
  const speedRef = useRef(0);
  const throttleRef = useRef(0);
  const { camera } = useThree();

  const socketRef = useRef<Socket | null>(null);
  const [networkPlayers, setNetworkPlayers] = useState<Record<string, NetworkPlayerData>>({});

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
            if (id !== socket.id && players[id].room === gameState.currentRoom) others[id] = players[id];
            if (players[id].room === gameState.currentRoom) count++;
        });
        setNetworkPlayers(others);
        setPlayerCount(count);
    });
    socket.on('playerJoined', (p:any) => p.room === gameState.currentRoom && setPlayerCount((c:any) => c + 1));
    socket.on('playerMoved', ({ id, data }: any) => setNetworkPlayers(prev => prev[id] ? { ...prev, [id]: { ...prev[id], ...data } } : prev));
    socket.on('playerLeft', () => setPlayerCount((c:any) => Math.max(1, c - 1)));
    return () => { socket.disconnect(); };
  }, [profile.name, gameState.currentRoom]);

  useFrame((state, delta) => {
    if (!gameState.isPlaying || gameState.isGameOver || gameState.isPaused || isEditor) return;
    const dt = Math.min(delta, 0.1);

    if (controls.current.throttleUp) throttleRef.current = Math.min(throttleRef.current + 0.8 * dt, 1);
    if (controls.current.throttleDown) throttleRef.current = Math.max(throttleRef.current - 0.8 * dt, 0);

    const pitchInput = ((controls.current.pitchUp ? 1 : 0) - (controls.current.pitchDown ? 1 : 0) + (controls.current.joyPitch || 0));
    const rollInput = ((controls.current.rollLeft ? 1 : 0) - (controls.current.rollRight ? 1 : 0) - (controls.current.joyRoll || 0));
    const finalPitch = profile.settings.invertedLook ? -pitchInput : pitchInput;

    const isOnAirport = planePosition.current.z > -10000 && planePosition.current.z < 15000 && Math.abs(planePosition.current.x) < 15000;
    const isGrounded = planePosition.current.y <= 0.5 && isOnAirport;

    const authority = Math.min(speedRef.current / 100, 1.0) * profile.settings.sensitivity;

    if (isGrounded) {
        planeEuler.current.y += rollInput * dt * 0.5;
        if (speedRef.current > 120 && finalPitch > 0) planeEuler.current.x += finalPitch * authority * dt;
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
    
    speedRef.current += (throttleRef.current * MAX_SPEED_BASE - speedRef.current * 0.05 + forward.y * -60) * dt;
    if (isGrounded) speedRef.current -= speedRef.current * 0.1 * dt;
    speedRef.current = Math.max(0, Math.min(speedRef.current, MAX_SPEED_BASE));

    const move = forward.clone().multiplyScalar(speedRef.current * dt);
    if (!isGrounded && speedRef.current < STALL_SPEED) move.y -= 50 * dt;
    planePosition.current.add(move);

    if (!isOnAirport && planePosition.current.y < 5) onGameOver('WATER_CRASH');
    if (isOnAirport && planePosition.current.y < 0) {
       if (move.y < -15.0) onGameOver('CRASH');
       else { planePosition.current.y = 0; planeEuler.current.x = 0; planeEuler.current.z = 0; }
    }

    if (planeRef.current) {
        planeRef.current.position.copy(planePosition.current);
        planeRef.current.quaternion.copy(planeRotation.current);
    }

    if (socketRef.current?.connected) {
        socketRef.current.emit('updateMovement', {
            x: planePosition.current.x, y: planePosition.current.y, z: planePosition.current.z,
            qx: planeRotation.current.x, qy: planeRotation.current.y, qz: planeRotation.current.z, qw: planeRotation.current.w,
        });
    }

    const camOffset = cameraMode === 'FIRST' ? new Vector3(0, 1.2, -5.5) : new Vector3(0, 25, 80);
    const camTarget = planePosition.current.clone().add(camOffset.applyQuaternion(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), planeEuler.current.y)));
    camera.position.lerp(camTarget, 0.05);
    camera.lookAt(planePosition.current.clone().add(forward.multiplyScalar(150)));

    onUpdate({ 
        speed: speedRef.current, altitude: planePosition.current.y, fuel: 100, 
        heading: MathUtils.radToDeg(planeEuler.current.y), pitch: MathUtils.radToDeg(planeEuler.current.x), 
        roll: MathUtils.radToDeg(planeEuler.current.z), isGrounded,
        x: planePosition.current.x, z: planePosition.current.z
    });
  });

  return (
    <>
        <PlaneModel ref={planeRef} playerName={profile.name} skin={SKINS.find(s=>s.id===profile.equippedSkin)||SKINS[0]} physicsPosition={planePosition.current} />
        {Object.values(networkPlayers).map((p: any) => <NetworkPlane key={p.id} data={p} />)}
        <World 
            planePosition={planePosition.current} 
            isEditor={isEditor} 
            customObjects={profile.customWorldObjects || []}
            onObjectUpdate={(o) => setCustomObjects(o)}
        />
    </>
  );
}

export default function App() {
  const [profile, setProfile] = useState<PlayerProfile>(loadProfile());
  const [screen, setScreen] = useState<'SPLASH'|'LOADING'|'MENU'|'GAME'|'GARAGE'|'PROFILE'|'SETTINGS'|'ROOMS'>('SPLASH');
  const [gameState, setGameState] = useState<GameState>({ isPlaying: false, isPaused: false, isGameOver: false, gameOverReason: null, currentRoom: 'GLOBAL', isEditorMode: false });
  const [flightData, setFlightData] = useState<FlightData>({ speed: 0, altitude: 0, fuel: 100, heading: 0, pitch: 0, roll: 0, isGrounded: true, x: 0, z: 0 });
  const [cameraMode, setCameraMode] = useState<'THIRD' | 'FIRST'>('THIRD');
  const [playerCount, setPlayerCount] = useState(1);
  const [networkStatus, setNetworkStatus] = useState("OFFLINE");
  const [currentMission, setCurrentMission] = useState<Mission | null>(null);
  const controls = useRef<ControlsState>({ throttleUp: false, throttleDown: false, pitchUp: false, pitchDown: false, rollLeft: false, rollRight: false, yawLeft: false, yawRight: false, joyPitch: 0, joyRoll: 0 });

  useEffect(() => localStorage.setItem('skyace_v8_profile', JSON.stringify(profile)), [profile]);

  const handleStartApp = () => {
    setScreen('LOADING');
    setTimeout(() => setScreen('MENU'), 2000);
  };

  const handleRedeemCode = (code: string) => {
      const normalized = code.trim();
      if (normalized === 'G*b1_BFF' && !profile.unlockedSkins.includes('kazada')) {
          setProfile(p => ({ ...p, coins: p.coins + 10000, unlockedSkins: [...p.unlockedSkins, 'kazada'] }));
          alert("GABI SPECIAL UNLOCKED!");
      } else if (normalized === 'PEDRO_ACE' && !profile.unlockedSkins.includes('pedro')) {
          setProfile(p => ({ ...p, coins: p.coins + 10000, unlockedSkins: [...p.unlockedSkins, 'pedro'] }));
          alert("SKY KING UNLOCKED!");
      }
  };

  const startMission = (dist: 2|7|9|15|35) => {
      setCurrentMission({
          id: Math.random().toString(),
          distance: dist,
          targetPos: [0, 0, -dist * 1000],
          reward: dist * 500,
          destinationName: `CITY SECTOR-${dist}`,
          active: true
      });
  };

  return (
    <div className="w-full h-full relative bg-slate-900 overflow-hidden font-rajdhani">
        {screen === 'SPLASH' && <SplashScreen onStart={handleStartApp} />}
        {screen === 'LOADING' && <LoadingScreen />}
        <Canvas shadows camera={{ position: [5, 5, 410], fov: 60, far: 100000 }}>
            {screen === 'GAME' ? (
                <GameLoop 
                    onUpdate={setFlightData} 
                    onGameOver={(r:any)=>setGameState(prev=>({...prev, isPlaying:false, isGameOver:true, gameOverReason:r}))}
                    controls={controls} gameState={gameState} cameraMode={cameraMode} profile={profile} 
                    setPlayerCount={setPlayerCount} setNetworkStatus={setNetworkStatus}
                    currentMission={currentMission} isEditor={gameState.isEditorMode}
                    setCustomObjects={(o:any) => setProfile(p => ({...p, customWorldObjects: [...(p.customWorldObjects||[]), o]}))}
                />
            ) : (
                <group position={[0,0,400]}>
                    <ambientLight intensity={2}/>
                    <PlaneModel playerName={profile.name} skin={SKINS.find(s=>s.id===profile.equippedSkin)||SKINS[0]} physicsPosition={new Vector3(0,0,400)} showNameTag={false} />
                </group>
            )}
        </Canvas>

        {screen === 'MENU' && <MainMenu onStart={()=>setScreen('ROOMS')} profile={profile} setScreen={(s:any)=>setScreen(s)} />}
        {screen === 'ROOMS' && <RoomSelection onJoin={(code:string)=>{setGameState(g=>({...g,isPlaying:true,currentRoom:code})); setScreen('GAME'); startMission(7);}} onBack={()=>setScreen('MENU')} />}
        {screen === 'GARAGE' && <Garage profile={profile} onEquip={(id:string)=>setProfile(p=>({...p,equippedSkin:id}))} onBuy={(id:string)=>setProfile(p=>({...p,coins:p.coins-SKINS.find(s=>s.id===id)!.price,unlockedSkins:[...p.unlockedSkins,id]}))} onClose={()=>setScreen('MENU')} />}
        {screen === 'PROFILE' && <ProfileScreen profile={profile} onRedeemCode={handleRedeemCode} onClose={()=>setScreen('MENU')} />}
        {screen === 'SETTINGS' && <SettingsScreen profile={profile} updateSettings={(k:any,v:any)=>setProfile(p=>({...p,settings:{...p.settings,[k]:v}}))} onClose={()=>setScreen('MENU')} />}

        {screen === 'GAME' && (
            <HUD 
                flightData={flightData} gameState={gameState} onReset={()=>setScreen('MENU')} 
                toggleCamera={()=>setCameraMode(m=>m==='THIRD'?'FIRST':'THIRD')} 
                onPause={()=>setGameState(g=>({...g,isPaused:!g.isPaused}))}
                playerCount={playerCount} networkStatus={networkStatus}
                currentMission={currentMission} isEditor={gameState.isEditorMode}
                toggleEditor={() => setGameState(g => ({...g, isEditorMode: !g.isEditorMode}))}
                onPassengerAnnouncement={(msg:string) => console.log("PA:", msg)}
            />
        )}
        {screen === 'GAME' && !gameState.isGameOver && !gameState.isEditorMode && <MobileControls controls={controls} />}
    </div>
  );
}
