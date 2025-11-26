varying vec3 vPosition;
varying vec3 vCustomNormal;
varying vec2 vUv;
varying vec3 vRestPosition;
varying float vDistortedPortion;

// --- UNIFORMS (Same as Fragment Shader) ---
uniform sampler2D uNoiseMap;
uniform float uNoiseScale;
uniform float uProgress;
uniform float uIceBandWidth;
uniform float uNoisePositionScale;
uniform float uNoisePower;
uniform float uDistortionFactor;
uniform float uBumpStrength;

// --- HELPER: Triplanar Noise for Vertex Shader ---
// Note: We MUST use texture2DLod here because it is a Vertex Shader
float vertexTriplanarNoise(vec3 pos, vec3 normal, float scale) {
  vec2 uvX = pos.yz * scale;
  vec2 uvY = pos.xz * scale;
  vec2 uvZ = pos.xy * scale;

  // Lod 0.0 = Read the full resolution texture
  float noiseX = textureLod(uNoiseMap, uvX, 0.0).r;
  float noiseY = textureLod(uNoiseMap, uvY, 0.0).r;
  float noiseZ = textureLod(uNoiseMap, uvZ, 0.0).r;

  vec3 weights = abs(normal);
  weights /= (weights.x + weights.y + weights.z);

  return (noiseX * weights.x) + (noiseY * weights.y) + (noiseZ * weights.z);
}

void main() {
  vUv = uv;
  vCustomNormal = normal;
  vRestPosition=position;
  
  // 1. Current Position (No VATs, just the mesh)
  vec3 currentPos = position;

  // 2. Calculate the "Distorted Position" (Logic copied from Fragment Shader)
  // We need this to know WHERE the gradient line is
  float noise = vertexTriplanarNoise(currentPos, normal, uNoisePositionScale);
  noise=pow(noise,uNoisePower);
  
  // This formula matches your Fragment shader logic exactly:
  float distortedPosition = -(currentPos.y + (noise * uNoiseScale) - currentPos.x/uDistortionFactor + (noise * uNoiseScale));

  vDistortedPortion=distortedPosition;

  // 3. Create the "Bump Mask"
  // We want the bump to happen exactly where distortedPosition == uProgress
  
  float dist = abs(distortedPosition - uProgress); // How far is this vertex from the line?
  
  // If distance is 0.0 (at the line) -> Mask is 1.0
  // If distance is > uIceBandWidth (far from line) -> Mask is 0.0
  float bumpMask = 1.0 - smoothstep(0.0, uIceBandWidth, dist);
  
  // Make the curve nicer (Bell curve shape)
  bumpMask = pow(bumpMask, 2.0);

  // 4. Apply the Bump
  vec3 finalPos = currentPos + (normal * bumpMask * uBumpStrength);

  // 5. Output
  vPosition = finalPos; 
  csm_Position = finalPos;
}
