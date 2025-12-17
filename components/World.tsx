
import React, { useMemo, useRef } from 'react';
import { Sky, Stars, Cloud } from '@react-three/drei';
import { Vector3 } from 'three';
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
    useFrame(() => {
        if (rainRef.current && active) {
            rainRef.current.position.y -= 3;
            if (rainRef.current.position.y < -500) rainRef.current.position.y = 500;
        }
    });
    if (!active) return null;
    return (
        <group ref={rainRef}>
            {Array.from({ length: 150 }).map((_, i) => (
                <mesh key={i} position={[(Math.random() - 0.5) * 3000, Math.random() * 1000, (Math.random() - 0.5) * 3000]}>
                    <boxGeometry args={[0.05, 8, 0.05]} />
                    <meshBasicMaterial color="#7dd3fc" transparent opacity={0.3} />
                </mesh>
            ))}
        </group>
    );
};

const Sun: React.FC<{ planePosition: Vector3 }> = ({ planePosition }) => {
    const sunRef = useRef<any>(null);
    const sunPos = new Vector3(5000, 4000, -8000); // Fixed conceptual position in world
    
    useFrame(() => {
        if (sunRef.current) {
            // Keep the sun relatively far but visible
            sunRef.current.position.copy(planePosition).add(new Vector3(10000, 8000, -15000));
        }
    });

    return (
        <group ref={sunRef}>
            <mesh>
                <sphereGeometry args={[800, 32, 32]} />
                <meshBasicMaterial color="#fffbeb" />
            </mesh>
            <pointLight intensity={2000000} distance={100000} color="#ffedd5" />
        </group>
    );
}

export const World: React.FC<{ planePosition: Vector3 }> = ({ planePosition }) => {
  const lightRef = useRef<any>(null);

  // Optimization Thresholds
  const distToCity = planePosition.distanceTo(new Vector3(0, 0, -2500));
  const distToForest = planePosition.distanceTo(new Vector3(5000, 0, -2000));
  const distToDesert = planePosition.distanceTo(new Vector3(-5000, 0, -2000));
  
  const showCity = distToCity < 8000;
  const showForest = distToForest < 8000;
  const showDesert = distToDesert < 8000;

  useFrame(() => {
    if (lightRef.current) {
        // Light follows player at height to maintain shadows and illumination everywhere
        lightRef.current.position.set(planePosition.x + 100, 500, planePosition.z + 100);
        lightRef.current.target.position.set(planePosition.x, 0, planePosition.z);
        lightRef.current.target.updateMatrixWorld();
    }
  });

  const citySector = useMemo(() => {
    if (!showCity) return null;
    const buildings = [];
    for (let row = 0; row < 10; row++) {
        for (let col = -5; col <= 5; col++) {
            const x = col * 200;
            const z = -2000 - row * 200;
            const h = 250 + Math.random() * 700;
            buildings.push(<Building key={`c-${row}-${col}`} position={[x, h/2, z]} size={[100, h, 100]} color="#1e293b" />);
        }
    }
    return buildings;
  }, [showCity]);

  const forestSector = useMemo(() => {
    if (!showForest) return null;
    const trees = [];
    for (let i = 0; i < 300; i++) {
        const x = 5000 + (Math.random() - 0.5) * 2500;
        const z = -2000 + (Math.random() - 0.5) * 2500;
        trees.push(
            <group key={`t-${i}`} position={[x, 0, z]}>
                <mesh position={[0, 20, 0]}>
                    <coneGeometry args={[15, 40, 8]} />
                    <meshStandardMaterial color="#166534" />
                </mesh>
                <mesh position={[0, 8, 0]}>
                    <cylinderGeometry args={[3, 3, 16]} />
                    <meshStandardMaterial color="#422006" />
                </mesh>
            </group>
        );
    }
    return (
        <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[5000, -0.1, -2000]}>
                <planeGeometry args={[4000, 4000]} />
                <meshStandardMaterial color="#14532d" />
            </mesh>
            {trees}
        </group>
    );
  }, [showForest]);

  const desertSector = useMemo(() => {
    if (!showDesert) return null;
    const structures = [];
    for (let i = 0; i < 30; i++) {
        const x = -5000 + (Math.random() - 0.5) * 2500;
        const z = -2000 + (Math.random() - 0.5) * 2500;
        structures.push(
            <mesh key={`d-${i}`} position={[x, 50, z]} rotation={[Math.random(), Math.random(), 0]}>
                <octahedronGeometry args={[60]} />
                <meshStandardMaterial color="#fcd34d" metalness={0.8} roughness={0.2} />
            </mesh>
        );
    }
    return (
        <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-5000, -0.1, -2000]}>
                <planeGeometry args={[4000, 4000]} />
                <meshStandardMaterial color="#78350f" />
            </mesh>
            {structures}
        </group>
    );
  }, [showDesert]);

  return (
    <>
      <Sky sunPosition={[500, 400, -1000]} turbidity={0.05} rayleigh={0.2} />
      <Stars radius={5000} depth={100} count={10000} factor={6} saturation={0} />
      <fog attach="fog" args={showForest ? ['#14532d', 1000, 20000] : ['#0ea5e9', 1000, 30000]} />
      
      <Sun planePosition={planePosition} />
      
      <ambientLight intensity={0.4} />
      <directionalLight 
        ref={lightRef}
        intensity={1.8} 
        castShadow 
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-2000}
        shadow-camera-right={2000}
        shadow-camera-top={2000}
        shadow-camera-bottom={-2000}
        shadow-camera-far={2000}
      />

      <WeatherSystem active={showForest} />

      {/* Optimized Home Base */}
      <group position={[0, -0.1, 400]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[2000, 2500]} />
            <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[120, 1500]} />
            <meshStandardMaterial color="#0f172a" />
        </mesh>
        {Array.from({ length: 15 }).map((_, i) => (
            <group key={i} position={[0, 0.1, -650 + i * 100]}>
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[10, 50]} />
                    <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.8} />
                </mesh>
            </group>
        ))}
      </group>

      <group>{citySector}</group>
      <group>{forestSector}</group>
      <group>{desertSector}</group>

      {/* Infinite Ocean Plane - Follows player roughly to avoid gaps */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[planePosition.x, -5, planePosition.z]}>
        <planeGeometry args={[100000, 100000]} />
        <meshStandardMaterial color="#0284c7" metalness={0.9} roughness={0.1} />
      </mesh>
    </>
  );
};
