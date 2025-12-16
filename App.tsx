
import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Vector3, Quaternion, Euler, MathUtils, Group } from 'three';
import { PlaneModel } from './components/Plane';
import { World } from './components/World';
import { HUD } from './components/HUD';
import { MainMenu, Garage, ProfileScreen, SettingsScreen, LoadingScreen } from './components/Menus';
import { SoundManager } from './components/SoundManager';
import { MobileControls } from './components/Controls';
import { GameState, FlightData, ControlsState, GRAVITY, MAX_SPEED, STALL_SPEED, MAX_FUEL, PlayerProfile, SKINS, MapObject, MapObjectType } from './types';
import { v4 as uuidv4 } from 'uuid'; // Standard unique ID generator

// --- MAP DATA CONSTANT ---
// CHANGE THIS TO SAVE FOR EVERYONE:
// Paste the JSON from the "Export Map Code" button here.
const INITIAL_MAP_DATA: MapObject[] = [
    // Exemplo: { id: "1", type: "BUILDING_TALL", position: [100, 0, -200], scale: [20, 100, 20] }
];

// --- INDEXED DB HELPER (PERSISTENT AUDIO STORAGE) ---
const DB_NAME = 'SkyAceAudioDB';
const STORE_NAME = 'audio_files';

const initDB = () => {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const saveAudioToDB = async (key: string, file: Blob) => {
  try {
      const db = await initDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(file, key);
  } catch (e) { console.error("DB Save Error", e); }
};

const deleteAudioFromDB = async (key: string) => {
    try {
        const db = await initDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(key);
    } catch (e) { console.error("DB Delete Error", e); }
};

const loadAllAudioFromDB = async (): Promise<Record<string, string>> => {
  try {
      const db = await initDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.openCursor();
        const loadedAudio: Record<string, string> = {};
        
        request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest).result;
            if (cursor) {
                const key = cursor.key as string;
                const blob = cursor.value as Blob;
                loadedAudio[key] = URL.createObjectURL(blob);
                cursor.continue();
            } else {
                resolve(loadedAudio);
            }
        };
      });
  } catch (e) { 
      console.error("DB Load Error", e); 
      return {};
  }
};

// --- STORAGE HELPER ---
const DEFAULT_PROFILE: PlayerProfile = {
    name: "Piloto",
    coins: 500,
    unlockedSkins: ['default'], 
    equippedSkin: 'default',
    stats: { flights: 0, crashes: 0, flightTime: 0, maxAltitude: 0 },
    settings: { musicVolume: 0.5, sfxVolume: 0.5, sensitivity: 1.0, invertedLook: false },
    customAudio: {
        engine: '',
        idle: '',
        music: '',
        click: '',
        coin: '',
        buy: '',
        win: ''
    }
};

const loadProfile = (): PlayerProfile => {
    try {
        const saved = localStorage.getItem('skyace_profile_v5'); // Updated version
        if (saved) {
            const parsed = JSON.parse(saved);
            // Merge com default para garantir que campos novos (customAudio) existam
            return { 
                ...DEFAULT_PROFILE, 
                ...parsed, 
                customAudio: { ...DEFAULT_PROFILE.customAudio, ...(parsed.customAudio || {}) } 
            };
        }
    } catch (e) { console.error("Load failed", e); }
    return DEFAULT_PROFILE;
};

const saveProfile = (p: PlayerProfile) => {
    // Não salvamos as URLs de áudio no localStorage porque elas expiram.
    // Salvamos apenas os metadados do perfil. O áudio vem do IndexedDB.
    localStorage.setItem('skyace_profile_v5', JSON.stringify(p));
};

