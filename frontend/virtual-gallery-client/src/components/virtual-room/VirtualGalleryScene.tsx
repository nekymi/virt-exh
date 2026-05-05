import { Canvas, type ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { VirtualRoomArtwork } from "../../types/virtualRoom";

interface VirtualGallerySceneProps {
  artworks: VirtualRoomArtwork[];
  cameraResetKey?: number;
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

interface PaintingSize {
  width: number;
  height: number;
}

interface FocusTarget {
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
  key: number;
}

interface CameraSnapshot {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
}

const ROOM_WIDTH = 30;
const ROOM_DEPTH = 22;
const ROOM_HEIGHT = 7;

const MAX_PER_WALL = 8;

const MAX_PAINTING_WIDTH = 2.75;
const MAX_PAINTING_HEIGHT = 2.05;
const MIN_PAINTING_WIDTH = 1.15;
const MIN_PAINTING_HEIGHT = 1.15;

const CAMERA_EYE_HEIGHT = 2.15;
const PAINTING_CENTER_Y = 2.65;

const FRAME_BORDER = 0.16;
const FRAME_DEPTH = 0.16;
const PASSEPARTOUT_BORDER = 0.08;

const API_ORIGIN = "http://localhost:5215";

function normalizeImageUrl(imageUrl: string): string {
  if (!imageUrl) {
    return "";
  }

  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  if (imageUrl.startsWith("/")) {
    return `${API_ORIGIN}${imageUrl}`;
  }

  return `${API_ORIGIN}/${imageUrl}`;
}

function calculatePaintingSize(imageWidth: number, imageHeight: number): PaintingSize {
  if (!imageWidth || !imageHeight) {
    return {
      width: 2.2,
      height: 1.55,
    };
  }

  const aspectRatio = imageWidth / imageHeight;

  let width = MAX_PAINTING_WIDTH;
  let height = width / aspectRatio;

  if (height > MAX_PAINTING_HEIGHT) {
    height = MAX_PAINTING_HEIGHT;
    width = height * aspectRatio;
  }

  width = THREE.MathUtils.clamp(width, MIN_PAINTING_WIDTH, MAX_PAINTING_WIDTH);
  height = THREE.MathUtils.clamp(height, MIN_PAINTING_HEIGHT, MAX_PAINTING_HEIGHT);

  return {
    width,
    height,
  };
}

function getFocusTargetForArtwork(artwork: PositionedArtwork): FocusTarget {
  const distanceFromPainting = 4.05;

  const lookAt = new THREE.Vector3(artwork.x, artwork.y, artwork.z);
  const position = new THREE.Vector3(artwork.x, CAMERA_EYE_HEIGHT, artwork.z);

  if (artwork.wall === "north") {
    position.z = artwork.z + distanceFromPainting;
  }

  if (artwork.wall === "south") {
    position.z = artwork.z - distanceFromPainting;
  }

  if (artwork.wall === "east") {
    position.x = artwork.x - distanceFromPainting;
  }

  if (artwork.wall === "west") {
    position.x = artwork.x + distanceFromPainting;
  }

  return {
    position,
    lookAt,
    key: Date.now(),
  };
}

function createTextTexture(lines: string[]): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  const width = 1024;
  const height = 320;

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    return new THREE.CanvasTexture(canvas);
  }

  context.clearRect(0, 0, width, height);

  context.fillStyle = "#f3ead8";
  context.fillRect(0, 0, width, height);

  context.strokeStyle = "#b9a98f";
  context.lineWidth = 18;
  context.strokeRect(9, 9, width - 18, height - 18);

  context.fillStyle = "#2a2118";
  context.font = "bold 58px Arial, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";

  const title = lines[0] || "Без названия";
  const author = lines[1] || "Автор не указан";
  const year = lines[2] || "";

  context.fillText(title.slice(0, 32), width / 2, 105);

  context.fillStyle = "#5a4e42";
  context.font = "42px Arial, sans-serif";
  context.fillText(author.slice(0, 34), width / 2, 178);

  if (year) {
    context.fillStyle = "#7a6b58";
    context.font = "36px Arial, sans-serif";
    context.fillText(year, width / 2, 238);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;

  return texture;
}

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

function CameraController({
  focusTarget,
  resetKey = 0,
}: {
  focusTarget: FocusTarget | null;
  resetKey?: number;
}) {
  const { camera } = useThree();
  const keysRef = useKeyboardMovement();

  const direction = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());

  const activeFocus = useRef<FocusTarget | null>(null);
  const previousCameraState = useRef<CameraSnapshot | null>(null);
  const returnTarget = useRef<CameraSnapshot | null>(null);

  useEffect(() => {
    camera.position.set(0, CAMERA_EYE_HEIGHT, 8.5);
    camera.lookAt(0, CAMERA_EYE_HEIGHT, 0);
  }, [camera]);

  useEffect(() => {
    if (!focusTarget) {
      return;
    }

    previousCameraState.current = {
      position: camera.position.clone(),
      quaternion: camera.quaternion.clone(),
    };

    returnTarget.current = null;
    activeFocus.current = focusTarget;
  }, [camera, focusTarget]);

  useEffect(() => {
    if (!previousCameraState.current) {
      return;
    }

    activeFocus.current = null;
    returnTarget.current = {
      position: previousCameraState.current.position.clone(),
      quaternion: previousCameraState.current.quaternion.clone(),
    };
  }, [resetKey]);

  useFrame((_, delta) => {
    if (returnTarget.current) {
      const target = returnTarget.current;

      camera.position.lerp(target.position, 1 - Math.pow(0.0008, delta));
      camera.quaternion.slerp(target.quaternion, 1 - Math.pow(0.0008, delta));

      if (
        camera.position.distanceTo(target.position) < 0.05 &&
        camera.quaternion.angleTo(target.quaternion) < 0.01
      ) {
        camera.position.copy(target.position);
        camera.quaternion.copy(target.quaternion);
        returnTarget.current = null;
      }

      return;
    }

    if (activeFocus.current) {
      const target = activeFocus.current;

      camera.position.lerp(target.position, 1 - Math.pow(0.001, delta));
      camera.lookAt(target.lookAt);

      if (camera.position.distanceTo(target.position) < 0.08) {
        activeFocus.current = null;
      }

      return;
    }

    const speed = 5.2;
    const rotationSpeed = 1.75;

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
      moveVector.sub(right.current);
    }

    if (rightPressed) {
      moveVector.add(right.current);
    }

    if (moveVector.lengthSq() > 0) {
      moveVector.normalize().multiplyScalar(speed * delta);
      camera.position.add(moveVector);
    }

    const xLimit = ROOM_WIDTH / 2 - 1.6;
    const zLimit = ROOM_DEPTH / 2 - 1.6;

    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -xLimit, xLimit);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -zLimit, zLimit);
    camera.position.y = CAMERA_EYE_HEIGHT;
  });

  return null;
}

