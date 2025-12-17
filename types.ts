
export interface GameState {
  isPlaying: boolean;
  isPaused: boolean;
  isGameOver: boolean;
  gameOverReason: 'CRASH' | 'FUEL' | 'WATER_CRASH' | null;
  currentRoom: string;
}

export interface FlightData {
  speed: number;
  altitude: number;
  fuel: number;
  heading: number;
  pitch: number;
  roll: number;
  isGrounded: boolean;
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
    turbo: number; // 1-5
    handling: number; // 1-5
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

export type MapObjectType = 'BUILDING_SMALL' | 'BUILDING_TALL' | 'RING' | 'PYRAMID' | 'HANGAR' | 'TOWER' | 'CITY_SKYSCRAPER';

export interface MapObject {
    id: string;
    type: MapObjectType;
    position: [number, number, number];
    scale: [number, number, number];
    rotation?: [number, number, number];
}

export const GRAVITY = 9.81;
export const MAX_SPEED_BASE = 250;
export const STALL_SPEED = 60;
export const MAX_FUEL = 100;

export const SKINS: Skin[] = [
  { id: 'default', name: 'Blue Ace (Líder)', price: 0, primaryColor: '#0ea5e9', secondaryColor: '#0284c7' },
  { id: 'kazada', name: 'Gabi Special', price: 9999, primaryColor: '#db2777', secondaryColor: '#be185d', isSpecial: true },
  { id: 'pedro', name: 'Sky King (Pedro)', price: 9999, primaryColor: '#06b6d4', secondaryColor: '#0891b2', isSpecial: true },
  { id: 'stealth', name: 'Ghost Ops', price: 2000, primaryColor: '#1e293b', secondaryColor: '#0f172a' },
  { id: 'gold', name: 'Golden Eagle', price: 5000, primaryColor: '#fbbf24', secondaryColor: '#b45309', isSpecial: true },
  { id: 'forest', name: 'Jungle Camo', price: 1500, primaryColor: '#15803d', secondaryColor: '#14532d' },
];
