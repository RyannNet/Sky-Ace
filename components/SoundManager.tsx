
import React, { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { CustomAudioMap } from '../types';

interface SoundManagerProps {
  throttle: number;
  speed: number;
  isPaused: boolean;
  isGameOver: boolean;
  volume: { music: number; sfx: number };
  customAudio: CustomAudioMap;
  triggerSfx: { type: string, id: number } | null;
}

export const SoundManager: React.FC<SoundManagerProps> = ({ throttle, speed, isPaused, isGameOver, volume, customAudio, triggerSfx }) => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  
  // Custom Audio Elements (Buffers)
  const buffersRef = useRef<{[key: string]: AudioBuffer}>({});
  const activeSourcesRef = useRef<{[key: string]: AudioBufferSourceNode}>({});

  // Fallback Nodes (Procedural)
  const engineOscRef = useRef<OscillatorNode | null>(null);
  const engineGainRef = useRef<GainNode | null>(null);
  
  // Custom Engine Source (For pitch shifting)
  const engineSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const bgMusicSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Load Audio Buffer Helper
  const loadBuffer = async (url: string, key: string) => {
      if (!url || !audioCtxRef.current || audioCtxRef.current.state === 'closed') return;
      try {
          const response = await fetch(url);
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await audioCtxRef.current.decodeAudioData(arrayBuffer);
          buffersRef.current[key] = audioBuffer;
      } catch (e) {
          console.warn("Failed to load audio:", url);
      }
  };

  // Play One-Shot SFX
  const playOneShot = (key: string) => {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed' || !buffersRef.current[key] || !masterGainRef.current) return;
      
      const source = audioCtxRef.current.createBufferSource();
      source.buffer = buffersRef.current[key];
      
      const gain = audioCtxRef.current.createGain();
      gain.gain.value = volume.sfx;
      
      source.connect(gain);
      gain.connect(masterGainRef.current);
      source.start();
  };

  // Initialize Audio System
  useEffect(() => {
    const initAudio = async () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') return;

      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new Ctx();
      audioCtxRef.current = ctx;

      const master = ctx.createGain();
      master.gain.value = 1.0;
      master.connect(ctx.destination);
      masterGainRef.current = master;

      // Load Custom Sounds if provided
      if (customAudio.engine) await loadBuffer(customAudio.engine, 'engine');
      if (customAudio.music) await loadBuffer(customAudio.music, 'music');
      if (customAudio.click) await loadBuffer(customAudio.click, 'click');
      if (customAudio.coin) await loadBuffer(customAudio.coin, 'coin');
      if (customAudio.buy) await loadBuffer(customAudio.buy, 'buy');
      if (customAudio.win) await loadBuffer(customAudio.win, 'win');

      // --- SETUP ENGINE (Custom vs Procedural) ---
      if (buffersRef.current['engine']) {
          // Custom Engine
          const source = ctx.createBufferSource();
          source.buffer = buffersRef.current['engine'];
          source.loop = true;
          
          const gain = ctx.createGain();
          gain.gain.value = 0;
          
          source.connect(gain);
          gain.connect(master);
          source.start();
          
          engineSourceRef.current = source;
          engineGainRef.current = gain;
      } else {
          // Procedural Fallback Engine
          const engineOsc = ctx.createOscillator();
          engineOsc.type = 'sawtooth';
          engineOsc.frequency.value = 50;
          
          const engineFilter = ctx.createBiquadFilter();
          engineFilter.type = 'lowpass';
          engineFilter.frequency.value = 100;
          
          const gain = ctx.createGain();
          gain.gain.value = 0;
          
          engineOsc.connect(engineFilter);
          engineFilter.connect(gain);
          gain.connect(master);
          engineOsc.start();
          
          engineOscRef.current = engineOsc;
          engineGainRef.current = gain;
      }

      // --- SETUP MUSIC ---
      if (buffersRef.current['music']) {
          const musicSource = ctx.createBufferSource();
          musicSource.buffer = buffersRef.current['music'];
          musicSource.loop = true;
          
          const musicGain = ctx.createGain();
          musicGain.gain.value = volume.music;
          
          musicSource.connect(musicGain);
          musicGain.connect(master);
          musicSource.start();
          bgMusicSourceRef.current = musicSource;
      }
    };

    const handleInteract = () => {
        if (audioCtxRef.current?.state === 'suspended') {
            audioCtxRef.current.resume();
        } else if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
            initAudio();
        }
    };

    window.addEventListener('click', handleInteract);
    window.addEventListener('keydown', handleInteract);
    window.addEventListener('touchstart', handleInteract);

    return () => {
        window.removeEventListener('click', handleInteract);
        window.removeEventListener('keydown', handleInteract);
        window.removeEventListener('touchstart', handleInteract);
        // Só tenta fechar se não estiver fechado
        if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
            audioCtxRef.current.close().catch(e => console.warn("Error closing AudioContext", e));
        }
    };
  }, [customAudio]); // Re-init if audio links change

  // Handle SFX Triggers
  useEffect(() => {
      if (triggerSfx) {
          playOneShot(triggerSfx.type);
      }
  }, [triggerSfx]);

  // Update Loop
  useFrame(() => {
     if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') return;
     const ctx = audioCtxRef.current;
     const now = ctx.currentTime;

     // 1. Master Volume (Pause/GameOver Muting)
     if (isPaused || isGameOver) {
         if (masterGainRef.current) masterGainRef.current.gain.setTargetAtTime(0.0, now, 0.2);
     } else {
         if (masterGainRef.current) masterGainRef.current.gain.setTargetAtTime(1.0, now, 0.2);
     }

     // 2. Engine Physics (Pitch Shifting)
     if (engineGainRef.current) {
         const targetVol = (0.1 + throttle * 0.4) * volume.sfx;
         engineGainRef.current.gain.setTargetAtTime(targetVol, now, 0.1);

         if (engineSourceRef.current) {
             // Custom Audio: Change Playback Rate
             // 0 throttle = 0.8x speed, 1 throttle = 1.5x speed
             const pitch = 0.8 + (throttle * 0.7);
             engineSourceRef.current.playbackRate.setTargetAtTime(pitch, now, 0.2);
         } else if (engineOscRef.current) {
             // Fallback: Change Frequency
             const freq = 50 + (throttle * 70);
             engineOscRef.current.frequency.setTargetAtTime(freq, now, 0.1);
         }
     }
  });

  return null;
};