function RoomShell() {
  return (
    <>
      <color attach="background" args={["#11121a"]} />

      <ambientLight intensity={0.58} />

      <directionalLight
        position={[0, 7.5, 5]}
        intensity={0.75}
        castShadow
      />

      <pointLight position={[-7, 4.8, -5]} intensity={0.62} distance={18} />
      <pointLight position={[7, 4.8, -5]} intensity={0.62} distance={18} />
      <pointLight position={[0, 4.8, 7]} intensity={0.48} distance={18} />

      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
        <meshStandardMaterial color="#aaa69a" roughness={0.84} metalness={0.02} />
      </mesh>

      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROOM_WIDTH - 1.2, ROOM_DEPTH - 1.2]} />
        <meshStandardMaterial color="#c7c2b6" roughness={0.92} />
      </mesh>

      <mesh position={[0, ROOM_HEIGHT, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
        <meshStandardMaterial
          color="#dfdad0"
          side={THREE.DoubleSide}
          roughness={0.95}
        />
      </mesh>

      <mesh position={[0, ROOM_HEIGHT - 0.04, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROOM_WIDTH - 2, ROOM_DEPTH - 2]} />
        <meshStandardMaterial
          color="#eee8dc"
          side={THREE.DoubleSide}
          roughness={0.95}
        />
      </mesh>

      <mesh position={[0, ROOM_HEIGHT / 2, -ROOM_DEPTH / 2]}>
        <boxGeometry args={[ROOM_WIDTH, ROOM_HEIGHT, 0.2]} />
        <meshStandardMaterial color="#d7d3cb" roughness={0.88} />
      </mesh>

      <mesh position={[0, ROOM_HEIGHT / 2, ROOM_DEPTH / 2]}>
        <boxGeometry args={[ROOM_WIDTH, ROOM_HEIGHT, 0.2]} />
        <meshStandardMaterial color="#ccc8c0" roughness={0.88} />
      </mesh>

      <mesh position={[-ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0]}>
        <boxGeometry args={[0.2, ROOM_HEIGHT, ROOM_DEPTH]} />
        <meshStandardMaterial color="#c0bcb5" roughness={0.9} />
      </mesh>

      <mesh position={[ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0]}>
        <boxGeometry args={[0.2, ROOM_HEIGHT, ROOM_DEPTH]} />
        <meshStandardMaterial color="#c0bcb5" roughness={0.9} />
      </mesh>

      <Baseboards />
      <CeilingLamps />
      <WallAccents />
    </>
  );
}

