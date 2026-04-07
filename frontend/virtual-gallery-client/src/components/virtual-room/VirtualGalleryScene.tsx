import { Canvas, type ThreeEvent, useFrame, useLoader, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { VirtualRoomArtwork } from "../../types/virtualRoom";

interface VirtualGallerySceneProps {
  artworks: VirtualRoomArtwork[];
  onArtworkSelect: (artwork: VirtualRoomArtwork) => void;
  onArtworkHover?: (artwork: VirtualRoomArtwork | null) => void;
}

type WallType = "north" | "south" | "east" | "west";

interface PositionedArtwork extends VirtualRoomArtwork {
  wall: WallType;
  x: number;
  y: number;
  z: number;
  rotationY: number;
}

const ROOM_WIDTH = 28;
const ROOM_DEPTH = 20;
const ROOM_HEIGHT = 8;
const MAX_PER_WALL = 8;
const PAINTING_WIDTH = 2.4;
const PAINTING_HEIGHT = 1.8;

function useKeyboardMovement() {
  const keysRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      keysRef.current[event.code] = true;
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      keysRef.current[event.code] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return keysRef;
}

function CameraController() {
  const { camera } = useThree();
  const keysRef = useKeyboardMovement();
  const direction = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());

  useEffect(() => {
    camera.position.set(0, 2, 9);
    camera.rotation.set(0, 0, 0);
  }, [camera]);

  useFrame((_, delta) => {
    const speed = 5.5;
    const rotationSpeed = 1.8;

    const forwardPressed = keysRef.current["KeyW"];
    const backwardPressed = keysRef.current["KeyS"];
    const leftPressed = keysRef.current["KeyA"];
    const rightPressed = keysRef.current["KeyD"];
    const turnLeftPressed = keysRef.current["ArrowLeft"];
    const turnRightPressed = keysRef.current["ArrowRight"];

    if (turnLeftPressed) {
      camera.rotation.y += rotationSpeed * delta;
    }

    if (turnRightPressed) {
      camera.rotation.y -= rotationSpeed * delta;
    }

    camera.getWorldDirection(direction.current);
    direction.current.y = 0;
    direction.current.normalize();

    right.current.crossVectors(direction.current, new THREE.Vector3(0, 1, 0)).normalize();

    const moveVector = new THREE.Vector3();

    if (forwardPressed) {
      moveVector.add(direction.current);
    }

    if (backwardPressed) {
      moveVector.sub(direction.current);
    }

    if (leftPressed) {
      moveVector.add(right.current);
    }

    if (rightPressed) {
      moveVector.sub(right.current);
    }

    if (moveVector.lengthSq() > 0) {
      moveVector.normalize().multiplyScalar(speed * delta);
      camera.position.add(moveVector);
    }

    const xLimit = ROOM_WIDTH / 2 - 1.5;
    const zLimit = ROOM_DEPTH / 2 - 1.5;

    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -xLimit, xLimit);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -zLimit, zLimit);
    camera.position.y = 2;
  });

  return null;
}

