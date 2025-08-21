

import React, { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Edges } from "@react-three/drei";

function smoothPhase(t: number, start: number, end: number) {
  const x = Math.min(1, Math.max(0, (t - start) / (end - start)));
  return x * x * (3 - 2 * x);
}

const steps = [
  { label: "Assembled", t: 0.0, tip: "Everything in place." },
  { label: "Remove screws", t: 0.2, tip: "Back panel screws lift out." },
  { label: "Lift back cover", t: 0.55, tip: "Cover slides upward." },
  { label: "Disconnect battery", t: 0.8, tip: "Battery lifts to expose connector." },
  { label: "Remove fan", t: 1.0, tip: "Fan assembly comes out." },
];

function Chassis({ onClick }: { onClick: () => void }) {
  return (
    <mesh onClick={onClick}>
      <boxGeometry args={[6, 0.6, 4]} />
      <meshStandardMaterial color="gray" />
      <Edges scale={1.001} />
    </mesh>
  );
}

function BackCover({ t, onClick }: { t: number; onClick: () => void }) {
  const lift = smoothPhase(t, 0.2, 0.55);
  return (
    <mesh position={[0, 0.35 + lift * 1.9, 0]} onClick={onClick}>
      <boxGeometry args={[6.05, 0.12, 4.05]} />
      <meshStandardMaterial color="lightgray" />
      <Edges scale={1.002} />
    </mesh>
  );
}

function Screws({ t, onClick }: { t: number; onClick: () => void }) {
  const rise = smoothPhase(t, 0.0, 0.2);
  const y = 0.45 + rise * 2.2;
  const pos: [number, number, number][] = [
    [-2.6, y, -1.7],
    [2.6, y, -1.7],
    [-2.6, y, 1.7],
    [2.6, y, 1.7],
  ];
  return (
    <>
      {pos.map((p, i) => (
        <mesh key={i} position={p} onClick={onClick}>
          <cylinderGeometry args={[0.09, 0.09, 0.25, 16]} />
          <meshStandardMaterial color="silver" />
        </mesh>
      ))}
    </>
  );
}

function Battery({ t, onClick }: { t: number; onClick: () => void }) {
  const k = smoothPhase(t, 0.55, 0.8);
  const y = 0.25 + k * 0.8;
  const x = -0.5 - k * 1.2;
  return (
    <mesh position={[x, y, 0]} onClick={onClick}>
      <boxGeometry args={[3.2, 0.18, 2.2]} />
      <meshStandardMaterial color="orange" />
    </mesh>
  );
}

function Fan({ t, onClick }: { t: number; onClick: () => void }) {
  const k = smoothPhase(t, 0.8, 1.0);
  const y = 0.3 + k * 1.6;
  return (
    <mesh position={[1.8, y, 0]} rotation={[Math.PI / 2, 0, 0]} onClick={onClick}>
      <cylinderGeometry args={[0.8, 0.8, 0.18, 48]} />
      <meshStandardMaterial color="lightblue" />
    </mesh>
  );
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]}>
      <planeGeometry args={[30, 30]} />
      <meshStandardMaterial color="white" />
    </mesh>
  );
}

function Scene({ t, onPartClick }: { t: number; onPartClick: () => void }) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 6, 5]} intensity={1.1} />
      <Environment preset="city" />
      <group>
        <Chassis onClick={onPartClick} />
        <BackCover t={t} onClick={onPartClick} />
        <Screws t={t} onClick={onPartClick} />
        <Battery t={t} onClick={onPartClick} />
        <Fan t={t} onClick={onPartClick} />
      </group>
      <Ground />
      <OrbitControls />
    </>
  );
}

export default function App() {
  const [t, setT] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1); // multiplier for speed

  // Space bar to toggle play/pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Auto-play animation
  useEffect(() => {
    if (!isPlaying) return;
    let animationFrame: number;

    const step = () => {
      setT((prev) => {
        const next = prev + 0.002 * speed;
        if (next >= 1) {
          setIsPlaying(false);
          return 1;
        }
        return next;
      });
      animationFrame = requestAnimationFrame(step);
    };

    animationFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrame);
  }, [isPlaying, speed]);

  // Pause on part click
  const handlePartClick = () => {
    setIsPlaying(false);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas camera={{ position: [7, 5, 7], fov: 45 }}>
        <Scene t={t} onPartClick={handlePartClick} />
      </Canvas>

      <div style={{ position: 'absolute', bottom: 20, width: '90%', left: '5%' }}>
        <input
          type="range"
          min={0}
          max={1000}
          value={Math.round(t * 1000)}
          onChange={(e) => setT(parseInt(e.target.value) / 1000)}
          style={{ width: '100%' }}
        />
        <div style={{ textAlign: 'center', marginTop: 5 }}>Step progress: {t.toFixed(2)}</div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10, gap: '10px' }}>
          <label>Speed:</label>
          <input
            type="range"
            min={0.1}
            max={5}
            step={0.1}
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
          />
          <span>{speed.toFixed(1)}x</span>
        </div>

        <div style={{ textAlign: 'center', fontSize: '12px', marginTop: 3 }}>
          Press SPACE to Play / Pause, click on parts to pause
        </div>
      </div>
    </div>
  );
}
