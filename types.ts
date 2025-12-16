
export interface GameState {
  isPlaying: boolean;
  isPaused: boolean;
  isGameOver: boolean;
  gameOverReason: 'CRASH' | 'FUEL' | null;
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
  // Analog inputs (-1 to 1) for joystick
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
  idle: string; // Som parado (opcional, senão usa engine lento)
  music: string;
  click: string;
  coin: string;
  buy: string; // Especial loja
  win: string; // Troféu/Recompensa
}

export interface PlayerProfile {
  name: string;
  coins: number;
  unlockedSkins: string[]; // IDs das skins
  equippedSkin: string;
  stats: {
    flights: number;
    crashes: number;
    flightTime: number; // segundos
    maxAltitude: number;
  };
  settings: {
    musicVolume: number;
    sfxVolume: number;
    sensitivity: number;
    invertedLook: boolean;
  };
  customAudio: CustomAudioMap; // Novo campo
}

// --- MAP EDITOR TYPES ---
export type MapObjectType = 'BUILDING_SMALL' | 'BUILDING_TALL' | 'RING' | 'PYRAMID';

export interface MapObject {
    id: string;
    type: MapObjectType;
    position: [number, number, number];
    scale: [number, number, number];
    rotation?: [number, number, number];
}

export const GRAVITY = 9.81;
export const MAX_SPEED = 250;
export const STALL_SPEED = 60;
export const MAX_FUEL = 100;

export const SKINS: Skin[] = [
  { id: 'default', name: 'Blue Ace (Líder)', price: 0, primaryColor: '#0ea5e9', secondaryColor: '#0284c7' },
  { id: 'kazada', name: 'Gabi Special', price: 9999, primaryColor: '#db2777', secondaryColor: '#be185d', isSpecial: true },
  { id: 'pedro', name: 'Sky King (Pedro)', price: 9999, primaryColor: '#06b6d4', secondaryColor: '#0891b2', isSpecial: true },
  { id: 'stealth', name: 'Ghost Ops', price: 0, primaryColor: '#1e293b', secondaryColor: '#0f172a' },
  { id: 'gold', name: 'Golden Eagle', price: 5000, primaryColor: '#fbbf24', secondaryColor: '#b45309', isSpecial: true },
  { id: 'forest', name: 'Jungle Camo', price: 1500, primaryColor: '#15803d', secondaryColor: '#14532d' },
];

declare global {
  namespace JSX {
    interface IntrinsicElements {}
  }
}