// --- WINGMAN COMPONENT (IA Simples) ---
const WingmanPlane = ({ 
    targetPos, 
    targetRot, 
    offset, 
    skinId, 
    name,
    isGameOver
}: { 
    targetPos: Vector3, 
    targetRot: Quaternion, 
    offset: Vector3, 
    skinId: string, 
    name: string,
    isGameOver: boolean
}) => {
    const group = useRef<Group>(null);
    const skin = SKINS.find(s => s.id === skinId) || SKINS[0];
    
    // Smooth follow logic
    useFrame((state, delta) => {
        if (!group.current) return;
        
        // Calculate formation position: Target Pos + (Offset rotated by Target Rotation)
        const idealPos = targetPos.clone().add(offset.clone().applyQuaternion(targetRot));
        
        // Lerp position for natural delay
        group.current.position.lerp(idealPos, delta * 3.0);
        
        // Lerp rotation
        group.current.quaternion.slerp(targetRot, delta * 2.0);
        
        // Add subtle noise (simulating pilot correction)
        const time = state.clock.getElapsedTime();
        group.current.position.y += Math.sin(time * 2 + offset.x) * 0.05;
    });

    return (
        <PlaneModel 
            ref={group}
            playerName={name}
            skin={skin}
            physicsPosition={new Vector3()} 
            showNameTag={!isGameOver} // Hide on Game Over
        />
    );
};

