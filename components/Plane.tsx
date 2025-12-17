
import React, { useRef, useState, forwardRef } from 'react';
import { Vector3, Group, Euler } from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, Text } from '@react-three/drei';
import { Skin } from '../types';

const HeartTrail: React.FC<{ parentPosition: Vector3; active: boolean }> = ({ parentPosition, active }) => {
  const [hearts, setHearts] = useState<{ id: number; pos: Vector3; opacity: number; scale: number }[]>([]);
  const lastSpawnTime = useRef(0);
  const { camera } = useThree();

  useFrame((state) => {
    const now = state.clock.getElapsedTime();
    if (active && now - lastSpawnTime.current > 0.1) {
      setHearts(prev => [
        ...prev, 
        { id: Math.random(), pos: parentPosition.clone().add(new Vector3((Math.random() - 0.5) * 4, 0, (Math.random() - 0.5) * 4)), opacity: 1, scale: 1 }
      ]);
      lastSpawnTime.current = now;
    }
    setHearts(prev => prev.map(h => ({ ...h, pos: h.pos.clone().add(new Vector3(0, 0.1, 0)), opacity: h.opacity - 0.015, scale: h.scale * 0.98 })).filter(h => h.opacity > 0));
  });

  return (
    <group>
      {hearts.map(heart => (
        <group key={heart.id} position={heart.pos}>
            <Text fontSize={2 * heart.scale} fillOpacity={heart.opacity} color="#ff0066" anchorX="center" anchorY="middle" quaternion={camera.quaternion}>❤️</Text>
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
  const fanRefL = useRef<Group>(null);
  const fanRefR = useRef<Group>(null);

  useFrame((state, delta) => {
    if (fanRefL.current) fanRefL.current.rotation.z += delta * 30;
    if (fanRefR.current) fanRefR.current.rotation.z += delta * 30;
  });

  const isGabi = skin.id === 'kazada';
  const isPedro = skin.id === 'pedro';

  return (
    <>
      <group ref={ref}>
        {showNameTag && (
            <Html position={[0, 6, 0]} center zIndexRange={[100, 0]} distanceFactor={30}>
                <div className="flex flex-col items-center">
                    <div className={`relative px-6 py-2 rounded-xl backdrop-blur-md border ${isGabi ? 'bg-pink-900/40 border-pink-500/50' : isPedro ? 'bg-cyan-900/40 border-cyan-400/50' : 'bg-slate-900/60 border-slate-500/50'} shadow-lg`}>
                        <div className={`text-2xl font-black italic ${isGabi ? 'text-pink-300' : isPedro ? 'text-cyan-300' : 'text-white'}`}>{playerName}</div>
                        <div className="text-[10px] text-center uppercase tracking-widest text-slate-400">{isGabi ? 'CAPTAIN' : 'COMMANDER'}</div>
                    </div>
                </div>
            </Html>
        )}

        {/* --- COMMERCIAL JET GEOMETRY --- */}
        
        {/* Fuselage - Main Body */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2.5, 2.5, 12]} />
          <meshStandardMaterial color={skin.primaryColor} />
        </mesh>
        
        {/* Nose Cone */}
        <mesh position={[0, -0.2, -6.5]}>
           <boxGeometry args={[2.0, 1.8, 1.5]} />
           <meshStandardMaterial color={skin.primaryColor} />
        </mesh>

        {/* Cockpit Windows */}
        <mesh position={[0, 0.6, -5.8]}>
          <boxGeometry args={[2.2, 0.6, 0.5]} />
          <meshStandardMaterial color="#1e293b" metalness={1} roughness={0} />
        </mesh>

        {/* Wings - Airliner Style (Swept) */}
        <group position={[0, -0.5, 1]}>
            <mesh rotation={[0, -0.2, 0]} position={[5.5, 0, 0]}>
                <boxGeometry args={[10, 0.2, 3]} />
                <meshStandardMaterial color={skin.secondaryColor} />
            </mesh>
            <mesh rotation={[0, 0.2, 0]} position={[-5.5, 0, 0]}>
                <boxGeometry args={[10, 0.2, 3]} />
                <meshStandardMaterial color={skin.secondaryColor} />
            </mesh>
            
            {/* Navigation Lights */}
            <pointLight position={[10, 0.2, 0]} color="green" intensity={5} distance={10} />
            <pointLight position={[-10, 0.2, 0]} color="red" intensity={5} distance={10} />
        </group>

        {/* Engines (Turbofans) */}
        <group position={[0, -1.2, 0.5]}>
            {/* Left Engine */}
            <group position={[4, 0, 0]}>
                <mesh>
                    <cylinderGeometry args={[0.8, 0.8, 2.5]} rotation={[Math.PI/2, 0, 0]} />
                    <meshStandardMaterial color="#64748b" metalness={0.8} />
                </mesh>
                <group ref={fanRefL} position={[0, 0, -1.3]}>
                    <mesh><boxGeometry args={[1.4, 0.1, 0.05]} /><meshStandardMaterial color="#000" /></mesh>
                    <mesh rotation={[0,0,Math.PI/2]}><boxGeometry args={[1.4, 0.1, 0.05]} /><meshStandardMaterial color="#000" /></mesh>
                </group>
            </group>
            {/* Right Engine */}
            <group position={[-4, 0, 0]}>
                <mesh>
                    <cylinderGeometry args={[0.8, 0.8, 2.5]} rotation={[Math.PI/2, 0, 0]} />
                    <meshStandardMaterial color="#64748b" metalness={0.8} />
                </mesh>
                <group ref={fanRefR} position={[0, 0, -1.3]}>
                    <mesh><boxGeometry args={[1.4, 0.1, 0.05]} /><meshStandardMaterial color="#000" /></mesh>
                    <mesh rotation={[0,0,Math.PI/2]}><boxGeometry args={[1.4, 0.1, 0.05]} /><meshStandardMaterial color="#000" /></mesh>
                </group>
            </group>
        </group>

        {/* Tail System */}
        <group position={[0, 0.5, 5]}>
             {/* Vertical Fin */}
             <mesh position={[0, 1.8, 0.5]}>
                 <boxGeometry args={[0.2, 3.5, 2]} />
                 <meshStandardMaterial color={skin.secondaryColor} />
             </mesh>
             {/* Horizontal Stabilizers */}
             <mesh position={[2, 0, 0.5]}>
                 <boxGeometry args={[3.5, 0.15, 1.5]} />
                 <meshStandardMaterial color={skin.secondaryColor} />
             </mesh>
             <mesh position={[-2, 0, 0.5]}>
                 <boxGeometry args={[3.5, 0.15, 1.5]} />
                 <meshStandardMaterial color={skin.secondaryColor} />
             </mesh>
        </group>

        {/* Landing Gear */}
        <group position={[0, -1.5, -3]}>
            <mesh><boxGeometry args={[0.2, 1, 0.2]} /><meshStandardMaterial color="#334155" /></mesh>
            <mesh position={[0, -0.5, 0]} rotation={[0, 0, Math.PI/2]}><cylinderGeometry args={[0.4, 0.4, 0.3]} /><meshStandardMaterial color="#000" /></mesh>
        </group>
        <group position={[3, -1.5, 2]}>
            <mesh><boxGeometry args={[0.2, 1, 0.2]} /><meshStandardMaterial color="#334155" /></mesh>
            <mesh position={[0, -0.5, 0]} rotation={[0, 0, Math.PI/2]}><cylinderGeometry args={[0.4, 0.4, 0.3]} /><meshStandardMaterial color="#000" /></mesh>
        </group>
        <group position={[-3, -1.5, 2]}>
            <mesh><boxGeometry args={[0.2, 1, 0.2]} /><meshStandardMaterial color="#334155" /></mesh>
            <mesh position={[0, -0.5, 0]} rotation={[0, 0, Math.PI/2]}><cylinderGeometry args={[0.4, 0.4, 0.3]} /><meshStandardMaterial color="#000" /></mesh>
        </group>
      </group>

      {skin.id === 'kazada' && <HeartTrail parentPosition={physicsPosition} active={true} />}
    </>
  );
});
