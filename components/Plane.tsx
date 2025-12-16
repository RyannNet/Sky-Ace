
import React, { useRef, useState, forwardRef } from 'react';
import { Vector3, Group } from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, Text } from '@react-three/drei';
import { Skin } from '../types';

// --- Heart Trail System ---
const HeartTrail: React.FC<{ parentPosition: Vector3; active: boolean }> = ({ parentPosition, active }) => {
  const [hearts, setHearts] = useState<{ id: number; pos: Vector3; opacity: number; scale: number }[]>([]);
  const lastSpawnTime = useRef(0);
  const { camera } = useThree();

  useFrame((state) => {
    const now = state.clock.getElapsedTime();
    
    // Spawn new hearts if active
    if (active && now - lastSpawnTime.current > 0.1) {
      setHearts(prev => [
        ...prev, 
        { 
          id: Math.random(), 
          pos: parentPosition.clone().add(new Vector3((Math.random() - 0.5) * 2, 0, (Math.random() - 0.5) * 2)), 
          opacity: 1, 
          scale: 1 
        }
      ]);
      lastSpawnTime.current = now;
    }

    // Animate existing hearts
    setHearts(prev => prev.map(h => ({
      ...h,
      pos: h.pos.clone().add(new Vector3(0, 0.05, 0)), 
      opacity: h.opacity - 0.015,
      scale: h.scale * 0.98
    })).filter(h => h.opacity > 0));
  });

  return (
    <group>
      {hearts.map(heart => (
        <group key={heart.id} position={heart.pos}>
            <Text
              fontSize={1.5 * heart.scale}
              fillOpacity={heart.opacity}
              color="#ff0066"
              anchorX="center"
              anchorY="middle"
              quaternion={camera.quaternion} 
            >
              ❤️
            </Text>
        </group>
      ))}
    </group>
  );
};

interface PlaneProps {
    playerName: string;
    skin: Skin;
    physicsPosition: Vector3; 
    showNameTag?: boolean;
}

export const PlaneModel = forwardRef<Group, PlaneProps>(({ playerName, skin, physicsPosition, showNameTag = true }, ref) => {
  const propellerRef = useRef<Group>(null);

  useFrame((state, delta) => {
    if (propellerRef.current) {
      propellerRef.current.rotation.z += delta * 20;
    }
  });

  // --- LABEL STYLING LOGIC ---
  const isGabi = skin.id === 'kazada';
  const isPedro = skin.id === 'pedro';

  return (
    <>
      <group ref={ref}>
        {/* IMPROVED HTML NAME TAG */}
        {showNameTag && (
            <Html position={[0, 4, 0]} center zIndexRange={[100, 0]} distanceFactor={20}>
                <div className="flex flex-col items-center">
                    {/* The Label Container */}
                    <div className={`
                        relative px-6 py-2 rounded-xl backdrop-blur-md border 
                        ${isGabi ? 'bg-pink-900/40 border-pink-500/50' : 
                          isPedro ? 'bg-cyan-900/40 border-cyan-400/50' : 
                          'bg-slate-900/60 border-slate-500/50'}
                        shadow-lg transform transition-all
                    `}>
                        {/* The Nickname */}
                        <div className={`
                            text-2xl font-black whitespace-nowrap drop-shadow-md
                            ${isGabi ? 'text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400' : 
                              isPedro ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-blue-600 font-[Host Grotesk]' : 
                              'text-white font-mono'}
                        `}>
                            {playerName}
                        </div>
                        
                        {/* Rank/Title Subtitle */}
                        <div className={`
                            text-[10px] text-center uppercase tracking-[0.3em] mt-1 font-bold
                            ${isGabi ? 'text-pink-300' : isPedro ? 'text-cyan-300' : 'text-slate-400'}
                        `}>
                             {isGabi ? 'ACE PILOT' : isPedro ? 'WINGMAN' : 'PILOT'}
                        </div>
                    </div>
                    
                    {/* Little connecting line to plane */}
                    <div className={`w-[2px] h-8 ${isGabi ? 'bg-pink-500/50' : isPedro ? 'bg-cyan-500/50' : 'bg-slate-500/50'}`}></div>
                </div>
            </Html>
        )}

        {/* --- GEOMETRY: Forward is -Z --- */}

        {/* Main Fuselage */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.4, 1.4, 6]} />
          <meshStandardMaterial color={skin.primaryColor} roughness={0.4} />
        </mesh>
        
        {/* Cockpit */}
        <mesh position={[0, 0.75, -0.5]}>
          <boxGeometry args={[1.1, 0.7, 2.2]} />
          <meshStandardMaterial color="#bae6fd" transparent opacity={0.6} roughness={0.1} />
        </mesh>

        {/* Wings */}
        <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[9, 0.2, 1.8]} />
          <meshStandardMaterial color={skin.secondaryColor} roughness={0.4} />
        </mesh>

        {/* Tail Vertical */}
        <mesh position={[0, 1.2, 2.5]} castShadow receiveShadow>
          <boxGeometry args={[0.2, 1.8, 1.2]} />
          <meshStandardMaterial color={skin.secondaryColor} roughness={0.4} />
        </mesh>

        {/* Tail Horizontal */}
        <mesh position={[0, 0.4, 2.5]} castShadow receiveShadow>
          <boxGeometry args={[3.2, 0.2, 1.0]} />
          <meshStandardMaterial color={skin.secondaryColor} roughness={0.4} />
        </mesh>

        {/* Propeller Hub */}
        <mesh position={[0, 0, -3.1]}>
          <boxGeometry args={[0.7, 0.7, 0.5]} />
          <meshStandardMaterial color="#334155" />
        </mesh>

        {/* Propeller Blades */}
        <group ref={propellerRef} position={[0, 0, -3.4]}>
          <mesh>
            <boxGeometry args={[4.2, 0.3, 0.05]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <boxGeometry args={[4.2, 0.3, 0.05]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
        </group>
        
        {/* Landing Gear */}
        <mesh position={[0, -1, -1.5]}>
           <boxGeometry args={[0.3, 0.8, 0.3]} />
           <meshStandardMaterial color="#334155" />
        </mesh>
        <mesh position={[0, -1.4, -1.5]} rotation={[0,0,Math.PI/2]}>
           <cylinderGeometry args={[0.3, 0.3, 0.2]} />
           <meshStandardMaterial color="#000" />
        </mesh>

        <group position={[0,0, 1]}>
            <mesh position={[1, -1, 0]}>
               <boxGeometry args={[0.3, 0.8, 0.3]} />
               <meshStandardMaterial color="#334155" />
            </mesh>
            <mesh position={[1.1, -1.4, 0]} rotation={[0,0,Math.PI/2]}>
               <cylinderGeometry args={[0.3, 0.3, 0.2]} />
               <meshStandardMaterial color="#000" />
            </mesh>

            <mesh position={[-1, -1, 0]}>
               <boxGeometry args={[0.3, 0.8, 0.3]} />
               <meshStandardMaterial color="#334155" />
            </mesh>
            <mesh position={[-1.1, -1.4, 0]} rotation={[0,0,Math.PI/2]}>
               <cylinderGeometry args={[0.3, 0.3, 0.2]} />
               <meshStandardMaterial color="#000" />
            </mesh>
        </group>
      </group>

      {/* Effects */}
      {skin.id === 'kazada' && <HeartTrail parentPosition={physicsPosition} active={true} />}
    </>
  );
});