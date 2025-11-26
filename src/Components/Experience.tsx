import { useGLTF, useTexture} from "@react-three/drei";
import CustomShaderMaterial from "three-custom-shader-material";
import { MeshPhysicalMaterial } from "three";
import { useRef} from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import fragmentShader from "../Shaders/Bird/frag.glsl?raw";
import vertexShader from "../Shaders/Bird/vert.glsl?raw";
import gsap from "gsap";

function Experience() {
  const uProgressRef = useRef(-3);
  const scale = useRef({ value: 1.0 });
  
  // const { nodes } = useGLTF("/models/terrracotaOptimisedPoly.glb");
  const { nodes } = useGLTF("/models/terrracotaOptimisedPoly.glb");
  console.log(nodes)
  const [
    terracottaColorMap,
    terracottaAOMap,
    terracottaHeightMap,
    terracottaNormalMap,
    terracottaRoughnessMap,
  ] = useTexture([
    "/textures/TerracottaTexturesPNG/TexturesCom_Terracotta_Plain_1K_albedo.png",
    "/textures/TerracottaTexturesPNG/TexturesCom_Terracotta_Plain_1K_ao.png",
    "/textures/TerracottaTexturesPNG/TexturesCom_Terracotta_Plain_1K_height.png",
    "/textures/TerracottaTexturesPNG/TexturesCom_Terracotta_Plain_1K_normal.png",
    "/textures/TerracottaTexturesPNG/TexturesCom_Terracotta_Plain_1K_roughness.png",
  ]);

  const [iceTextureColorMap, _iceTextureDispMap, _iceTextureNormalMap] =
    useTexture([
      "/textures/IceTexture/ice-1_diffuse.jpg",
      "/textures/IceTexture/ice-1_displacement.jpg",
      "/textures/IceTexture/ice-1_normal.jpg",
    ]);
  const groupRef = useRef<any>(null);
  const materialRef = useRef<any>(null);
  // const { actions, names } = useAnimations(animations, groupRef);

  const startAnimation = () => {
    const tl = gsap.timeline();
    console.log("Start the animation");
    tl.fromTo(
      uProgressRef,
      {
        current: -2.8,
      },
      {
        current: 1.9,
        duration: 4,
        overwrite: true,
        ease: "power3",
      },
    );
    // if (actions && actions[names[0]]) {
    //   const action = actions[names[0]];
    //   if (action) {
    //     action.reset();
    //     action.time = 10.2;
    //     action.play();
    //   }
    // }
  };

  const applyHoverEffects = () => {
    console.log("Hover");
    gsap.to(scale.current, {
      value: 1.0,
      duration: 0.5,
      ease: "power2.out",
    });
  };

  const removeHoverEffects = () => {
    console.log("No Hover");
    gsap.to(scale.current, {
      value: 1.05,
      duration: 0.5,
      ease: "power2.out",
    });
  };

  // useEffect(() => {
  //   if (!names.length) return;
  //
  //   const first = names[0];
  //   if (actions && actions[first]) {
  //     // actions[first].play();
  //     const action = actions[first];
  //     const duration = action.getClip().duration;
  //     action.reset();
  //     action.play();
  //     action.paused = true; // Pause the animation to allow manual scrubbing
  //
  //     const uProgressGeoNormalized = uProgressGeo * (9 - 3) + 3;
  //     action.time = ((uProgressGeoNormalized + 1) / duration) * 2; // Map uProgressGeo (-1 to 1) to animation time (0 to duration)
  //   }
  // }, [actions, names, uProgressGeo]);

  const noiseMap = useTexture("/noise/noise.png");
  noiseMap.wrapS = noiseMap.wrapT = THREE.RepeatWrapping;

  useFrame(() => {
    if (materialRef.current) {
      // const uProgressMatNormalized = uProgressGeo * (1.9 - -2.8) - 2.8;
      materialRef.current.uniforms.uProgress.value = uProgressRef.current;
    }
    if (groupRef.current) {
      const s = 8 * scale.current.value;
      groupRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group
      ref={groupRef}
      dispose={null}
      position={[-1,0,0]} 
      scale={[8,8,8]}
      onClick={startAnimation}
      onPointerEnter={applyHoverEffects}
      onPointerLeave={removeHoverEffects}
    >
      <primitive object={nodes.Optimised}>
        <CustomShaderMaterial
          ref={materialRef}
          attach="material"
          baseMaterial={MeshPhysicalMaterial}
          // Glass Property
          transmission={0.5}
          roughness={0.0}
          ior={1.5}
          thickness={1.0}
          transparent={true}
          side={THREE.DoubleSide}
          uniforms={{
            uProgress: { value: -1.8 },
            uNoiseMap: { value: noiseMap },
            uNoiseScale: { value: 0.2 },
            uTerracottaColorMap: { value: terracottaColorMap },
            uTerracottaNormalMap: { value: terracottaNormalMap },
            uTerracottaAOMap: { value: terracottaAOMap },
            uTerracottaHeightMap: { value: terracottaHeightMap },
            uTerracottaRoughnessMap: { value: terracottaRoughnessMap },
            uIceTextureColorMap: { value: iceTextureColorMap },
            uIceBandWidth: { value: 0.2 },
          }}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
        />
      </primitive>
    </group>
  );
}

export default Experience;