function RoomShell() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
        <meshStandardMaterial color="#a08f7d" roughness={0.95} />
      </mesh>

      <mesh position={[0, ROOM_HEIGHT / 2, -ROOM_DEPTH / 2]} receiveShadow>
        <planeGeometry args={[ROOM_WIDTH, ROOM_HEIGHT]} />
        <meshStandardMaterial color="#e9e2d6" />
      </mesh>

      <mesh position={[0, ROOM_HEIGHT / 2, ROOM_DEPTH / 2]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[ROOM_WIDTH, ROOM_HEIGHT]} />
        <meshStandardMaterial color="#ece6db" />
      </mesh>

      <mesh position={[ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[ROOM_DEPTH, ROOM_HEIGHT]} />
        <meshStandardMaterial color="#ddd3c6" />
      </mesh>

      <mesh position={[-ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[ROOM_DEPTH, ROOM_HEIGHT]} />
        <meshStandardMaterial color="#ddd3c6" />
      </mesh>

      <mesh position={[0, ROOM_HEIGHT, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
        <meshStandardMaterial color="#f7f2ea" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function PaintingFrame({
  artwork,
  onSelect,
  onHover,
}: {
  artwork: PositionedArtwork;
  onSelect: (artwork: VirtualRoomArtwork) => void;
  onHover?: (artwork: VirtualRoomArtwork | null) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const texture = useLoader(THREE.TextureLoader, artwork.imageUrl);

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
  }, [texture]);

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setHovered(true);
    onHover?.(artwork);
    document.body.style.cursor = "pointer";
  };

  const handlePointerOut = () => {
    setHovered(false);
    onHover?.(null);
    document.body.style.cursor = "default";
  };

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onSelect(artwork);
  };

  return (
    <group
      position={[artwork.x, artwork.y, artwork.z]}
      rotation={[0, artwork.rotationY, 0]}
    >
      <mesh
        position={[0, 0, -0.04]}
        castShadow
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <boxGeometry args={[PAINTING_WIDTH + 0.24, PAINTING_HEIGHT + 0.24, 0.16]} />
        <meshStandardMaterial color={hovered ? "#5f4ec9" : "#4f3f34"} metalness={0.1} roughness={0.7} />
      </mesh>

      <mesh
        castShadow
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <planeGeometry args={[PAINTING_WIDTH, PAINTING_HEIGHT]} />
        <meshStandardMaterial map={texture} />
      </mesh>
    </group>
  );
}

function createPaintingLayout(artworks: VirtualRoomArtwork[]): PositionedArtwork[] {
  const walls: WallType[] = ["north", "south", "east", "west"];
  const result: PositionedArtwork[] = [];

  artworks.slice(0, 30).forEach((artwork, index) => {
    const wall = walls[Math.floor(index / MAX_PER_WALL)] ?? "north";
    const indexOnWall = index % MAX_PER_WALL;

    if (wall === "north" || wall === "south") {
      const spacing = ROOM_WIDTH / (MAX_PER_WALL + 1);
      const x = -ROOM_WIDTH / 2 + spacing * (indexOnWall + 1);
      const z = wall === "north" ? -ROOM_DEPTH / 2 + 0.12 : ROOM_DEPTH / 2 - 0.12;
      const rotationY = wall === "north" ? 0 : Math.PI;

      result.push({
        ...artwork,
        wall,
        x,
        y: 4.1,
        z,
        rotationY,
      });

      return;
    }

    const spacing = ROOM_DEPTH / (MAX_PER_WALL + 1);
    const z = -ROOM_DEPTH / 2 + spacing * (indexOnWall + 1);
    const x = wall === "east" ? ROOM_WIDTH / 2 - 0.12 : -ROOM_WIDTH / 2 + 0.12;
    const rotationY = wall === "east" ? -Math.PI / 2 : Math.PI / 2;

    result.push({
      ...artwork,
      wall,
      x,
      y: 4.1,
      z,
      rotationY,
    });
  });

  return result;
}

function SceneContent({
  artworks,
  onArtworkSelect,
  onArtworkHover,
}: VirtualGallerySceneProps) {
  const positionedArtworks = useMemo(() => createPaintingLayout(artworks), [artworks]);

  return (
    <>
      <color attach="background" args={["#d7d1c6"]} />
      <fog attach="fog" args={["#d7d1c6", 18, 42]} />

      <ambientLight intensity={1.2} />
      <directionalLight
        position={[8, 12, 6]}
        intensity={1.6}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[0, 6.5, 0]} intensity={1.4} />

      <CameraController />
      <RoomShell />

      {positionedArtworks.map((artwork) => (
        <PaintingFrame
          key={artwork.id}
          artwork={artwork}
          onSelect={onArtworkSelect}
          onHover={onArtworkHover}
        />
      ))}
    </>
  );
}

export function VirtualGalleryScene({
  artworks,
  onArtworkSelect,
  onArtworkHover,
}: VirtualGallerySceneProps) {
  return (
    <div className="virtual-room-canvas-wrap">
      <Canvas
        shadows
        camera={{ position: [0, 2, 9], fov: 70, near: 0.1, far: 100 }}
      >
        <SceneContent
          artworks={artworks}
          onArtworkSelect={onArtworkSelect}
          onArtworkHover={onArtworkHover}
        />
      </Canvas>
    </div>
  );
}