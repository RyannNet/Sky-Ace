
export interface GameState {
  isPlaying: boolean;
  isPaused: boolean;
  isGameOver: boolean;
  gameOverReason: 'CRASH' | 'FUEL' | 'WATER_CRASH' | null;
  currentRoom: string;
  isEditorMode: boolean;
}

export interface FlightData {
  speed: number;
  altitude: number;
  fuel: number;
  heading: number;
  pitch: number;
  roll: number;
  isGrounded: boolean;
  x: number;
  z: number;
}

export interface Mission {
  id: string;
  distance: 2 | 7 | 9 | 15 | 35;
  targetPos: [number, number, number];
  reward: number;
  destinationName: string;
  active: boolean;
}

export interface WorldObject {
  id: string;
  type: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

export interface ControlsState {
  throttleUp: boolean;
  throttleDown: boolean;
  pitchUp: boolean;
  pitchDown: boolean;
  rollLeft: boolean;
  rollRight: boolean;
  yawLeft: boolean;
  yawRight: boolean;
  joyPitch: number;
  joyRoll: number;
}

export interface Skin {
  id: string;
  name: string;
  price: number;
  primaryColor: string;
  secondaryColor: string;
  isSpecial?: boolean;
}

export interface CustomAudioMap {
  engine: string;
  idle: string;
  music: string;
  click: string;
  coin: string;
  buy: string; 
  win: string;
}

export interface PlayerProfile {
  name: string;
  coins: number;
  unlockedSkins: string[];
  equippedSkin: string;
  upgrades: {
    turbo: number;
    handling: number;
  };
  stats: {
    flights: number;
    crashes: number;
    flightTime: number;
    maxAltitude: number;
  };
  settings: {
    musicVolume: number;
    sfxVolume: number;
    sensitivity: number;
    invertedLook: boolean;
  };
  customAudio: CustomAudioMap;
  customWorldObjects?: WorldObject[];
}

export interface NetworkPlayerData {
    id: string;
    name: string;
    skin: string;
    room: string;
    x: number;
    y: number;
    z: number;
    qx: number;
    qy: number;
    qz: number;
    qw: number;
}

export const GRAVITY = 9.81;
export const MAX_SPEED_BASE = 320;
export const STALL_SPEED = 75;
export const MAX_FUEL = 100;

export const SKINS: Skin[] = [
  { id: 'default', name: 'Commercial White', price: 0, primaryColor: '#ffffff', secondaryColor: '#334155' },
  { id: 'kazada', name: 'Gabi Special', price: 9999, primaryColor: '#db2777', secondaryColor: '#be185d', isSpecial: true },
  { id: 'pedro', name: 'Sky King (Pedro)', price: 9999, primaryColor: '#06b6d4', secondaryColor: '#0891b2', isSpecial: true },
  { id: 'stealth', name: 'Ghost Executive', price: 2000, primaryColor: '#1e293b', secondaryColor: '#0f172a' },
  { id: 'gold', name: 'Royal Gold', price: 5000, primaryColor: '#fbbf24', secondaryColor: '#b45309', isSpecial: true },
];
