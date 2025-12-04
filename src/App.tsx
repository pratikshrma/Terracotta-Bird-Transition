import {  OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import Lights from "./Components/Lights";
import Experience from "./Components/Experience";
import { Leva } from "leva";
import * as THREE from 'three'
// import { Perf } from "r3f-perf";

const App = () => {
  return (
    <>
      <Leva hidden collapsed />
      <Canvas
        gl={{
          toneMapping:THREE.ACESFilmicToneMapping,
          toneMappingExposure:1.0,
          }}
        dpr={1}
      >
        {/* <Perf position="top-left"/> */}
        {/* <Environment files={"textures/studio_small_03_1k.exr"} background blur={0.5}/>  */}
        <color attach="background" args={["#a17e59"]}/>
        <PerspectiveCamera makeDefault position={[-6,0,6]} fov={50}/>
        <OrbitControls />
        <Lights />
        <Experience/>
      </Canvas>
    </>
  );
};

export default App;
