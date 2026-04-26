import { Canvas, type ThreeEvent, useFrame, useThree } from "@react-three/fiber";
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

    right.current
      .crossVectors(direction.current, new THREE.Vector3(0, 1, 0))
      .normalize();

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
    <>
      <ambientLight intensity={1.2} />
      <directionalLight position={[0, 7, 4]} intensity={1.5} castShadow />
      <pointLight position={[0, 6, 0]} intensity={1.1} />
      <pointLight position={[-8, 5, -5]} intensity={0.7} />
      <pointLight position={[8, 5, 5]} intensity={0.7} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
        <meshStandardMaterial color="#d9d4cb" />
      </mesh>

      <mesh position={[0, ROOM_HEIGHT / 2, -ROOM_DEPTH / 2]} receiveShadow>
        <planeGeometry args={[ROOM_WIDTH, ROOM_HEIGHT]} />
        <meshStandardMaterial color="#f3efe8" />
      </mesh>

      <mesh
        position={[0, ROOM_HEIGHT / 2, ROOM_DEPTH / 2]}
        rotation={[0, Math.PI, 0]}
        receiveShadow
      >
        <planeGeometry args={[ROOM_WIDTH, ROOM_HEIGHT]} />
        <meshStandardMaterial color="#f3efe8" />
      </mesh>

      <mesh
        position={[ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[ROOM_DEPTH, ROOM_HEIGHT]} />
        <meshStandardMaterial color="#f3efe8" />
      </mesh>

      <mesh
        position={[-ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[ROOM_DEPTH, ROOM_HEIGHT]} />
        <meshStandardMaterial color="#f3efe8" />
      </mesh>

      <mesh position={[0, ROOM_HEIGHT, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
        <meshStandardMaterial color="#faf8f3" side={THREE.DoubleSide} />
      </mesh>
    </>
  );
}

function PaintingImage({
  imageUrl,
  hovered,
}: {
  imageUrl: string;
  hovered: boolean;
}) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let disposed = false;
    let currentTexture: THREE.Texture | null = null;

    const loader = new THREE.TextureLoader();

    loader.load(
      imageUrl,
      (loadedTexture) => {
        if (disposed) {
          loadedTexture.dispose();
          return;
        }

        loadedTexture.colorSpace = THREE.SRGBColorSpace;
        currentTexture = loadedTexture;
        setTexture(loadedTexture);
        setFailed(false);
      },
      undefined,
      () => {
        if (!disposed) {
          setTexture(null);
          setFailed(true);
        }
      }
    );

    return () => {
      disposed = true;
      if (currentTexture) {
        currentTexture.dispose();
      }
    };
  }, [imageUrl]);

  if (texture && !failed) {
    return (
      <mesh>
        <planeGeometry args={[PAINTING_WIDTH, PAINTING_HEIGHT]} />
        <meshStandardMaterial map={texture} />
      </mesh>
    );
  }

  return (
    <group>
      <mesh>
        <planeGeometry args={[PAINTING_WIDTH, PAINTING_HEIGHT]} />
        <meshStandardMaterial color={hovered ? "#d8cec1" : "#cfc4b5"} />
      </mesh>

      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[PAINTING_WIDTH * 0.86, PAINTING_HEIGHT * 0.78]} />
        <meshStandardMaterial color={hovered ? "#eee8dd" : "#e7e0d4"} />
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

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setHovered(true);
    onHover?.(artwork);
    document.body.style.cursor = "pointer";
  };

  const handlePointerOut = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
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
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      <mesh position={[0, 0, -0.05]} castShadow>
        <boxGeometry args={[PAINTING_WIDTH + 0.26, PAINTING_HEIGHT + 0.26, 0.14]} />
        <meshStandardMaterial color={hovered ? "#6f5432" : "#5b4428"} />
      </mesh>

      <mesh position={[0, 0, 0.03]} castShadow>
        <boxGeometry args={[PAINTING_WIDTH + 0.08, PAINTING_HEIGHT + 0.08, 0.05]} />
        <meshStandardMaterial color={hovered ? "#eadfca" : "#ddd1bb"} />
      </mesh>

      <PaintingImage imageUrl={artwork.imageUrl} hovered={hovered} />
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

  useEffect(() => {
    return () => {
      document.body.style.cursor = "default";
    };
  }, []);

  return (
    <>
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
    <Canvas
      shadows
      camera={{ fov: 70, near: 0.1, far: 100 }}
      gl={{ antialias: true }}
      style={{ width: "100%", height: "100%" }}
    >
      <color attach="background" args={["#f5f1e8"]} />
      <fog attach="fog" args={["#f5f1e8", 18, 42]} />
      <SceneContent
        artworks={artworks}
        onArtworkSelect={onArtworkSelect}
        onArtworkHover={onArtworkHover}
      />
    </Canvas>
  );
}