
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Vector3, Quaternion, Euler, MathUtils, Group } from 'three';
import { io, Socket } from 'socket.io-client'; // Import Socket.io
import { PlaneModel } from './components/Plane';
import { World } from './components/World';
import { HUD } from './components/HUD';
import { MainMenu, Garage, ProfileScreen, SettingsScreen, LoadingScreen } from './components/Menus';
import { SoundManager } from './components/SoundManager';
import { MobileControls } from './components/Controls';
import { GameState, FlightData, ControlsState, GRAVITY, MAX_SPEED, STALL_SPEED, MAX_FUEL, PlayerProfile, SKINS, MapObject, MapObjectType, NetworkPlayerData } from './types';
import { v4 as uuidv4 } from 'uuid';

// --- INITIAL MAP DATA (NEON CITY COMPLETE) ---
const INITIAL_MAP_DATA: MapObject[] = [
    // 1. THE CANYON (Tall buildings creating a corridor after takeoff)
    { id: 'canyon-1', type: 'BUILDING_TALL', position: [-80, 0, -400], scale: [30, 180, 30] },
    { id: 'canyon-2', type: 'BUILDING_TALL', position: [80, 0, -400], scale: [30, 200, 30] },
    { id: 'canyon-3', type: 'BUILDING_TALL', position: [-90, 0, -600], scale: [40, 220, 40] },
    { id: 'canyon-4', type: 'BUILDING_TALL', position: [90, 0, -600], scale: [40, 150, 40] },
    { id: 'canyon-5', type: 'BUILDING_TALL', position: [-80, 0, -800], scale: [35, 190, 35] },
    { id: 'canyon-6', type: 'BUILDING_TALL', position: [80, 0, -800], scale: [35, 210, 35] },

    // 2. THE SLALOM ZONE (Pyramids for maneuver practice)
    { id: 'slalom-1', type: 'PYRAMID', position: [0, 0, -1200], scale: [60, 60, 60] },
    { id: 'slalom-2', type: 'PYRAMID', position: [100, 0, -1400], scale: [50, 50, 50] },
    { id: 'slalom-3', type: 'PYRAMID', position: [-100, 0, -1600], scale: [50, 50, 50] },
    { id: 'slalom-4', type: 'PYRAMID', position: [100, 0, -1800], scale: [60, 70, 60] },
    { id: 'slalom-5', type: 'PYRAMID', position: [-100, 0, -2000], scale: [60, 70, 60] },

    // 3. RESIDENTIAL DISTRICT (Small buildings scattered)
    { id: 'res-1', type: 'BUILDING_SMALL', position: [200, 0, -500], scale: [20, 30, 20] },
    { id: 'res-2', type: 'BUILDING_SMALL', position: [230, 0, -550], scale: [25, 35, 25] },
    { id: 'res-3', type: 'BUILDING_SMALL', position: [180, 0, -600], scale: [20, 25, 20] },
    { id: 'res-4', type: 'BUILDING_SMALL', position: [-200, 0, -500], scale: [20, 30, 20] },
    { id: 'res-5', type: 'BUILDING_SMALL', position: [-230, 0, -550], scale: [25, 35, 25] },
    { id: 'res-6', type: 'BUILDING_SMALL', position: [-180, 0, -600], scale: [20, 25, 20] },

    // 4. THE GATE (Huge Skyscrapers far out)
    { id: 'gate-1', type: 'BUILDING_TALL', position: [-150, 0, -3000], scale: [50, 300, 50] },
    { id: 'gate-2', type: 'BUILDING_TALL', position: [150, 0, -3000], scale: [50, 300, 50] },
    
    // 5. OBSTACLES SCATTERED
    { id: 'obs-1', type: 'BUILDING_TALL', position: [0, 0, -2500], scale: [40, 100, 40] },
    { id: 'obs-2', type: 'PYRAMID', position: [200, 0, -2500], scale: [100, 100, 100] },
    { id: 'obs-3', type: 'PYRAMID', position: [-200, 0, -2500], scale: [100, 100, 100] },
];

