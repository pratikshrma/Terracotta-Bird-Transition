import { useGLTF, useTexture } from "@react-three/drei";
import CustomShaderMaterial from "three-custom-shader-material";
import { MeshPhysicalMaterial } from "three";
import { useRef, useLayoutEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import fragmentShader from "../Shaders/Bird/frag.glsl?raw";
import vertexShader from "../Shaders/Bird/vert.glsl?raw";
import gsap from "gsap";
import { useLoader } from "@react-three/fiber";
import { EXRLoader } from "three/examples/jsm/Addons.js";
import { useControls } from "leva";

function Experience() {
  const uProgressRef = useRef(-0.8);
  const uAnimationProgress = useRef(0.0);
  const scale = useRef({ value: 1.0 });

  const { nodes } = useGLTF("/models/Vat_TerracottaModel.glb");
  // const { scene} = useGLTF("/models/watertank.glb");
  const { uNoiseScale, uIceBandWidth, uNoisePositionScale, uNoisePower, uDistortionFactor, uBumpStrength } = useControls({
    uNoiseScale: {
      value: 0.38,
      min: 0.0,
      max: 1.0,
    },
    uIceBandWidth: {
      value: 0.22,
      min: 0.0,
      max: 1.0,
    },
    uProgress: {
      value: -1.,
      min: -2.0,
      max: 3.0,
      onChange: (value) => {
        uProgressRef.current = value;
      },
    },
    uNoisePositionScale: {
      value: 1.76,
      min: 0.0,
      max: 2.0,
    },
    uNoisePower: {
      value: 5.0,
      min: 0.0,
      max: 10.0,
    },
    uDistortionFactor: {
      value: 0.4,
      min: 0.0,
      max: 2.0,
    },
    uBumpStrength: {
      value: 0.04,
      min: 0.0,
      max: 0.2,
    },
  });

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

  const VAT_positionsTerracotta = useLoader(
    EXRLoader,
    "/textures/Vat_positionsTerracotta.exr",
    (loader) => {
      loader.setDataType(THREE.HalfFloatType);
    },
  );
  const VAT_normalsTerracotta = useLoader(
    EXRLoader,
    "/textures/Vat_normalsTerracotta.exr",
    (loader) => {
      loader.setDataType(THREE.HalfFloatType);
    },
  );
  console.log(VAT_positionsTerracotta)
  useLayoutEffect(() => {
    // Apply settings once, safely
    VAT_positionsTerracotta.minFilter = THREE.NearestFilter;
    VAT_positionsTerracotta.magFilter = THREE.NearestFilter;
    VAT_positionsTerracotta.generateMipmaps = false;
    VAT_positionsTerracotta.mapping = THREE.UVMapping;
    VAT_positionsTerracotta.needsUpdate = true;
    
    VAT_normalsTerracotta.minFilter = THREE.NearestFilter;
    VAT_normalsTerracotta.magFilter = THREE.NearestFilter;
    VAT_normalsTerracotta.generateMipmaps = false;
    VAT_normalsTerracotta.mapping = THREE.UVMapping;
    VAT_normalsTerracotta.needsUpdate = true;
  }, [VAT_positionsTerracotta,VAT_normalsTerracotta]);

  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<any>(null);

  const startAnimation = () => {
    const tl = gsap.timeline();
    console.log("Start the animation");
    tl.fromTo(
      uProgressRef,
      {
        current: -0.8,
      },
      {
        current: 3.6,
        duration: 5,
        overwrite: true,
        ease: "power3",
      },
    );
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

  const noiseMap = useTexture("/noise/noise2.png");
  noiseMap.wrapS = noiseMap.wrapT = THREE.RepeatWrapping;

  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uProgress.value = uProgressRef.current;
      materialRef.current.uniforms.uAnimationProgress.value =
        uAnimationProgress.current;
    }
    if (groupRef.current) {
      const s = 3 * scale.current.value;
      groupRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group
      ref={groupRef}
      position={[-2, 1, 0]}
      onClick={startAnimation}
      onPointerEnter={applyHoverEffects}
      onPointerLeave={removeHoverEffects}
    >
      <primitive object={nodes.export_mesh}>
        <CustomShaderMaterial
          ref={materialRef}
          attach="material"
          baseMaterial={MeshPhysicalMaterial}
          // Glass Property
          transmission={1}
          roughness={0.0}
          ior={1.5}
          thickness={1.0}
          transparent={true}
          side={THREE.DoubleSide}
          uniforms={{
            uVatPositions: { value: VAT_positionsTerracotta },
            uTextureWidth: { value: VAT_positionsTerracotta.image.width},
            uVatNormals: { value: VAT_normalsTerracotta },
            uAnimationProgress: { value: uAnimationProgress.current },
            uProgress: { value: uProgressRef.current },
            uNoiseMap: { value: noiseMap },
            uNoiseScale: { value: uNoiseScale },
            uTerracottaColorMap: { value: terracottaColorMap },
            uTerracottaNormalMap: { value: terracottaNormalMap },
            uTerracottaAOMap: { value: terracottaAOMap },
            uTerracottaHeightMap: { value: terracottaHeightMap },
            uTerracottaRoughnessMap: { value: terracottaRoughnessMap },
            uIceTextureColorMap: { value: iceTextureColorMap },
            uIceBandWidth: { value: uIceBandWidth },
            uNoisePositionScale: { value: uNoisePositionScale },
            uNoisePower: { value: uNoisePower },
            uDistortionFactor: { value: uDistortionFactor },
            uBumpStrength: { value: uBumpStrength },
          }}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
        />
      </primitive>
    </group>
  );
}

export default Experience;
