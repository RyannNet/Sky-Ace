
import React, { useMemo, useRef } from 'react';
import { Sky, Stars, Cloud, Float } from '@react-three/drei';
import { Vector3, Color } from 'three';
import { useFrame } from '@react-three/fiber';

const Building: React.FC<{ position: [number, number, number]; size: [number, number, number]; color: string }> = ({ position, size, color }) => {
    return (
        <group position={position}>
            <mesh castShadow receiveShadow>
                <boxGeometry args={size} />
                <meshStandardMaterial color={color} roughness={0.1} metalness={0.8} />
            </mesh>
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[size[0] + 0.1, size[1] * 0.8, size[2] + 0.1]} />
                <meshStandardMaterial color="#fde047" emissive="#fde047" emissiveIntensity={0.5} transparent opacity={0.1} wireframe />
            </mesh>
        </group>
    );
};

const WeatherSystem: React.FC<{ active: boolean }> = ({ active }) => {
    const rainRef = useRef<any>(null);
    useFrame((state) => {
        if (rainRef.current && active) {
            rainRef.current.position.y -= 2;
            if (rainRef.current.position.y < -500) rainRef.current.position.y = 500;
        }
    });
    if (!active) return null;
    return (
        <group ref={rainRef}>
            {Array.from({ length: 100 }).map((_, i) => (
                <mesh key={i} position={[(Math.random() - 0.5) * 2000, Math.random() * 1000, (Math.random() - 0.5) * 2000]}>
                    <boxGeometry args={[0.05, 5, 0.05]} />
                    <meshBasicMaterial color="#7dd3fc" transparent opacity={0.3} />
                </mesh>
            ))}
        </group>
    );
};

export const World: React.FC<{ planePosition: Vector3 }> = ({ planePosition }) => {
  // Optimization Thresholds
  const distToCity = planePosition.distanceTo(new Vector3(0, 0, -2500));
  const distToForest = planePosition.distanceTo(new Vector3(3000, 0, -2000));
  const distToDesert = planePosition.distanceTo(new Vector3(-3000, 0, -2000));
  
  const showCity = distToCity < 5000;
  const showForest = distToForest < 5000;
  const showDesert = distToDesert < 5000;

  const citySector = useMemo(() => {
    if (!showCity) return null;
    const buildings = [];
    for (let row = 0; row < 8; row++) {
        for (let col = -4; col <= 4; col++) {
            const x = col * 180;
            const z = -2000 - row * 180;
            const h = 200 + Math.random() * 600;
            buildings.push(<Building key={`c-${row}-${col}`} position={[x, h/2, z]} size={[80, h, 80]} color="#1e293b" />);
        }
    }
    return buildings;
  }, [showCity]);

  const forestSector = useMemo(() => {
    if (!showForest) return null;
    const trees = [];
    for (let i = 0; i < 200; i++) {
        const x = 3000 + (Math.random() - 0.5) * 1500;
        const z = -2000 + (Math.random() - 0.5) * 1500;
        trees.push(
            <group key={`t-${i}`} position={[x, 0, z]}>
                <mesh position={[0, 15, 0]}>
                    <coneGeometry args={[10, 30, 8]} />
                    <meshStandardMaterial color="#166534" />
                </mesh>
                <mesh position={[0, 5, 0]}>
                    <cylinderGeometry args={[2, 2, 10]} />
                    <meshStandardMaterial color="#422006" />
                </mesh>
            </group>
        );
    }
    return forestSectorGround(trees);
  }, [showForest]);

  const desertSector = useMemo(() => {
    if (!showDesert) return null;
    const structures = [];
    for (let i = 0; i < 20; i++) {
        const x = -3000 + (Math.random() - 0.5) * 1500;
        const z = -2000 + (Math.random() - 0.5) * 1500;
        structures.push(
            <mesh key={`d-${i}`} position={[x, 50, z]}>
                <octahedronGeometry args={[50]} />
                <meshStandardMaterial color="#fcd34d" metalness={0.8} roughness={0.2} />
            </mesh>
        );
    }
    return desertSectorGround(structures);
  }, [showDesert]);

  return (
    <>
      <Sky sunPosition={[100, 20, 100]} turbidity={0.1} rayleigh={0.5} />
      <Stars radius={300} depth={50} count={5000} factor={4} />
      <fog attach="fog" args={showForest ? ['#14532d', 0, 4000] : ['#0ea5e9', 0, 5000]} />
      
      <ambientLight intensity={0.5} />
      <directionalLight position={[50, 100, 50]} intensity={1.5} castShadow />

      <WeatherSystem active={showForest} />

      {/* Airport Home */}
      <group position={[0, -0.1, 400]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[1200, 1500]} />
            <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[100, 1000]} />
            <meshStandardMaterial color="#0f172a" />
        </mesh>
        {Array.from({ length: 10 }).map((_, i) => (
            <group key={i} position={[0, 0.1, -450 + i * 100]}>
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[6, 40]} />
                    <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} />
                </mesh>
            </group>
        ))}
      </group>

      {/* Optimized Biomes */}
      <group>{citySector}</group>
      <group>{forestSector}</group>
      <group>{desertSector}</group>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, -2000]}>
        <planeGeometry args={[30000, 30000]} />
        <meshStandardMaterial color="#0284c7" metalness={0.9} roughness={0.1} />
      </mesh>
    </>
  );
};

function forestSectorGround(children: any) {
    return (
        <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3000, -0.1, -2000]}>
                <planeGeometry args={[3000, 3000]} />
                <meshStandardMaterial color="#14532d" />
            </mesh>
            {children}
        </group>
    );
}

function desertSectorGround(children: any) {
    return (
        <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-3000, -0.1, -2000]}>
                <planeGeometry args={[3000, 3000]} />
                <meshStandardMaterial color="#78350f" />
            </mesh>
            {children}
        </group>
    );
}
