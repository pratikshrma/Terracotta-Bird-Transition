import { useControls } from "leva"

const Lights = () => {
  const {ambI,dirI}=useControls({
    ambI:{
      value:9,
      min:1,
      max:30
    },
    dirI:{
      value:18,
      min:1,
      max:30
    }
  }) 
  

  return (
    <>
      <ambientLight intensity={ambI} color={'#ffffff'}/>
      <directionalLight position={[-5,-5,5]} intensity={dirI} color={'#ffffff'}/> 
    </>
  )
}

export default Lights
