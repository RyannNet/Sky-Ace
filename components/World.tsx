
import React, { useMemo, useRef } from 'react';
import { Sky, Stars, Cloud } from '@react-three/drei';
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

const PhysicalSun: React.FC<{ planePosition: Vector3 }> = ({ planePosition }) => {
    const sunRef = useRef<any>(null);
    const lightRef = useRef<any>(null);
    
    // Adjusted Sun distance to stay within 15k limit but look far
    const sunRelativePos = new Vector3(8000, 4000, -10000);

    useFrame(() => {
        if (sunRef.current) {
            sunRef.current.position.copy(planePosition).add(sunRelativePos);
        }
        if (lightRef.current) {
            lightRef.current.position.copy(planePosition).add(new Vector3(1000, 1500, 1000));
            lightRef.current.target.position.copy(planePosition);
            lightRef.current.target.updateMatrixWorld();
        }
    });

    return (
        <group>
            <mesh ref={sunRef}>
                <sphereGeometry args={[500, 32, 32]} />
                <meshBasicMaterial color="#fffbeb" />
                <pointLight intensity={1000000} distance={20000} color="#ffedd5" />
            </mesh>
            <directionalLight 
                ref={lightRef}
                intensity={2.2} 
                castShadow 
                shadow-mapSize={[2048, 2048]}
                shadow-camera-left={-2000}
                shadow-camera-right={2000}
                shadow-camera-top={2000}
                shadow-camera-bottom={-2000}
                shadow-camera-far={5000}
            />
        </group>
    );
}

export const World: React.FC<{ planePosition: Vector3 }> = ({ planePosition }) => {
  // Optimization Thresholds
  const distToCity = planePosition.distanceTo(new Vector3(0, 0, -2500));
  const distToForest = planePosition.distanceTo(new Vector3(8000, 0, -2000));
  const distToDesert = planePosition.distanceTo(new Vector3(-8000, 0, -2000));
  
  const showCity = distToCity < 10000;
  const showForest = distToForest < 10000;
  const showDesert = distToDesert < 10000;

  const citySector = useMemo(() => {
    if (!showCity) return null;
    const buildings = [];
    for (let row = 0; row < 10; row++) {
        for (let col = -5; col <= 5; col++) {
            const x = col * 250;
            const z = -2000 - row * 250;
            const h = 300 + Math.random() * 800;
            buildings.push(<Building key={`c-${row}-${col}`} position={[x, h/2, z]} size={[120, h, 120]} color="#1e293b" />);
        }
    }
    return buildings;
  }, [showCity]);

  const forestSector = useMemo(() => {
    if (!showForest) return null;
    const trees = [];
    for (let i = 0; i < 250; i++) {
        const x = 8000 + (Math.random() - 0.5) * 4000;
        const z = -2000 + (Math.random() - 0.5) * 4000;
        trees.push(
            <group key={`t-${i}`} position={[x, 0, z]}>
                <mesh position={[0, 25, 0]}>
                    <coneGeometry args={[20, 50, 8]} />
                    <meshStandardMaterial color="#166534" />
                </mesh>
                <mesh position={[0, 10, 0]}>
                    <cylinderGeometry args={[4, 4, 20]} />
                    <meshStandardMaterial color="#422006" />
                </mesh>
            </group>
        );
    }
    return (
        <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[8000, -0.5, -2000]}>
                <planeGeometry args={[6000, 6000]} />
                <meshStandardMaterial color="#14532d" />
            </mesh>
            {trees}
        </group>
    );
  }, [showForest]);

  const desertSector = useMemo(() => {
    if (!showDesert) return null;
    const structures = [];
    for (let i = 0; i < 25; i++) {
        const x = -8000 + (Math.random() - 0.5) * 4000;
        const z = -2000 + (Math.random() - 0.5) * 4000;
        structures.push(
            <mesh key={`d-${i}`} position={[x, 80, z]} rotation={[Math.random(), Math.random(), 0]}>
                <octahedronGeometry args={[100]} />
                <meshStandardMaterial color="#fcd34d" metalness={0.9} roughness={0.1} />
            </mesh>
        );
    }
    return (
        <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-8000, -0.5, -2000]}>
                <planeGeometry args={[6000, 6000]} />
                <meshStandardMaterial color="#78350f" />
            </mesh>
            {structures}
        </group>
    );
  }, [showDesert]);

  return (
    <>
      <Sky sunPosition={[5000, 4000, -10000]} turbidity={0.01} rayleigh={0.1} />
      <Stars radius={15000} depth={50} count={10000} factor={6} />
      
      {/* Fog matched to 15k far plane */}
      <fog attach="fog" args={['#0ea5e9', 3000, 15000]} />
      
      <PhysicalSun planePosition={planePosition} />
      
      <ambientLight intensity={0.6} />

      <group position={[0, -0.2, 400]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[3000, 4000]} />
            <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[150, 2000]} />
            <meshStandardMaterial color="#0f172a" />
        </mesh>
        {Array.from({ length: 20 }).map((_, i) => (
            <group key={i} position={[0, 0.2, -900 + i * 100]}>
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[12, 60]} />
                    <meshStandardMaterial color="white" emissive="white" emissiveIntensity={1} />
                </mesh>
            </group>
        ))}
      </group>

      <group>{citySector}</group>
      <group>{forestSector}</group>
      <group>{desertSector}</group>

      {/* Persistent Ocean sized for far plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[planePosition.x, -10, planePosition.z]}>
        <planeGeometry args={[40000, 40000]} />
        <meshStandardMaterial color="#0284c7" metalness={1} roughness={0} />
      </mesh>
    </>
  );
};