// --- INDEXED DB HELPER ---
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
        const saved = localStorage.getItem('skyace_profile_v5'); 
        if (saved) {
            const parsed = JSON.parse(saved);
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
    localStorage.setItem('skyace_profile_v5', JSON.stringify(p));
};

// --- VOICE CHAT COMPONENT (WITH RADIO EFFECTS) ---
const VoiceChatController = ({ socket, isEnabled, onStatusChange }: { socket: Socket | null, isEnabled: boolean, onStatusChange: (s: string) => void }) => {
    const localStreamRef = useRef<MediaStream | null>(null);
    const peersRef = useRef<Record<string, RTCPeerConnection>>({});
    const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});

    const cleanup = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }
        Object.values(peersRef.current).forEach((p: RTCPeerConnection) => p.close());
        peersRef.current = {};
        setRemoteStreams({});
        onStatusChange("OFFLINE");
    };

    useEffect(() => {
        if (!isEnabled || !socket) {
            cleanup();
            return;
        }

        const initVoice = async () => {
            try {
                onStatusChange("TUNING RADIO...");
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                localStreamRef.current = stream;
                onStatusChange("ON AIR");
            } catch (err) {
                console.error("Mic Error:", err);
                onStatusChange("NO MIC");
            }
        };

        initVoice();
        return cleanup;
    }, [isEnabled, socket]);

    useEffect(() => {
        if (!socket || !isEnabled) return;

        const createPeer = (targetId: string, initiator: boolean) => {
            if (peersRef.current[targetId]) return peersRef.current[targetId];

            const pc = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });

            peersRef.current[targetId] = pc;

            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current!));
            }

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit('voice-signal', { to: targetId, signal: { candidate: event.candidate } });
                }
            };

            pc.ontrack = (event) => {
                const stream = event.streams[0];
                if (stream) {
                    setRemoteStreams(prev => ({ ...prev, [targetId]: stream }));
                }
            };

            if (initiator) {
                pc.createOffer()
                    .then(offer => pc.setLocalDescription(offer))
                    .then(() => {
                        socket.emit('voice-signal', { to: targetId, signal: { sdp: pc.localDescription } });
                    })
                    .catch(e => console.error("Offer Error", e));
            }

            return pc;
        };

        const handlePlayerJoined = (player: any) => {
            if (player.id !== socket.id) {
                createPeer(player.id, true);
            }
        };

        const handlePlayerLeft = (id: string) => {
            if (peersRef.current[id]) {
                peersRef.current[id].close();
                delete peersRef.current[id];
                setRemoteStreams(prev => {
                    const { [id]: deleted, ...rest } = prev;
                    return rest;
                });
            }
        };

        const handleSignal = async ({ from, signal }: { from: string, signal: any }) => {
            const pc = peersRef.current[from] || createPeer(from, false);
            try {
                if (signal.sdp) {
                    await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
                    if (signal.sdp.type === 'offer') {
                        const answer = await pc.createAnswer();
                        await pc.setLocalDescription(answer);
                        socket.emit('voice-signal', { to: from, signal: { sdp: pc.localDescription } });
                    }
                } else if (signal.candidate) {
                    await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
                }
            } catch(e) { console.error("Signal Error", e); }
        };

        const handleCurrentPlayers = (players: any) => {
            Object.keys(players).forEach(id => {
                if (id !== socket.id) createPeer(id, true); 
            });
        };

        socket.on('playerJoined', handlePlayerJoined);
        socket.on('playerLeft', handlePlayerLeft);
        socket.on('voice-signal', handleSignal);
        socket.on('currentPlayers', handleCurrentPlayers);

        return () => {
            socket.off('playerJoined', handlePlayerJoined);
            socket.off('playerLeft', handlePlayerLeft);
            socket.off('voice-signal', handleSignal);
            socket.off('currentPlayers', handleCurrentPlayers);
        };
    }, [socket, isEnabled]);

    return (
        <>
            {Object.entries(remoteStreams).map(([id, stream]) => (
                <RadioAudioElement key={id} stream={stream as MediaStream} />
            ))}
        </>
    );
};