function WallAccents() {
  return (
    <>
      <mesh position={[0, 3.7, -ROOM_DEPTH / 2 + 0.13]}>
        <boxGeometry args={[ROOM_WIDTH - 1.8, 0.035, 0.045]} />
        <meshStandardMaterial color="#b9b2a6" roughness={0.8} />
      </mesh>

      <mesh position={[0, 3.7, ROOM_DEPTH / 2 - 0.13]}>
        <boxGeometry args={[ROOM_WIDTH - 1.8, 0.035, 0.045]} />
        <meshStandardMaterial color="#b2aca1" roughness={0.8} />
      </mesh>

      <mesh position={[-ROOM_WIDTH / 2 + 0.13, 3.7, 0]}>
        <boxGeometry args={[0.045, 0.035, ROOM_DEPTH - 1.8]} />
        <meshStandardMaterial color="#aaa398" roughness={0.8} />
      </mesh>

      <mesh position={[ROOM_WIDTH / 2 - 0.13, 3.7, 0]}>
        <boxGeometry args={[0.045, 0.035, ROOM_DEPTH - 1.8]} />
        <meshStandardMaterial color="#aaa398" roughness={0.8} />
      </mesh>
    </>
  );
}

function Baseboards() {
  const baseboardColor = "#5f554a";

  return (
    <>
      <mesh position={[0, 0.28, -ROOM_DEPTH / 2 + 0.14]}>
        <boxGeometry args={[ROOM_WIDTH, 0.28, 0.16]} />
        <meshStandardMaterial color={baseboardColor} roughness={0.72} />
      </mesh>

      <mesh position={[0, 0.28, ROOM_DEPTH / 2 - 0.14]}>
        <boxGeometry args={[ROOM_WIDTH, 0.28, 0.16]} />
        <meshStandardMaterial color={baseboardColor} roughness={0.72} />
      </mesh>

      <mesh position={[-ROOM_WIDTH / 2 + 0.14, 0.28, 0]}>
        <boxGeometry args={[0.16, 0.28, ROOM_DEPTH]} />
        <meshStandardMaterial color={baseboardColor} roughness={0.72} />
      </mesh>

      <mesh position={[ROOM_WIDTH / 2 - 0.14, 0.28, 0]}>
        <boxGeometry args={[0.16, 0.28, ROOM_DEPTH]} />
        <meshStandardMaterial color={baseboardColor} roughness={0.72} />
      </mesh>
    </>
  );
}

function CeilingLamps() {
  return (
    <>
      <Lamp position={[-6, ROOM_HEIGHT - 0.18, -4]} />
      <Lamp position={[6, ROOM_HEIGHT - 0.18, -4]} />
      <Lamp position={[0, ROOM_HEIGHT - 0.18, 5]} />
    </>
  );
}

function Lamp({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[0.65, 0.65, 0.08, 32]} />
        <meshStandardMaterial
          color="#f8f1dd"
          emissive="#f4db9a"
          emissiveIntensity={0.26}
        />
      </mesh>

      <pointLight position={[0, -0.25, 0]} intensity={0.34} distance={8} />
    </group>
  );
}

