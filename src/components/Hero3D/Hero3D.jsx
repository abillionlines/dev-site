import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { CameraControls, Float } from "@react-three/drei";
import { FaGithub, FaImdb, FaInstagram, FaLinkedinIn } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { easing } from "maath";
import { Vector3 } from "three";
import brian1 from "../../assets/brian1.JPEG";
import { RoomModel } from "./RoomModel";

const HERO_MIN_DISTANCE = 3;
const HERO_MAX_DISTANCE = 14;
const HERO_EFFECTIVE_MAX_DISTANCE = HERO_MAX_DISTANCE * 0.75;

function HeroLightRig() {
  const rigRef = useRef(null);

  useFrame((state, delta) => {
    if (!rigRef.current) return;

    easing.dampE(
      rigRef.current.rotation,
      [(state.pointer.y * Math.PI) / 50, (state.pointer.x * Math.PI) / 20, 0],
      0.2,
      delta,
    );
  });

  return (
    <group ref={rigRef}>
      <directionalLight
        position={[5, 5, -8]}
        castShadow
        intensity={6}
        shadow-mapSize={2048}
        shadow-bias={-0.001}
      >
        <orthographicCamera
          attach="shadow-camera"
          args={[-8.5, 8.5, 8.5, -8.5, 0.1, 20]}
        />
      </directionalLight>
    </group>
  );
}

function FloatingSphere({
  color = "hotpink",
  floatIntensity = 15,
  position = [0, 5, -8],
  scale = 1,
}) {
  return (
    <Float floatIntensity={floatIntensity}>
      <mesh castShadow position={position} scale={scale}>
        <sphereGeometry />
        <meshStandardMaterial color={color} roughness={1} />
      </mesh>
    </Float>
  );
}

function HeroScene({ onFullyZoomedOut, isScrollEffectsEnabled }) {
  const controlsRef = useRef(null);
  const zoomTargetRef = useRef(new Vector3());
  const hasTriggeredZoomOutRef = useRef(false);

  useFrame((state) => {
    if (!controlsRef.current || !isScrollEffectsEnabled) {
      return;
    }

    controlsRef.current.getTarget(zoomTargetRef.current);
    const cameraDistance = state.camera.position.distanceTo(
      zoomTargetRef.current,
    );
    const isAtMaxZoomOut = cameraDistance >= HERO_EFFECTIVE_MAX_DISTANCE - 0.08;

    if (isAtMaxZoomOut && !hasTriggeredZoomOutRef.current) {
      hasTriggeredZoomOutRef.current = true;
      onFullyZoomedOut?.();
    }

    if (cameraDistance <= HERO_EFFECTIVE_MAX_DISTANCE - 0.6) {
      hasTriggeredZoomOutRef.current = false;
    }
  });

  return (
    <>
      <CameraControls
        ref={controlsRef}
        makeDefault
        enabled={isScrollEffectsEnabled}
        maxPolarAngle={Math.PI / 2}
        minDistance={HERO_MIN_DISTANCE}
        maxDistance={HERO_EFFECTIVE_MAX_DISTANCE}
      />
      <color attach="background" args={["#d7d7df"]} />
      <ambientLight intensity={0.65} />
      <hemisphereLight intensity={0.6} groundColor="#b9bdc8" color="#ffffff" />
      <HeroLightRig />
      <RoomModel scale={0.5} position={[0, -1, 0]} />
      <FloatingSphere color="#f66fb0" />
      <FloatingSphere position={[2, 4, -8]} scale={0.9} color="#3f86ff" />
      <FloatingSphere position={[-2, 2, -8]} scale={0.8} color="#1dcf9f" />
    </>
  );
}

export default function Hero3D({
  onFullyZoomedOut,
  isScrollEffectsEnabled = true,
}) {
  return (
    <section className="hero-3d" aria-label="3D hero section">
      <Canvas
        shadows
        camera={{ position: [5, 2, 10], fov: 50 }}
        dpr={[1, 1.75]}
      >
        <Suspense fallback={null}>
          <HeroScene
            onFullyZoomedOut={onFullyZoomedOut}
            isScrollEffectsEnabled={isScrollEffectsEnabled}
          />
        </Suspense>
      </Canvas>
      <div className="hero-text-block" aria-label="hero introduction text">
        <p className="hero-name-label">Brian Wilkinson</p>
        <p className="hero-left-label" aria-label="software engineer">
          <span>software engineer</span>
        </p>
      </div>
      <div className="hero-portrait-wrap" aria-hidden="true">
        <img className="hero-portrait-image" src={brian1} alt="" />
      </div>
      <div className="hero-social-icons" aria-label="Social icons">
        <button
          type="button"
          className="hero-social-icon"
          aria-label="LinkedIn"
        >
          <FaLinkedinIn />
        </button>
        <button
          type="button"
          className="hero-social-icon"
          aria-label="Instagram"
        >
          <FaInstagram />
        </button>
        <button type="button" className="hero-social-icon" aria-label="GitHub">
          <FaGithub />
        </button>
        <button type="button" className="hero-social-icon" aria-label="Email">
          <MdEmail />
        </button>
        <button type="button" className="hero-social-icon" aria-label="IMDb">
          <FaImdb />
        </button>
      </div>
    </section>
  );
}
