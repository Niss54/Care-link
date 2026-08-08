"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { Suspense, useRef, useState } from "react";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Low-poly seagull built from primitive geometry (r3f).
 * Wings flap, body bobs, and the whole bird tilts gently toward the cursor.
 * Kept deliberately simple so it loads instantly and never blocks the page.
 */
function Seagull({ pointer }: { pointer: React.MutableRefObject<{ x: number; y: number }> }) {
  const group = useRef<THREE.Group>(null);
  const leftWing = useRef<THREE.Mesh>(null);
  const rightWing = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const flap = Math.sin(t * 3) * 0.55;
    if (leftWing.current) leftWing.current.rotation.z = 0.25 + flap;
    if (rightWing.current) rightWing.current.rotation.z = -0.25 - flap;
    if (group.current) {
      // gentle bob
      group.current.position.y = Math.sin(t * 1.4) * 0.18;
      // ease toward pointer for a "looking at you" feel
      const targetY = pointer.current.x * 0.5;
      const targetX = pointer.current.y * 0.3;
      group.current.rotation.y += (targetY - group.current.rotation.y) * 0.05;
      group.current.rotation.x += (targetX - group.current.rotation.x) * 0.05;
    }
  });

  const bodyMat = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    roughness: 0.55,
    metalness: 0.05,
  });
  const wingMat = new THREE.MeshStandardMaterial({
    color: "#eef4f3",
    roughness: 0.6,
    metalness: 0.05,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: "#14B8A6",
    roughness: 0.4,
  });
  const beakMat = new THREE.MeshStandardMaterial({ color: "#F59E0B" });

  return (
    <group ref={group} scale={1.1}>
      {/* body */}
      <mesh material={bodyMat} rotation={[0, 0, -0.15]}>
        <capsuleGeometry args={[0.42, 1.1, 6, 12]} />
      </mesh>
      {/* head */}
      <mesh material={bodyMat} position={[0.75, 0.35, 0]}>
        <sphereGeometry args={[0.34, 20, 20]} />
      </mesh>
      {/* beak */}
      <mesh material={beakMat} position={[1.12, 0.32, 0]} rotation={[0, 0, -0.3]}>
        <coneGeometry args={[0.1, 0.34, 12]} />
      </mesh>
      {/* eyes */}
      <mesh position={[0.95, 0.45, 0.2]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#0F1E1B" />
      </mesh>
      <mesh position={[0.95, 0.45, -0.2]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#0F1E1B" />
      </mesh>
      {/* tail accent */}
      <mesh material={accentMat} position={[-0.75, -0.05, 0]} rotation={[0, 0, 0.4]}>
        <coneGeometry args={[0.22, 0.6, 10]} />
      </mesh>
      {/* left wing */}
      <mesh
        ref={leftWing}
        material={wingMat}
        position={[0, 0.1, 0.3]}
        rotation={[0, 0, 0.25]}
      >
        <boxGeometry args={[1.5, 0.08, 0.5]} />
      </mesh>
      {/* right wing */}
      <mesh
        ref={rightWing}
        material={wingMat}
        position={[0, 0.1, -0.3]}
        rotation={[0, 0, -0.25]}
      >
        <boxGeometry args={[1.5, 0.08, 0.5]} />
      </mesh>
    </group>
  );
}

export function SeagullGuide({
  tip,
  className,
  height = 320,
}: {
  tip?: string;
  className?: string;
  height?: number;
}) {
  const pointer = useRef({ x: 0, y: 0 });
  const [show, setShow] = useState(true);

  return (
    <div
      className={className}
      style={{ height }}
      onPointerMove={(e) => {
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
        pointer.current = {
          x: ((e.clientX - r.left) / r.width) * 2 - 1,
          y: ((e.clientY - r.top) / r.height) * 2 - 1,
        };
      }}
    >
      <div className="relative h-full w-full">
        <Canvas
          camera={{ position: [0, 0, 6], fov: 42 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={0.8} />
          <directionalLight position={[4, 6, 4]} intensity={1.1} />
          <directionalLight position={[-4, -2, -4]} intensity={0.3} color="#34D399" />
          <Suspense fallback={null}>
            <Float speed={1.4} rotationIntensity={0.25} floatIntensity={0.6}>
              <Seagull pointer={pointer} />
            </Float>
          </Suspense>
        </Canvas>

        <AnimatePresence>
          {tip && show && (
            <motion.button
              type="button"
              onClick={() => setShow(false)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ delay: 0.6 }}
              className="absolute left-1/2 top-2 -translate-x-1/2 rounded-full glass px-4 py-1.5 text-sm font-medium text-ink-700 shadow-soft"
              aria-label={tip}
            >
              {tip}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
