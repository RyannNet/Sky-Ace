
import React, { useMemo } from 'react';
import { Sky, Stars, Cloud } from '@react-three/drei';
import { MapObject } from '../types';

interface WorldProps {
    mapObjects: MapObject[];
    isEditorMode: boolean;
    onPlaceObject: (pos: any, type: any) => void;
    onRemoveObject: (id: string) => void;
}

export const World: React.FC<WorldProps> = ({ mapObjects }) => {
  // Generate Big City objects dynamically for performance and scale
  const cityObjects = useMemo(() => {
    const buildings: React.ReactNode[] = [];
    for (let i = 0; i < 50; i++) {
        const x = (Math.random() - 0.5) * 800;
        const z = -2000 - Math.random() * 1500;
        const h = 100 + Math.random() * 400;
        const w = 40 + Math.random() * 60;
        buildings.push(
            <mesh key={`city-${i}`} position={[x, h/2, z]} castShadow receiveShadow>
                <boxGeometry args={[w, h, w]} />
                <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.8} />
                {/* Windows effect */}
                <mesh position={[0,0,0]}>
                    <boxGeometry args={[w + 0.5, h - 10, w + 0.5]} />
                    <meshStandardMaterial color="#1e293b" wireframe opacity={0.1} transparent />
                </mesh>
            </mesh>
        );
    }
    return buildings;
  }, []);

  return (
    <>
      <Sky sunPosition={[100, 20, 100]} turbidity={0.1} rayleigh={0.5} />
      <Stars radius={300} depth={50} count={5000} factor={4} />
      <fog attach="fog" args={['#0ea5e9', 0, 4000]} />
      
      <ambientLight intensity={0.5} />
      <directionalLight position={[50, 100, 50]} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]} />

      {/* Starting Airport Base (Island/Platform) */}
      <group position={[0, -0.1, 400]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[1000, 1200]} />
            <meshStandardMaterial color="#1e293b" />
        </mesh>
        
        {/* Runway */}
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[80, 1000]} />
            <meshStandardMaterial color="#0f172a" />
        </mesh>

        {/* Runway Markings */}
        {Array.from({ length: 20 }).map((_, i) => (
            <mesh key={i} position={[0, 0.1, -450 + i * 50]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[4, 25]} />
                <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} />
            </mesh>
        ))}

        {/* Airport Structures */}
        {/* Control Tower */}
        <group position={[150, 0, -200]}>
            <mesh position={[0, 60, 0]} castShadow>
                <cylinderGeometry args={[10, 15, 120, 8]} />
                <meshStandardMaterial color="#334155" />
            </mesh>
            <mesh position={[0, 120, 0]} castShadow>
                <boxGeometry args={[40, 30, 40]} />
                <meshStandardMaterial color="#bae6fd" transparent opacity={0.7} />
            </mesh>
        </group>

        {/* Hangars */}
        {[-1, 1].map(side => (
            <group key={side} position={[250 * side, 0, 100]}>
                {Array.from({length: 3}).map((_, i) => (
                    <mesh key={i} position={[0, 25, i * 120]} castShadow>
                        <boxGeometry args={[150, 50, 100]} />
                        <meshStandardMaterial color="#475569" />
                    </mesh>
                ))}
            </group>
        ))}
      </group>

      {/* THE OCEAN (Hazard) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, -2000]}>
        <planeGeometry args={[10000, 10000]} />
        <meshStandardMaterial color="#0284c7" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* THE BIG CITY (Target 2km away) */}
      <group>
          {cityObjects}
          {/* Central Mega Skyscraper */}
          <mesh position={[0, 400, -2500]} castShadow>
              <boxGeometry args={[120, 800, 120]} />
              <meshStandardMaterial color="#020617" metalness={1} roughness={0} />
          </mesh>
      </group>

      {/* Distant Clouds for scale */}
      <Cloud position={[-500, 300, -1000]} opacity={0.5} speed={0.2} />
      <Cloud position={[500, 400, -2000]} opacity={0.5} speed={0.2} />
    </>
  );
};
