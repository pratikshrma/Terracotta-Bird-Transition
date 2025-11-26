import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

interface IUniforms {
  uTime: { value: number };
  uDirtTex: { value: THREE.Texture };
}

const IcePlane = () => {
  const dirtTexture = useTexture("/textures/dirt.png");
  dirtTexture.wrapS = THREE.RepeatWrapping;
  dirtTexture.wrapT = THREE.RepeatWrapping;
  dirtTexture.repeat.set(4, 4);

  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null!);

  const uniforms = useMemo<IUniforms>(
    () => ({
      uTime: { value: 0.0 },
      uDirtTex: { value: dirtTexture },
    }),
    [dirtTexture]
  );

  useFrame((state) => {
    const shader = materialRef.current?.userData.shader;
    if (shader) {
      shader.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  const onBeforeCompile = (shader: THREE.Shader) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.uniforms.uDirtTex = uniforms.uDirtTex;

    // --- 1. HEADER ---
    const header = `
      uniform float uTime;
      uniform sampler2D uDirtTex;
      varying float vElevation;
      varying vec2 vUv;

      float random(vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123); }
      float noise(vec2 st) {
          vec2 i = floor(st); vec2 f = fract(st);
          float a = random(i); float b = random(i + vec2(1.0, 0.0));
          float c = random(i + vec2(0.0, 1.0)); float d = random(i + vec2(1.0, 1.0));
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }
    `;
    shader.vertexShader = header + shader.vertexShader;
    shader.fragmentShader = header + shader.fragmentShader;

    // --- 2. VERTEX SHADER ---
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      `
        vec3 transformed = vec3( position );
        float waveHeight = noise(position.xy * 2.0 + uTime * 0.5);
        transformed.z += waveHeight * 0.5;
        vElevation = transformed.z;
      `
    );

    // // --- 3. FRAGMENT: COLOR ---
    // shader.fragmentShader = shader.fragmentShader.replace(
    //   "#include <map_fragment>",
    //   `
    //     float c_dirtMask = 1.0 - smoothstep(-0.2, 0.0, vElevation);
    //     float c_iceMask = smoothstep(-0.2, 0.0, vElevation) * (1.0 - smoothstep(0.3, 0.5, vElevation));
    //
    //     vec4 texDirt = texture2D(uDirtTex, vUv);
    //     vec3 colIce = vec3(0.6, 0.85, 1.0);
    //     vec3 colGlass = vec3(1.0, 1.0, 1.0);
    //
    //     vec3 mixedColor = colGlass;
    //     mixedColor = mix(mixedColor, colIce, c_iceMask);
    //     mixedColor = mix(mixedColor, texDirt.rgb, c_dirtMask);
    //
    //     diffuseColor.rgb = mixedColor;
    //   `
    // );
    //
    // // --- 4. FRAGMENT: ROUGHNESS (The Fix) ---
    // // We add 'float' before roughnessFactor to DEFINE it, because we deleted the original definition.
    // shader.fragmentShader = shader.fragmentShader.replace(
    //   "#include <roughnessmap_fragment>",
    //   `
    //     float r_dirtMask = 1.0 - smoothstep(-0.2, 0.0, vElevation);
    //     float r_iceMask = smoothstep(-0.2, 0.0, vElevation) * (1.0 - smoothstep(0.3, 0.5, vElevation));
    //
    //     float r_mix = 0.0; 
    //     r_mix = mix(r_mix, 0.3, r_iceMask);
    //     r_mix = mix(r_mix, 1.0, r_dirtMask);
    //
    //     float roughnessFactor = r_mix; // <--- ADDED 'float' HERE
    //   `
    // );
    //
    // // --- 5. FRAGMENT: TRANSMISSION (The Fix) ---
    // // We add 'float' before transmissionFactor to DEFINE it.
    // shader.fragmentShader = shader.fragmentShader.replace(
    //   "#include <transmission_fragment>",
    //   `
    //     float t_dirtMask = 1.0 - smoothstep(-0.2, 0.0, vElevation);
    //     float t_iceMask = smoothstep(-0.2, 0.0, vElevation) * (1.0 - smoothstep(0.3, 0.5, vElevation));
    //
    //     float t_mix = 1.0;
    //     t_mix = mix(t_mix, 0.6, t_iceMask);
    //     t_mix = mix(t_mix, 0.0, t_dirtMask);
    //
    //     float transmissionFactor = t_mix; // <--- ADDED 'float' HERE
    //   `
    // );
    //
    materialRef.current.userData.shader = shader;

    console.log("Shader compiled successfully")
  };

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[10, 10, 128, 128]} />
      <meshPhysicalMaterial
        ref={materialRef}
        transmission={1.0}
        thickness={1.5}
        roughness={0.2}
        ior={1.5}
        envMapIntensity={1}
        transparent={true}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

export default IcePlane;