// --- GAME LOGIC ---
function GameLoop({ 
  onUpdate, 
  onGameOver, 
  controls,
  gameState,
  cameraMode,
  profile,
  onAddCoin,
  playSound,
  mapObjects,
  isEditorMode
}: { 
  onUpdate: (data: FlightData) => void, 
  onGameOver: (reason: 'CRASH' | 'FUEL') => void,
  controls: React.MutableRefObject<ControlsState>,
  gameState: GameState,
  cameraMode: 'THIRD' | 'FIRST',
  profile: PlayerProfile,
  onAddCoin: () => void,
  playSound: (type: 'coin' | 'win' | 'click') => void,
  mapObjects: MapObject[],
  isEditorMode: boolean
}) {
  const planeRef = useRef<Group>(null);
  const planePosition = useRef(new Vector3(0, 0, 400)); 
  const planeRotation = useRef(new Quaternion());
  const planeEuler = useRef(new Euler(0, 0, 0)); 
  
  const speedRef = useRef(0);
  const throttleRef = useRef(0); 
  const fuelRef = useRef(MAX_FUEL);
  const coinTimer = useRef(0);
  
  const { camera } = useThree();

  useEffect(() => {
    if (cameraMode === 'THIRD') {
        camera.position.set(0, 6, 415);
        camera.lookAt(0, 0, 380);
    } else {
        camera.position.set(0, 0.6, 400.5);
        camera.lookAt(0, 0, 380);
    }
  }, []);

  useFrame((state, delta) => {
    // EDITOR MODE: Stop physics, allow camera movement
    if (isEditorMode) {
        camera.position.y = Math.max(10, camera.position.y);
        
        // Simple editor camera movement
        if (controls.current.throttleUp) camera.position.z -= 100 * delta;
        if (controls.current.throttleDown) camera.position.z += 100 * delta;
        if (controls.current.rollLeft) camera.position.x -= 100 * delta;
        if (controls.current.rollRight) camera.position.x += 100 * delta;
        if (controls.current.pitchUp) camera.position.y += 50 * delta; // Up
        if (controls.current.pitchDown) camera.position.y -= 50 * delta; // Down

        camera.lookAt(camera.position.x, 0, camera.position.z - 100);
        return;
    }

    if (!gameState.isPlaying || gameState.isGameOver || gameState.isPaused) return;

    const dt = Math.min(delta, 0.1); 

    // Coin Generation Logic
    if (!gameState.isGameOver && speedRef.current > 50) {
        coinTimer.current += dt;
        if (coinTimer.current > 5) {
            onAddCoin();
            playSound('coin'); // SFX Trigger
            coinTimer.current = 0;
        }
    }

    if (controls.current.throttleUp) throttleRef.current = Math.min(throttleRef.current + 0.5 * dt, 1);
    if (controls.current.throttleDown) throttleRef.current = Math.max(throttleRef.current - 0.5 * dt, 0);

    const kbPitch = (controls.current.pitchUp ? 1 : 0) - (controls.current.pitchDown ? 1 : 0);
    const kbRoll = (controls.current.rollLeft ? 1 : 0) - (controls.current.rollRight ? 1 : 0);
    
    let combinedPitch = kbPitch;
    let combinedRoll = kbRoll;

    if (controls.current.joyPitch !== 0) combinedPitch = controls.current.joyPitch; 
    if (controls.current.joyRoll !== 0) combinedRoll = -controls.current.joyRoll; 

    const finalPitchInput = profile.settings.invertedLook ? -combinedPitch : combinedPitch;

    // --- PHYSICS & CONTROLS ---
    
    const isGrounded = planePosition.current.y <= 0.1;
    const airSpeed = speedRef.current;
    const authority = Math.min(airSpeed / 60, 1.0) * profile.settings.sensitivity; 

    if (isGrounded) {
        // Taxi Mode
        if (airSpeed > 1) {
            const steeringFactor = Math.max(0.2, 1 - (airSpeed / MAX_SPEED));
            planeEuler.current.y += combinedRoll * dt * steeringFactor; 
        }

        if (airSpeed > 60 && finalPitchInput > 0) {
             planeEuler.current.x += finalPitchInput * authority * dt * 0.8;
        } else {
             planeEuler.current.x = MathUtils.lerp(planeEuler.current.x, 0, dt * 5);
        }

        planeEuler.current.z = MathUtils.lerp(planeEuler.current.z, 0, dt * 10);

    } else {
        // Flight Mode
        planeEuler.current.x += finalPitchInput * authority * dt * 1.5;
        planeEuler.current.z += combinedRoll * authority * dt * 2.5;
        planeEuler.current.y += planeEuler.current.z * authority * dt * 0.8;
        
        if (combinedRoll === 0 && combinedPitch === 0) {
           planeEuler.current.z = MathUtils.lerp(planeEuler.current.z, 0, dt * 2.5);
        }
    }

    planeEuler.current.x = MathUtils.clamp(planeEuler.current.x, -1.2, 1.2);
    
    planeRotation.current.setFromEuler(planeEuler.current);
    const forwardDir = new Vector3(0, 0, -1).applyQuaternion(planeRotation.current);
    
    const thrustForce = throttleRef.current * 150 * dt; 
    const dragForce = airSpeed * airSpeed * 0.00025 * dt;
    const gravityForce = GRAVITY * dt;
    const gravityComponent = forwardDir.y * gravityForce * -3.0; 
    
    speedRef.current += thrustForce - dragForce + gravityComponent;
    
    if (isGrounded) speedRef.current -= speedRef.current * 0.2 * dt;
    speedRef.current = Math.max(0, Math.min(speedRef.current, MAX_SPEED));

    const moveVector = forwardDir.clone().multiplyScalar(speedRef.current * dt);
    
    if (!isGrounded) {
       if (airSpeed < STALL_SPEED) {
          moveVector.y -= gravityForce * 2.5;
          planeEuler.current.x = MathUtils.lerp(planeEuler.current.x, -0.8, dt);
       }
    } else {
        if (moveVector.y < 0) moveVector.y = 0;
        if (moveVector.y > 0 && airSpeed < 70) moveVector.y = 0;
    }

    planePosition.current.add(moveVector);

    if (planePosition.current.y < 0) {
       if (moveVector.y < -2.0 || Math.abs(planeEuler.current.z) > 0.6 || Math.abs(planeEuler.current.x) > 0.6) {
          onGameOver('CRASH');
       } else {
          planePosition.current.y = 0;
          planeEuler.current.x = 0; 
          planeEuler.current.z = 0;
          planeRotation.current.setFromEuler(planeEuler.current);
       }
    }

    // --- COLLISION DETECTION WITH CUSTOM MAP ---
    const planeBox = { 
        min: planePosition.current.clone().subScalar(2), 
        max: planePosition.current.clone().addScalar(2) 
    };

    for (const obj of mapObjects) {
        if (obj.type === 'RING') continue; // Rings are non-solid for now
        
        // Simple AABB collision
        const objPos = new Vector3(...obj.position);
        const halfScale = new Vector3(...obj.scale).multiplyScalar(0.5);
        // Correct position because pivot is usually center but objects are placed on ground
        const objCenterY = obj.position[1] + obj.scale[1] / 2;
        
        const objMin = new Vector3(objPos.x - halfScale.x, obj.position[1], objPos.z - halfScale.z);
        const objMax = new Vector3(objPos.x + halfScale.x, obj.position[1] + obj.scale[1], objPos.z + halfScale.z);

        if (
            planeBox.max.x > objMin.x && planeBox.min.x < objMax.x &&
            planeBox.max.y > objMin.y && planeBox.min.y < objMax.y &&
            planeBox.max.z > objMin.z && planeBox.min.z < objMax.z
        ) {
            onGameOver('CRASH');
        }
    }

    fuelRef.current -= throttleRef.current * dt * 0.5;
    if (fuelRef.current <= 0) onGameOver('FUEL');

    if (planeRef.current) {
        planeRef.current.position.copy(planePosition.current);
        planeRef.current.quaternion.copy(planeRotation.current);
    }

    // Camera Logic
    let camTargetPos;
    let lookTarget;

    if (cameraMode === 'FIRST') {
        const offset = new Vector3(0, 0.6, -0.5).applyQuaternion(planeRotation.current);
        camTargetPos = planePosition.current.clone().add(offset);
        camera.position.lerp(camTargetPos, 0.5); 
        lookTarget = planePosition.current.clone().add(forwardDir.multiplyScalar(20));
    } else {
        const yawRotation = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), planeEuler.current.y);
        const offset = new Vector3(0, 8, 18).applyQuaternion(yawRotation);
        camTargetPos = planePosition.current.clone().add(offset);
        
        if (speedRef.current < 1) {
             camera.position.copy(camTargetPos);
        } else {
             camera.position.lerp(camTargetPos, 0.1); 
        }
        lookTarget = planePosition.current.clone().add(forwardDir.multiplyScalar(30));
    }
    
    camera.lookAt(lookTarget);

    onUpdate({
      speed: speedRef.current,
      altitude: planePosition.current.y,
      fuel: Math.max(0, fuelRef.current),
      heading: (MathUtils.radToDeg(planeEuler.current.y) + 360) % 360,
      pitch: MathUtils.radToDeg(planeEuler.current.x),
      roll: MathUtils.radToDeg(planeEuler.current.z),
      isGrounded: planePosition.current.y <= 0.1
    });
  });

  const skin = SKINS.find(s => s.id === profile.equippedSkin) || SKINS[0];

  // --- SQUAD LOGIC ---
  let leftWingSkin = 'kazada';
  let leftWingName = 'Gabi Kazada';
  let rightWingSkin = 'pedro';
  let rightWingName = 'Pedro Maverick';

  if (profile.equippedSkin === 'kazada') {
      leftWingSkin = 'pedro';
      leftWingName = 'Pedro Maverick';
      rightWingSkin = 'stealth';
      rightWingName = 'Matheus (Ops)';
  } else if (profile.equippedSkin === 'pedro') {
      leftWingSkin = 'kazada';
      leftWingName = 'Gabi Kazada';
      rightWingSkin = 'stealth';
      rightWingName = 'Matheus (Ops)';
  }

  return (
    <>
        {!isEditorMode && (
        <>
            {/* PLAYER PLANE */}
            <PlaneModel 
                ref={planeRef}
                playerName={profile.name}
                skin={skin}
                physicsPosition={planePosition.current}
                showNameTag={!gameState.isGameOver} 
            />

            {/* SQUADRON (WINGMEN) */}
            {!gameState.isGameOver && (
                <>
                    <WingmanPlane 
                        targetPos={planePosition.current}
                        targetRot={planeRotation.current}
                        offset={new Vector3(-12, 0, 8)}
                        skinId={leftWingSkin}
                        name={leftWingName}
                        isGameOver={gameState.isGameOver}
                    />
                    
                    <WingmanPlane 
                        targetPos={planePosition.current}
                        targetRot={planeRotation.current}
                        offset={new Vector3(12, 0, 8)}
                        skinId={rightWingSkin}
                        name={rightWingName}
                        isGameOver={gameState.isGameOver}
                    />
                </>
            )}
        </>
        )}
    </>
  );
}

