
import React, { useMemo, useRef, useState } from 'react';
import { Sky, TransformControls } from '@react-three/drei';
import { Vector3, Group, Mesh } from 'three';
import { useFrame } from '@react-three/fiber';
import { WorldObject } from '../types';

const Building: React.FC<{ 
    id: string;
    position: [number, number, number]; 
    size: [number, number, number]; 
    color: string; 
    distance: number;
    isEditor: boolean;
    onSelect: (id: string) => void;
    selectedId: string | null;
    rotation?: [number, number, number];
}> = ({ id, position, size, color, distance, isEditor, onSelect, selectedId, rotation = [0,0,0] }) => {
    const isLowDetail = distance > 10000;
    const meshRef = useRef<Mesh>(null);

    return (
        <group position={position} rotation={rotation}>
            <mesh 
                ref={meshRef}
                castShadow 
                receiveShadow
                onClick={(e) => {
                    if (isEditor) {
                        e.stopPropagation();
                        onSelect(id);
                    }
                }}
            >
                <boxGeometry args={size} />
                <meshStandardMaterial 
                    color={selectedId === id ? "#fbbf24" : color} 
                    roughness={0.7} 
                    metalness={0.2} 
                />
            </mesh>
            
            {!isLowDetail && (
                <mesh position={[0, 0, 0]}>
                    <boxGeometry args={[size[0] + 3, size[1] * 0.85, size[2] + 3]} />
                    <meshStandardMaterial color="#bae6fd" transparent opacity={0.3} metalness={1} />
                </mesh>
            )}
        </group>
    );
};

export const World: React.FC<{ 
    planePosition: Vector3; 
    isEditor: boolean; 
    customObjects: WorldObject[];
    onObjectUpdate: (obj: WorldObject) => void;
}> = ({ planePosition, isEditor, customObjects, onObjectUpdate }) => {
  const skyRef = useRef<Group>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const sunPos = useMemo(() => new Vector3(15000, 15000, -15000), []);

  useFrame(() => {
    if (skyRef.current) skyRef.current.position.set(planePosition.x, 0, planePosition.z);
  });

  const baseCity = useMemo(() => {
    const data = [];
    const colors = ["#ffffff", "#f1f5f9", "#cbd5e1", "#f8fafc"];
    for (let i = 0; i < 150; i++) {
        data.push({
            id: `base-${i}`,
            pos: [(Math.random() - 0.5) * 30000, 0, -15000 - Math.random() * 40000] as [number, number, number],
            size: [600 + Math.random() * 500, 1500 + Math.random() * 6000, 600 + Math.random() * 500] as [number, number, number],
            color: colors[i % colors.length]
        });
    }
    return data;
  }, []);

  const handleSelect = (id: string) => {
      if (isEditor) setSelectedId(id);
  };

  return (
    <>
      <Sky sunPosition={[sunPos.x, sunPos.y, sunPos.z]} turbidity={0.02} rayleigh={0.1} />
      <fog attach="fog" args={['#e0f2fe', 5000, 70000]} />
      <directionalLight position={[sunPos.x, sunPos.y, sunPos.z]} intensity={2.5} castShadow />
      <ambientLight intensity={1.5} />
      <hemisphereLight args={['#ffffff', '#0ea5e9', 0.5]} />

      {/* Render Base City */}
      <group>
        {baseCity.map((b) => (
            <Building 
                key={b.id} id={b.id} 
                position={[b.pos[0], b.size[1]/2, b.pos[2]]} 
                size={b.size} color={b.color} 
                distance={planePosition.distanceTo(new Vector3(b.pos[0], b.size[1]/2, b.pos[2]))}
                isEditor={isEditor} onSelect={handleSelect} selectedId={selectedId}
            />
        ))}
      </group>

      {/* Render Custom/Edited Objects */}
      <group>
          {customObjects.map((obj) => (
              <Building 
                key={obj.id} id={obj.id}
                position={obj.position}
                size={obj.scale}
                rotation={obj.rotation}
                color="#ffffff"
                distance={planePosition.distanceTo(new Vector3(obj.position[0], obj.position[1], obj.position[2]))}
                isEditor={isEditor} onSelect={handleSelect} selectedId={selectedId}
              />
          ))}
      </group>

      {/* Editor Axis Gizmo */}
      {isEditor && selectedId && (
          <TransformControls 
            object={undefined} // Needs to be wired to the selected mesh
            mode="translate"
            onMouseUp={() => {
                // Here logic to save the new transform back to the state
            }}
          />
      )}

      {/* Airport Area */}
      <group position={[0, -0.5, 5000]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[30000, 40000]} />
            <meshStandardMaterial color="#94a3b8" />
        </mesh>
        <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1000, 20000]} />
            <meshStandardMaterial color="#1e293b" />
        </mesh>
      </group>

      {/* Real-time Ocean */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[planePosition.x, -40, planePosition.z]}>
        <planeGeometry args={[250000, 250000]} />
        <meshStandardMaterial color="#0c4a6e" metalness={0.9} roughness={0.1} />
      </mesh>
    </>
  );
};
