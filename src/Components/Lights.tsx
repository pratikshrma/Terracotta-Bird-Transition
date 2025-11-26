const Lights = () => {
  return (
    <>
      <ambientLight intensity={1} color={'#ffffff'}/>
      <directionalLight position={[5,5,5]} intensity={5} color={'#ffffff'}/> 
    </>
  )
}

export default Lights
