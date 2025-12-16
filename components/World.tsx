
import React, { useState, useRef } from 'react';
import { Sky, Stars, Ring } from '@react-three/drei';
import { MapObject, MapObjectType } from '../types';
import { Vector3 } from 'three';
import { ThreeEvent } from '@react-three/fiber';

interface WorldProps {
    mapObjects: MapObject[];
    isEditorMode: boolean;
    onPlaceObject: (pos: Vector3, type: MapObjectType) => void;
    onRemoveObject: (id: string) => void;
}

export const World: React.FC<WorldProps> = ({ mapObjects, isEditorMode, onPlaceObject, onRemoveObject }) => {
  const [hoverPos, setHoverPos] = useState<Vector3 | null>(null);
  const [selectedType, setSelectedType] = useState<MapObjectType>('BUILDING_TALL'); // Default editor item

  // Handler for ground clicks (Placement)
  const handleGroundClick = (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (!isEditorMode) return;
      onPlaceObject(e.point, selectedType);
  };

  // Handler for ground hover (Ghost preview)
  const handleGroundMove = (e: ThreeEvent<MouseEvent>) => {
      if (!isEditorMode) {
          if (hoverPos) setHoverPos(null);
          return;
      }
      setHoverPos(e.point);
  };

  // Handler for object clicks (Removal)
  const handleObjectClick = (e: ThreeEvent<MouseEvent>, id: string) => {
      if (!isEditorMode) return;
      e.stopPropagation();
      onRemoveObject(id);
  };

  return (
    <>
      {/* Atmosphere */}
      <Sky sunPosition={[100, 20, 100]} turbidity={0.2} rayleigh={0.5} mieCoefficient={0.005} mieDirectionalG={0.8} />
      <Stars radius={300} depth={50} count={5000} factor={4} saturation={0} fade speed={0.1} />
      <fog attach="fog" args={['#0ea5e9', 100, 900]} />
      
      {/* Lights */}
      <ambientLight intensity={0.7} />
      <directionalLight 
        position={[50, 100, 50]} 
        intensity={1.5} 
        castShadow 
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-200}
        shadow-camera-right={200}
        shadow-camera-top={200}
        shadow-camera-bottom={-200}
      />

      {/* Infinite Ground with Editor Events */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.05, 0]} 
        receiveShadow
        onClick={handleGroundClick}
        onPointerMove={handleGroundMove}
      >
        <planeGeometry args={[10000, 10000]} />
        <meshStandardMaterial color="#3b82f6" />
      </mesh>
      
      <gridHelper args={[10000, 200, 0xffffff, 0xffffff]} position={[0, 0.05, 0]} rotation={[0, 0, 0]} />

      {/* Runway */}
      <group position={[0, 0.06, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[40, 1500]} />
            <meshStandardMaterial color="#1e293b" />
        </mesh>
        {Array.from({ length: 30 }).map((_, i) => (
            <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -700 + i * 50]}>
                <planeGeometry args={[2, 20]} />
                <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
            </mesh>
        ))}
      </group>

      {/* Dynamic Map Objects */}
      {mapObjects.map((obj) => (
            <group key={obj.id} position={obj.position} onClick={(e) => handleObjectClick(e, obj.id)}>
                {obj.type === 'BUILDING_TALL' && (
                    <mesh castShadow receiveShadow position={[0, obj.scale[1]/2, 0]}>
                        <boxGeometry args={obj.scale} />
                        <meshStandardMaterial color={isEditorMode ? "#ef4444" : "#0f172a"} roughness={0.2} />
                        {/* Editor Highlight Outline */}
                        {isEditorMode && <meshStandardMaterial color="#ef4444" wireframe />}
                    </mesh>
                )}
                {obj.type === 'BUILDING_SMALL' && (
                    <mesh castShadow receiveShadow position={[0, obj.scale[1]/2, 0]}>
                        <boxGeometry args={obj.scale} />
                        <meshStandardMaterial color={isEditorMode ? "#ef4444" : "#1e293b"} roughness={0.2} />
                    </mesh>
                )}
                {obj.type === 'PYRAMID' && (
                    <mesh castShadow receiveShadow position={[0, obj.scale[1]/2, 0]}>
                         <coneGeometry args={[obj.scale[0]/2, obj.scale[1], 4]} />
                         <meshStandardMaterial color="#d97706" />
                    </mesh>
                )}
                {obj.type === 'RING' && (
                     <mesh position={[0, 20, 0]} rotation={[0,0,0]}>
                        <torusGeometry args={[10, 1, 16, 100]} />
                        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={2} />
                     </mesh>
                )}
            </group>
      ))}

      {/* Editor Ghost Object (Preview) */}
      {isEditorMode && hoverPos && (
          <mesh position={[hoverPos.x, 2, hoverPos.z]}>
              <boxGeometry args={[4, 4, 4]} />
              <meshBasicMaterial color="#ffffff" wireframe opacity={0.5} transparent />
          </mesh>
      )}
    </>
  );
};