function PaintingLabel({
  artwork,
  frameWidth,
  frameHeight,
}: {
  artwork: PositionedArtwork;
  frameWidth: number;
  frameHeight: number;
}) {
  const texture = useMemo(() => {
    return createTextTexture([
      artwork.title,
      artwork.authorName,
      artwork.year ? String(artwork.year) : "",
    ]);
  }, [artwork.title, artwork.authorName, artwork.year]);

  useEffect(() => {
    return () => {
      texture.dispose();
    };
  }, [texture]);

  const labelWidth = Math.min(Math.max(frameWidth * 0.9, 1.65), 2.75);
  const labelHeight = 0.44;

  return (
    <mesh position={[0, -frameHeight / 2 - 0.43, 0.2]} renderOrder={30}>
      <planeGeometry args={[labelWidth, labelHeight]} />
      <meshBasicMaterial
        map={texture}
        transparent={false}
        toneMapped={false}
        side={THREE.DoubleSide}
        polygonOffset
        polygonOffsetFactor={-12}
        polygonOffsetUnits={-12}
      />
    </mesh>
  );
}

function PaintingImage({
  imageUrl,
  hovered,
  onSizeReady,
}: {
  imageUrl: string;
  hovered: boolean;
  onSizeReady: (size: PaintingSize) => void;
}) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [failed, setFailed] = useState(false);
  const [size, setSize] = useState<PaintingSize>({
    width: 2.2,
    height: 1.55,
  });

  const finalImageUrl = useMemo(() => normalizeImageUrl(imageUrl), [imageUrl]);

  useEffect(() => {
    let disposed = false;
    let currentTexture: THREE.Texture | null = null;

    setTexture(null);
    setFailed(false);

    if (!finalImageUrl) {
      const fallbackSize = {
        width: 2.2,
        height: 1.55,
      };

      setSize(fallbackSize);
      onSizeReady(fallbackSize);
      setFailed(true);
      return;
    }

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");

    loader.load(
      finalImageUrl,
      (loadedTexture) => {
        if (disposed) {
          loadedTexture.dispose();
          return;
        }

        const image = loadedTexture.image as HTMLImageElement | ImageBitmap | undefined;

        const imageWidth = image && "width" in image ? image.width : 1200;
        const imageHeight = image && "height" in image ? image.height : 800;

        const calculatedSize = calculatePaintingSize(imageWidth, imageHeight);

        loadedTexture.colorSpace = THREE.SRGBColorSpace;
        loadedTexture.anisotropy = 8;
        loadedTexture.needsUpdate = true;

        currentTexture = loadedTexture;

        setSize(calculatedSize);
        onSizeReady(calculatedSize);
        setTexture(loadedTexture);
        setFailed(false);
      },
      undefined,
      (error) => {
        console.error("Не удалось загрузить картинку в 3D-зал:", finalImageUrl, error);

        if (!disposed) {
          const fallbackSize = {
            width: 2.2,
            height: 1.55,
          };

          setSize(fallbackSize);
          onSizeReady(fallbackSize);
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
  }, [finalImageUrl, onSizeReady]);

  if (texture && !failed) {
    return (
      <mesh position={[0, 0, 0.205]} renderOrder={20}>
        <planeGeometry args={[size.width, size.height]} />
        <meshBasicMaterial
          map={texture}
          side={THREE.DoubleSide}
          toneMapped={false}
          depthTest
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={-10}
          polygonOffsetUnits={-10}
        />
      </mesh>
    );
  }

  return (
    <mesh position={[0, 0, 0.205]} renderOrder={20}>
      <planeGeometry args={[size.width, size.height]} />
      <meshBasicMaterial
        color={hovered ? "#f5e6b8" : "#d8cfb8"}
        side={THREE.DoubleSide}
        depthTest
        depthWrite={false}
      />
    </mesh>
  );
}

function PaintingFrame({
  artwork,
  onSelect,
  onHover,
}: {
  artwork: PositionedArtwork;
  onSelect: (artwork: PositionedArtwork) => void;
  onHover?: (artwork: VirtualRoomArtwork | null) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [paintingSize, setPaintingSize] = useState<PaintingSize>({
    width: 2.2,
    height: 1.55,
  });

  const frameWidth = paintingSize.width + FRAME_BORDER * 2;
  const frameHeight = paintingSize.height + FRAME_BORDER * 2;

  const passepartoutWidth = paintingSize.width + PASSEPARTOUT_BORDER * 2;
  const passepartoutHeight = paintingSize.height + PASSEPARTOUT_BORDER * 2;

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
      <mesh position={[0, 0, 0.035]} renderOrder={5}>
        <planeGeometry args={[frameWidth + 0.3, frameHeight + 0.3]} />
        <meshBasicMaterial
          color="#a88cff"
          transparent
          opacity={hovered ? 0.2 : 0}
          side={THREE.DoubleSide}
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={6}
          polygonOffsetUnits={6}
        />
      </mesh>

      {hovered && (
        <pointLight
          position={[0, 0, 0.85]}
          intensity={0.72}
          distance={4.4}
          color="#b69bff"
        />
      )}

      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[frameWidth, frameHeight, FRAME_DEPTH]} />
        <meshStandardMaterial
          color={hovered ? "#7a5125" : "#352417"}
          roughness={0.46}
          metalness={0.05}
          emissive={hovered ? "#1c0f05" : "#000000"}
          emissiveIntensity={hovered ? 0.18 : 0}
        />
      </mesh>

      <mesh position={[0, 0, 0.095]}>
        <boxGeometry args={[passepartoutWidth, passepartoutHeight, 0.08]} />
        <meshStandardMaterial color="#efe6d4" roughness={0.82} />
      </mesh>

      <PaintingImage
        imageUrl={artwork.imageUrl}
        hovered={hovered}
        onSizeReady={setPaintingSize}
      />

      <PaintingLabel
        artwork={artwork}
        frameWidth={frameWidth}
        frameHeight={frameHeight}
      />
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
      const z = wall === "north" ? -ROOM_DEPTH / 2 + 0.24 : ROOM_DEPTH / 2 - 0.24;
      const rotationY = wall === "north" ? 0 : Math.PI;

      result.push({
        ...artwork,
        wall,
        x,
        y: PAINTING_CENTER_Y,
        z,
        rotationY,
      });

      return;
    }

    const spacing = ROOM_DEPTH / (MAX_PER_WALL + 1);
    const z = -ROOM_DEPTH / 2 + spacing * (indexOnWall + 1);
    const x = wall === "east" ? ROOM_WIDTH / 2 - 0.24 : -ROOM_WIDTH / 2 + 0.24;
    const rotationY = wall === "east" ? -Math.PI / 2 : Math.PI / 2;

    result.push({
      ...artwork,
      wall,
      x,
      y: PAINTING_CENTER_Y,
      z,
      rotationY,
    });
  });

  return result;
}