// --- RADIO AUDIO PROCESSING COMPONENT ---
const RadioAudioElement: React.FC<{ stream: MediaStream }> = ({ stream }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);

    useEffect(() => {
        if (!stream) return;

        // Create Audio Context
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        // 1. Source
        const source = ctx.createMediaStreamSource(stream);

        // 2. Bandpass Filter (Radio Effect)
        // Cuts low frequencies (below 300Hz) and high frequencies (above 3000Hz)
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1000;
        filter.Q.value = 1.0; 

        // 3. Distortion (Slight clipping for "cheap speaker" sound)
        const shaper = ctx.createWaveShaper();
        shaper.curve = makeDistortionCurve(50); // Amount of distortion
        shaper.oversample = '4x';

        // 4. White Noise (Static background)
        const bufferSize = ctx.sampleRate * 2; // 2 seconds of noise buffer
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noiseNode = ctx.createBufferSource();
        noiseNode.buffer = buffer;
        noiseNode.loop = true;
        
        const noiseGain = ctx.createGain();
        noiseGain.gain.value = 0.05; // FIX: .value does not exist on GainNode, use .gain.value

        // 5. Connect the chain
        // Voice path: Source -> Filter -> Distortion -> Destination
        source.connect(filter);
        filter.connect(shaper);
        shaper.connect(ctx.destination);

        // Noise path: Noise -> Gain -> Destination
        noiseNode.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noiseNode.start();

        return () => {
            source.disconnect();
            filter.disconnect();
            shaper.disconnect();
            noiseNode.stop();
            noiseNode.disconnect();
            ctx.close();
        };
    }, [stream]);

    // Utility to create distortion curve
    function makeDistortionCurve(amount: number) {
        const k = typeof amount === 'number' ? amount : 50;
        const n_samples = 44100;
        const curve = new Float32Array(n_samples);
        const deg = Math.PI / 180;
        for (let i = 0; i < n_samples; ++i) {
            const x = (i * 2) / n_samples - 1;
            curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
        }
        return curve;
    }

    // Backup invisible audio element just in case context fails or needs user gesture first
    return null; 
}