// --- APP COMPONENT ---
export default function App() {
  const [profile, setProfile] = useState<PlayerProfile>(loadProfile());
  const [screen, setScreen] = useState<'LOADING'|'MENU'|'GAME'|'GARAGE'|'PROFILE'|'SETTINGS'>('LOADING');
  
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false, isPaused: false, isGameOver: false, gameOverReason: null
  });
  const [flightData, setFlightData] = useState<FlightData>({
    speed: 0, altitude: 0, fuel: 100, heading: 0, pitch: 0, roll: 0, isGrounded: true
  });
  const [cameraMode, setCameraMode] = useState<'THIRD' | 'FIRST'>('THIRD');
  
  // --- MAP EDITOR STATE ---
  const [isEditorMode, setIsEditorMode] = useState(false);
  const [mapObjects, setMapObjects] = useState<MapObject[]>(INITIAL_MAP_DATA.length > 0 ? INITIAL_MAP_DATA : []);
  const [selectedEditorType, setSelectedEditorType] = useState<MapObjectType>('BUILDING_TALL');
  const [showExportModal, setShowExportModal] = useState(false);

  // Initialize Map with random buildings if empty
  useEffect(() => {
     if (mapObjects.length === 0 && INITIAL_MAP_DATA.length === 0) {
         const randomBuildings: MapObject[] = Array.from({ length: 40 }).map((_, i) => {
          const x = (Math.random() > 0.5 ? 1 : -1) * (80 + Math.random() * 400);
          const z = (Math.random() - 0.5) * 3000;
          const h = 40 + Math.random() * 100;
          const w = 20 + Math.random() * 20;
          return {
              id: uuidv4(),
              type: 'BUILDING_TALL',
              position: [x, 0, z],
              scale: [w, h, w]
          };
      });
      setMapObjects(randomBuildings);
     }
  }, []);

  const handlePlaceObject = (pos: Vector3, type: MapObjectType) => {
      const newObj: MapObject = {
          id: uuidv4(),
          type: type,
          position: [pos.x, 0, pos.z],
          scale: [20, 20, 20] // Default scale
      };

      if (type === 'BUILDING_TALL') newObj.scale = [30, 100 + Math.random() * 50, 30];
      if (type === 'BUILDING_SMALL') newObj.scale = [20, 30, 20];
      if (type === 'PYRAMID') newObj.scale = [40, 40, 40];
      if (type === 'RING') newObj.scale = [1, 1, 1]; // Rings handle scale internally or differently

      setMapObjects(prev => [...prev, newObj]);
  };

  const handleRemoveObject = (id: string) => {
      setMapObjects(prev => prev.filter(o => o.id !== id));
  };

  // Sound Trigger System
  const [sfxTrigger, setSfxTrigger] = useState<{type: string, id: number} | null>(null);

  const triggerSound = (type: string) => {
      setSfxTrigger({ type, id: Date.now() });
  };
  
  const controls = useRef<ControlsState>({
    throttleUp: false, throttleDown: false, pitchUp: false, pitchDown: false,
    rollLeft: false, rollRight: false, yawLeft: false, yawRight: false,
    joyPitch: 0, joyRoll: 0
  });

  const dummyControls = useRef<ControlsState>({
    throttleUp: false, throttleDown: false, pitchUp: false, pitchDown: false,
    rollLeft: false, rollRight: false, yawLeft: false, yawRight: false,
    joyPitch: 0, joyRoll: 0
  });

  // Load persistent audio on mount
  useEffect(() => {
      loadAllAudioFromDB().then((loaded) => {
          if (Object.keys(loaded).length > 0) {
              setProfile(p => ({
                  ...p,
                  customAudio: { ...p.customAudio, ...loaded }
              }));
          }
          // After loading audio, move to menu
          setTimeout(() => setScreen('MENU'), 2500);
      });
  }, []);

  useEffect(() => {
      saveProfile(profile);
  }, [profile]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': controls.current.throttleUp = true; break;
        case 'KeyS': controls.current.throttleDown = true; break;
        case 'ArrowDown': case 'Space': controls.current.pitchUp = true; break; 
        case 'ArrowUp': case 'ShiftLeft': controls.current.pitchDown = true; break; 
        case 'KeyA': case 'ArrowLeft': controls.current.rollLeft = true; break;
        case 'KeyD': case 'ArrowRight': controls.current.rollRight = true; break;
        case 'Escape': 
            if (screen === 'GAME' && !isEditorMode) setGameState(p => ({...p, isPaused: !p.isPaused}));
            break;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': controls.current.throttleUp = false; break;
        case 'KeyS': controls.current.throttleDown = false; break;
        case 'ArrowDown': case 'Space': controls.current.pitchUp = false; break;
        case 'ArrowUp': case 'ShiftLeft': controls.current.pitchDown = false; break;
        case 'KeyA': case 'ArrowLeft': controls.current.rollLeft = false; break;
        case 'KeyD': case 'ArrowRight': controls.current.rollRight = false; break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [screen, isEditorMode]); // Added isEditorMode dep to prevent escape pausing in editor

  const startGame = () => {
      triggerSound('click');
      setGameState({ isPlaying: true, isPaused: false, isGameOver: false, gameOverReason: null });
      setScreen('GAME');
      setProfile(p => ({...p, stats: {...p.stats, flights: p.stats.flights + 1}}));
  };

  const handleGameOver = (reason: 'CRASH' | 'FUEL') => {
      if (isEditorMode) return; // No game over in editor
      setGameState(p => ({ ...p, isGameOver: true, gameOverReason: reason }));
      setProfile(p => ({ ...p, stats: { ...p.stats, crashes: p.stats.crashes + 1 } }));
  };

  const handleAddCoin = () => {
      setProfile(p => ({ ...p, coins: p.coins + 1 }));
  };

  const handleUnlockSkin = (id: string) => {
      const skin = SKINS.find(s => s.id === id);
      if (!skin) return;
      if (profile.coins >= skin.price) {
          triggerSound('buy');
          setProfile(p => ({
              ...p,
              coins: p.coins - skin.price,
              unlockedSkins: [...p.unlockedSkins, id],
              equippedSkin: id
          }));
      }
  };

  const handleEquipSkin = (id: string) => {
      triggerSound('click');
      if (profile.unlockedSkins.includes(id)) {
          setProfile(p => ({ ...p, equippedSkin: id }));
      }
  };

  const handleUpdateCustomAudio = async (key: string, value: File | string) => {
      if (value instanceof File) {
          // Save Blob to DB
          await saveAudioToDB(key, value);
          const url = URL.createObjectURL(value);
          setProfile(p => ({...p, customAudio: {...p.customAudio, [key]: url}}));
      } else if (value === '') {
          // Reset
          await deleteAudioFromDB(key);
          setProfile(p => ({...p, customAudio: {...p.customAudio, [key]: ''}}));
      }
  };

  const handleRedeemCode = (code: string) => {
      const trimmedCode = code.trim();
      
      if (trimmedCode === "G*b1_BFF") {
          triggerSound('win');
          setProfile(p => {
              const newUnlocked = p.unlockedSkins.includes('kazada') ? p.unlockedSkins : [...p.unlockedSkins, 'kazada'];
              return {
                  ...p,
                  name: "Gabi kazada com Matheus 🌈",
                  equippedSkin: 'kazada',
                  unlockedSkins: newUnlocked
              };
          });
      } 
      else if (trimmedCode === "PEDRO_ACE") {
          triggerSound('win');
          setProfile(p => {
              const newUnlocked = p.unlockedSkins.includes('pedro') ? p.unlockedSkins : [...p.unlockedSkins, 'pedro'];
              return {
                  ...p,
                  name: "Pedro Maverick",
                  equippedSkin: 'pedro',
                  unlockedSkins: newUnlocked
              };
          });
      }
      else if (trimmedCode === "MONEYBAG") {
          triggerSound('win');
          setProfile(p => ({...p, coins: p.coins + 1000}));
      }
  };

  // Central Audio Manager Instance
  const renderSoundManager = () => (
      <SoundManager 
          throttle={controls.current.throttleUp ? 1 : controls.current.throttleDown ? 0 : 0.5} // Aproximação visual
          speed={flightData.speed}
          isPaused={gameState.isPaused}
          isGameOver={gameState.isGameOver}
          volume={{ music: profile.settings.musicVolume, sfx: profile.settings.sfxVolume }}
          customAudio={profile.customAudio}
          triggerSfx={sfxTrigger}
      />
  );

  const renderScene = () => {
      if (screen === 'GAME') {
          return (
             <GameLoop 
                onUpdate={setFlightData} 
                onGameOver={handleGameOver}
                controls={controls}
                gameState={gameState}
                cameraMode={cameraMode}
                profile={profile}
                onAddCoin={handleAddCoin}
                playSound={triggerSound}
                mapObjects={mapObjects}
                isEditorMode={isEditorMode}
             />
          );
      }
      
      const activeSkinId = profile.equippedSkin; 
      const skin = SKINS.find(s => s.id === activeSkinId) || SKINS[0];
      
      return (
         <group position={[0, 0, 400]}>
             <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -1.45, 0]} receiveShadow>
                 <circleGeometry args={[8, 32]} />
                 <meshStandardMaterial color="#0f172a" />
             </mesh>
             <ambientLight intensity={1} />
             <spotLight position={[10, 10, 10]} angle={0.5} penumbra={1} intensity={2} castShadow />
             <GameLoop 
                 onUpdate={() => {}} 
                 onGameOver={() => {}} 
                 controls={dummyControls} 
                 gameState={{...gameState, isPlaying: false}} 
                 cameraMode="THIRD"
                 profile={profile}
                 onAddCoin={() => {}}
                 playSound={() => {}}
                 mapObjects={mapObjects}
                 isEditorMode={false}
             />
             <OrbitingCamera />
         </group>
      );
  };

  return (
    <div className="w-full h-full relative bg-slate-950 overflow-hidden select-none" onContextMenu={e => e.preventDefault()}>
        {screen === 'LOADING' && <LoadingScreen />}
        
        <Canvas shadows camera={{ position: [5, 5, 410], fov: 60 }} gl={{ antialias: true }}>
            <World 
                mapObjects={mapObjects} 
                isEditorMode={isEditorMode} 
                onPlaceObject={handlePlaceObject}
                onRemoveObject={handleRemoveObject}
            />
            {/* Render Audio Manager globally inside Canvas */}
            {renderSoundManager()}
            {renderScene()}
        </Canvas>

        {/* UI LAYERS */}
        {screen === 'MENU' && <MainMenu onStart={startGame} profile={profile} setScreen={(s) => { triggerSound('click'); setScreen(s as any); }} />}
        {screen === 'GARAGE' && <Garage profile={profile} onBuy={handleUnlockSkin} onEquip={handleEquipSkin} onClose={() => { triggerSound('click'); setScreen('MENU'); }} />}
        {screen === 'PROFILE' && <ProfileScreen profile={profile} onRedeemCode={handleRedeemCode} onClose={() => { triggerSound('click'); setScreen('MENU'); }} />}
        {screen === 'SETTINGS' && (
            <SettingsScreen 
                profile={profile} 
                updateSettings={(k: any,v: any) => setProfile(p => ({...p, settings: {...p.settings, [k]: v}}))} 
                updateCustomAudio={handleUpdateCustomAudio} 
                onClose={() => { triggerSound('click'); setScreen('MENU'); }} 
            />
        )}

        {screen === 'GAME' && (
            <HUD 
                flightData={flightData} 
                gameState={gameState} 
                onReset={() => { triggerSound('click'); setScreen('MENU'); setGameState(p => ({...p, isGameOver: false})); }}
                toggleCamera={() => setCameraMode(p => p === 'THIRD' ? 'FIRST' : 'THIRD')}
                cameraMode={cameraMode}
                onPause={() => setGameState(p => ({...p, isPaused: !p.isPaused}))}
                isEditorMode={isEditorMode}
                toggleEditor={() => setIsEditorMode(p => !p)}
                setSelectedType={setSelectedEditorType}
                onExportMap={() => setShowExportModal(true)}
            />
        )}
        
        {screen === 'GAME' && !gameState.isGameOver && !gameState.isPaused && !isEditorMode && (
             <MobileControls controls={controls} />
        )}
        
        {/* EXPORT MODAL */}
        {showExportModal && (
            <div className="absolute inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-8 font-rajdhani">
                <div className="bg-slate-900 border border-amber-500 p-6 w-full max-w-2xl rounded">
                    <h2 className="text-2xl text-white font-bold mb-4">EXPORT MAP DATA</h2>
                    <p className="text-slate-400 mb-2">Copy the code below and paste it into <code className="bg-black p-1 text-amber-500">App.tsx</code> inside the <code className="text-white">INITIAL_MAP_DATA</code> array to save this map for everyone forever.</p>
                    <textarea 
                        readOnly 
                        className="w-full h-64 bg-black text-green-400 font-mono text-xs p-4 rounded border border-white/10"
                        value={JSON.stringify(mapObjects, null, 2)}
                    />
                    <div className="flex gap-4 mt-4">
                        <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(mapObjects, null, 2)); alert("Copied!"); }} className="bg-amber-500 text-black px-6 py-2 font-bold hover:bg-amber-400">COPY TO CLIPBOARD</button>
                        <button onClick={() => setShowExportModal(false)} className="bg-transparent border border-white/20 text-white px-6 py-2 font-bold hover:bg-white/10">CLOSE</button>
                    </div>
                </div>
            </div>
        )}
        
        {gameState.isPaused && !showExportModal && (
            <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center font-rajdhani">
                 <div className="bg-slate-900 border border-white/20 p-12 text-center skew-x-[-5deg]">
                     <h2 className="text-5xl text-white font-black italic mb-8 tracking-tighter skew-x-[5deg]">PAUSED</h2>
                     <button onClick={() => setGameState(p => ({...p, isPaused: false}))} className="bg-amber-500 hover:bg-amber-400 text-black px-8 py-3 font-bold block w-full mb-4 tracking-widest skew-x-[5deg]">RESUME</button>
                     <button onClick={() => { setGameState(p => ({...p, isPaused: false})); setScreen('MENU'); }} className="bg-transparent border border-slate-600 hover:bg-slate-800 text-white px-8 py-3 font-bold block w-full tracking-widest skew-x-[5deg]">ABORT</button>
                 </div>
            </div>
        )}
    </div>
  );
}

const OrbitingCamera = () => {
    const { camera } = useThree();
    useFrame((state) => {
        const t = state.clock.getElapsedTime() * 0.5;
        camera.position.x = Math.sin(t) * 12;
        camera.position.z = 400 + Math.cos(t) * 12;
        camera.position.y = 4;
        camera.lookAt(0, 0, 400);
    });
    return null;
};