function SceneContent({
  artworks,
  cameraResetKey,
  onArtworkSelect,
  onArtworkHover,
}: VirtualGallerySceneProps) {
  const [focusTarget, setFocusTarget] = useState<FocusTarget | null>(null);

  const positionedArtworks = useMemo(
    () => createPaintingLayout(artworks),
    [artworks]
  );

  const handlePaintingSelect = useCallback(
    (artwork: PositionedArtwork) => {
      const target = getFocusTargetForArtwork(artwork);
      setFocusTarget(target);

      window.setTimeout(() => {
        onArtworkSelect(artwork);
      }, 650);
    },
    [onArtworkSelect]
  );

  useEffect(() => {
    return () => {
      document.body.style.cursor = "default";
    };
  }, []);

  return (
    <>
      <RoomShell />
      <CameraController focusTarget={focusTarget} resetKey={cameraResetKey} />

      {positionedArtworks.map((artwork) => (
        <PaintingFrame
          key={artwork.id}
          artwork={artwork}
          onSelect={handlePaintingSelect}
          onHover={onArtworkHover}
        />
      ))}
    </>
  );
}

export function VirtualGalleryScene({
  artworks,
  cameraResetKey,
  onArtworkSelect,
  onArtworkHover,
}: VirtualGallerySceneProps) {
  return (
    <div className="virtual-room-canvas-wrap">
      <Canvas
        shadows
        camera={{
          fov: 62,
          near: 0.1,
          far: 100,
          position: [0, CAMERA_EYE_HEIGHT, 8.5],
        }}
        gl={{
          antialias: true,
          alpha: false,
        }}
        style={{
          width: "100%",
          height: "100%",
          minHeight: "560px",
          background: "#11121a",
        }}
      >
        <SceneContent
          artworks={artworks}
          cameraResetKey={cameraResetKey}
          onArtworkSelect={onArtworkSelect}
          onArtworkHover={onArtworkHover}
        />
      </Canvas>
    </div>
  );
}