// --- NETWORK PLANE COMPONENT ---
const NetworkPlane: React.FC<{ data: NetworkPlayerData }> = ({ data }) => {
    const groupRef = useRef<Group>(null);
    const skin = SKINS.find(s => s.id === data.skin) || SKINS[0];

    useFrame(() => {
        if (groupRef.current) {
            groupRef.current.position.set(data.x, data.y, data.z);
            groupRef.current.quaternion.set(data.qx, data.qy, data.qz, data.qw);
        }
    });

    return (
        <PlaneModel 
            ref={groupRef}
            playerName={data.name}
            skin={skin}
            physicsPosition={new Vector3(data.x, data.y, data.z)}
            showNameTag={true}
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
  isEditorMode,
  // Voice Props
  isVoiceEnabled,
  setVoiceStatus,
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
  isEditorMode: boolean,
  isVoiceEnabled: boolean,
  setVoiceStatus: (s: string) => void,
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

  // --- MULTIPLAYER LOGIC ---
  const socketRef = useRef<Socket | null>(null);
  const [networkPlayers, setNetworkPlayers] = useState<Record<string, NetworkPlayerData>>({});
  const updateTimer = useRef(0);

  useEffect(() => {
    if (!isEditorMode) {
        socketRef.current = io(); 
        socketRef.current.on('connect', () => {
            socketRef.current?.emit('join', { name: profile.name, skin: profile.equippedSkin });
            console.log("Connected to Multiplayer Server, joining as", profile.name);
        });
        socketRef.current.on('currentPlayers', (players: Record<string, NetworkPlayerData>) => {
            const others = { ...players };
            const myId = (socketRef.current as any)?.id;
            if (myId) delete others[myId];
            setNetworkPlayers(others);
        });
        socketRef.current.on('playerJoined', (player: NetworkPlayerData) => {
            setNetworkPlayers(prev => ({ ...prev, [player.id]: player }));
        });
        socketRef.current.on('playerMoved', ({ id, data }: { id: string, data: any }) => {
            setNetworkPlayers(prev => {
                if (!prev[id]) return prev;
                return { ...prev, [id]: { ...prev[id], ...data } };
            });
        });
        socketRef.current.on('playerLeft', (id: string) => {
            setNetworkPlayers(prev => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
        });
        return () => { socketRef.current?.disconnect(); };
    }
  }, [isEditorMode]);

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
    if (isEditorMode) {
        camera.position.y = Math.max(10, camera.position.y);
        if (controls.current.throttleUp) camera.position.z -= 100 * delta;
        if (controls.current.throttleDown) camera.position.z += 100 * delta;
        if (controls.current.rollLeft) camera.position.x -= 100 * delta;
        if (controls.current.rollRight) camera.position.x += 100 * delta;
        if (controls.current.pitchUp) camera.position.y += 50 * delta;
        if (controls.current.pitchDown) camera.position.y -= 50 * delta;
        camera.lookAt(camera.position.x, 0, camera.position.z - 100);
        return;
    }

    if (!gameState.isPlaying || gameState.isGameOver || gameState.isPaused) return;

    const dt = Math.min(delta, 0.1); 

    // Coin Generation
    if (!gameState.isGameOver && speedRef.current > 50) {
        coinTimer.current += dt;
        if (coinTimer.current > 5) {
            onAddCoin();
            coinTimer.current = 0;
        }
    }

    // Controls
    if (controls.current.throttleUp) throttleRef.current = Math.min(throttleRef.current + 0.5 * dt, 1);
    if (controls.current.throttleDown) throttleRef.current = Math.max(throttleRef.current - 0.5 * dt, 0);

    const kbPitch = (controls.current.pitchUp ? 1 : 0) - (controls.current.pitchDown ? 1 : 0);
    const kbRoll = (controls.current.rollLeft ? 1 : 0) - (controls.current.rollRight ? 1 : 0);
    let combinedPitch = kbPitch;
    let combinedRoll = kbRoll;
    if (controls.current.joyPitch !== 0) combinedPitch = controls.current.joyPitch; 
    if (controls.current.joyRoll !== 0) combinedRoll = -controls.current.joyRoll; 
    const finalPitchInput = profile.settings.invertedLook ? -combinedPitch : combinedPitch;

    // Physics
    const isGrounded = planePosition.current.y <= 0.1;
    const airSpeed = speedRef.current;
    const authority = Math.min(airSpeed / 60, 1.0) * profile.settings.sensitivity; 

    if (isGrounded) {
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

    // Collision
    const planeBox = { 
        min: planePosition.current.clone().subScalar(2), 
        max: planePosition.current.clone().addScalar(2) 
    };

    for (const obj of mapObjects) {
        if (obj.type === 'RING') continue; 
        
        const objPos = new Vector3(...obj.position);
        const halfScale = new Vector3(...obj.scale).multiplyScalar(0.5);
        
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

    if (!isEditorMode && socketRef.current) {
        updateTimer.current += dt;
        if (updateTimer.current > 0.05) {
            socketRef.current.emit('updateMovement', {
                x: planePosition.current.x,
                y: planePosition.current.y,
                z: planePosition.current.z,
                qx: planeRotation.current.x,
                qy: planeRotation.current.y,
                qz: planeRotation.current.z,
                qw: planeRotation.current.w,
            });
            updateTimer.current = 0;
        }
    }

    // Camera
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

  return (
    <>
        {!isEditorMode && (
        <>
            <VoiceChatController socket={socketRef.current} isEnabled={isVoiceEnabled} onStatusChange={setVoiceStatus} />
            
            <PlaneModel 
                ref={planeRef}
                playerName={profile.name}
                skin={skin}
                physicsPosition={planePosition.current}
                showNameTag={!gameState.isGameOver} 
            />
            
            {Object.values(networkPlayers).map((p: NetworkPlayerData) => (
                <NetworkPlane key={p.id} data={p} />
            ))}
        </>
        )}
        
        {/* Pass Active Ring Info to World */}
        <World 
            mapObjects={mapObjects} 
            isEditorMode={isEditorMode} 
            onPlaceObject={(p,t) => {}} // Props passed in parent
            onRemoveObject={(id) => {}} // Props passed in parent
        />
    </>
  );
}

// --- APP COMPONENT ---
export default function App() {
  const [profile, setProfile] = useState<PlayerProfile>(loadProfile());
  const [screen, setScreen] = useState<'LOADING'|'MENU'|'GAME'|'GARAGE'|'PROFILE'|'SETTINGS'>('LOADING');
  const [gameState, setGameState] = useState<GameState>({ isPlaying: false, isPaused: false, isGameOver: false, gameOverReason: null });
  const [flightData, setFlightData] = useState<FlightData>({ speed: 0, altitude: 0, fuel: 100, heading: 0, pitch: 0, roll: 0, isGrounded: true });
  const [cameraMode, setCameraMode] = useState<'THIRD' | 'FIRST'>('THIRD');
  
  // Editor
  const [isEditorMode, setIsEditorMode] = useState(false);
  const [mapObjects, setMapObjects] = useState<MapObject[]>(INITIAL_MAP_DATA);
  const [selectedEditorType, setSelectedEditorType] = useState<MapObjectType>('BUILDING_TALL');
  const [showExportModal, setShowExportModal] = useState(false);

  // Voice
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("OFFLINE");

  useEffect(() => {
    // --- VERSION CHECK LOG ---
    console.log("Sky Ace v3.2.1 - Fix TS GainNode Error - Loaded Successfully");
  }, []);

  const handlePlaceObject = (pos: Vector3, type: MapObjectType) => {
      const newObj: MapObject = {
          id: uuidv4(),
          type: type,
          position: [pos.x, 0, pos.z],
          scale: [20, 20, 20]
      };
      if (type === 'BUILDING_TALL') newObj.scale = [30, 100 + Math.random() * 50, 30];
      if (type === 'BUILDING_SMALL') newObj.scale = [20, 30, 20];
      if (type === 'PYRAMID') newObj.scale = [40, 40, 40];
      setMapObjects(prev => [...prev, newObj]);
  };

  const handleRemoveObject = (id: string) => {
      setMapObjects(prev => prev.filter(o => o.id !== id));
  };

  const [sfxTrigger, setSfxTrigger] = useState<{type: string, id: number} | null>(null);
  const triggerSound = (type: string) => setSfxTrigger({ type, id: Date.now() });
  
  const controls = useRef<ControlsState>({ throttleUp: false, throttleDown: false, pitchUp: false, pitchDown: false, rollLeft: false, rollRight: false, yawLeft: false, yawRight: false, joyPitch: 0, joyRoll: 0 });
  const dummyControls = useRef<ControlsState>({ throttleUp: false, throttleDown: false, pitchUp: false, pitchDown: false, rollLeft: false, rollRight: false, yawLeft: false, yawRight: false, joyPitch: 0, joyRoll: 0 });

  useEffect(() => {
      loadAllAudioFromDB().then((loaded) => {
          if (Object.keys(loaded).length > 0) setProfile(p => ({...p, customAudio: {...p.customAudio, ...loaded}}));
          setTimeout(() => setScreen('MENU'), 2500);
      });
  }, []);

  useEffect(() => saveProfile(profile), [profile]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': controls.current.throttleUp = true; break;
        case 'KeyS': controls.current.throttleDown = true; break;
        case 'ArrowDown': case 'Space': controls.current.pitchUp = true; break; 
        case 'ArrowUp': case 'ShiftLeft': controls.current.pitchDown = true; break; 
        case 'KeyA': case 'ArrowLeft': controls.current.rollLeft = true; break;
        case 'KeyD': case 'ArrowRight': controls.current.rollRight = true; break;
        case 'KeyV': setIsVoiceActive(p => !p); break;
        case 'Escape': if (screen === 'GAME' && !isEditorMode) setGameState(p => ({...p, isPaused: !p.isPaused})); break;
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
  }, [screen, isEditorMode]); 

  const startGame = () => {
      triggerSound('click');
      setGameState({ isPlaying: true, isPaused: false, isGameOver: false, gameOverReason: null });
      setScreen('GAME');
      setProfile(p => ({...p, stats: {...p.stats, flights: p.stats.flights + 1}}));
  };

  const handleGameOver = (reason: 'CRASH' | 'FUEL') => {
      if (isEditorMode) return; 
      setGameState(p => ({ ...p, isGameOver: true, gameOverReason: reason }));
      setProfile(p => ({ ...p, stats: { ...p.stats, crashes: p.stats.crashes + 1 } }));
  };

  const handleAddCoin = () => setProfile(p => ({ ...p, coins: p.coins + 1 }));
  const handleUnlockSkin = (id: string) => {
      const skin = SKINS.find(s => s.id === id);
      if (!skin) return;
      if (profile.coins >= skin.price) {
          triggerSound('buy');
          setProfile(p => ({ ...p, coins: p.coins - skin.price, unlockedSkins: [...p.unlockedSkins, id], equippedSkin: id }));
      }
  };
  const handleEquipSkin = (id: string) => {
      triggerSound('click');
      if (profile.unlockedSkins.includes(id)) setProfile(p => ({ ...p, equippedSkin: id }));
  };
  const handleUpdateCustomAudio = async (key: string, value: File | string) => {
      if (value instanceof File) {
          await saveAudioToDB(key, value);
          const url = URL.createObjectURL(value);
          setProfile(p => ({...p, customAudio: {...p.customAudio, [key]: url}}));
      } else if (value === '') {
          await deleteAudioFromDB(key);
          setProfile(p => ({...p, customAudio: {...p.customAudio, [key]: ''}}));
      }
  };
  const handleRedeemCode = (code: string) => { /* Code Logic */ };

  const renderSoundManager = () => (
      <SoundManager 
          throttle={controls.current.throttleUp ? 1 : controls.current.throttleDown ? 0 : 0.5} 
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
                isVoiceEnabled={isVoiceActive}
                setVoiceStatus={setVoiceStatus}
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
                 isVoiceEnabled={false}
                 setVoiceStatus={() => {}}
             />
             <OrbitingCamera />
         </group>
      );
  };

  return (
    <div className="w-full h-full relative bg-slate-950 overflow-hidden select-none" onContextMenu={e => e.preventDefault()}>
        {screen === 'LOADING' && <LoadingScreen />}
        <Canvas shadows camera={{ position: [5, 5, 410], fov: 60 }} gl={{ antialias: true }}>
            {renderSoundManager()}
            {renderScene()}
        </Canvas>

        {screen === 'MENU' && <MainMenu onStart={startGame} profile={profile} setScreen={(s) => { triggerSound('click'); setScreen(s as any); }} />}
        {screen === 'GARAGE' && <Garage profile={profile} onBuy={handleUnlockSkin} onEquip={handleEquipSkin} onClose={() => { triggerSound('click'); setScreen('MENU'); }} />}
        {screen === 'PROFILE' && <ProfileScreen profile={profile} onRedeemCode={handleRedeemCode} onClose={() => { triggerSound('click'); setScreen('MENU'); }} />}
        {screen === 'SETTINGS' && <SettingsScreen profile={profile} updateSettings={(k: any,v: any) => setProfile(p => ({...p, settings: {...p.settings, [k]: v}}))} updateCustomAudio={handleUpdateCustomAudio} onClose={() => { triggerSound('click'); setScreen('MENU'); }} />}

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
                isVoiceActive={isVoiceActive}
                toggleVoice={() => setIsVoiceActive(p => !p)}
                voiceStatus={voiceStatus}
            />
        )}
        
        {screen === 'GAME' && !gameState.isGameOver && !gameState.isPaused && !isEditorMode && <MobileControls controls={controls} />}
        
        {showExportModal && (
            <div className="absolute inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-8 font-rajdhani">
                <div className="bg-slate-900 border border-amber-500 p-6 w-full max-w-2xl rounded">
                    <h2 className="text-2xl text-white font-bold mb-4">EXPORT MAP DATA</h2>
                    <textarea readOnly className="w-full h-64 bg-black text-green-400 font-mono text-xs p-4 rounded border border-white/10" value={JSON.stringify(mapObjects, null, 2)} />
                    <div className="flex gap-4 mt-4">
                        <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(mapObjects, null, 2)); alert("Copied!"); }} className="bg-amber-500 text-black px-6 py-2 font-bold hover:bg-amber-400">COPY</button>
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
