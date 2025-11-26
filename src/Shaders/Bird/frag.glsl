varying vec3 vPosition;
varying vec3 vCustomNormal; // Built-in, do not redeclare
varying vec3 vRestPosition;
varying float vDistortedPortion;

uniform float uProgress;
uniform sampler2D uNoiseMap;
uniform float uNoiseScale;
uniform vec3 uTerracottaColor;
uniform sampler2D uTerracottaColorMap;
uniform sampler2D uTerracottaNormalMap;
uniform sampler2D uTerracottaAOMap;
uniform sampler2D uTerracottaHeightMap;
uniform sampler2D uTerracottaRoughnessMap;

uniform sampler2D uIceTextureColorMap;

uniform float uIceBandWidth;
uniform vec3 uIceColor;

// 1. TRIPLANAR FOR COLOR (Returns vec3)
vec3 triplanarColor(sampler2D map, vec3 pos, vec3 normal, float scale) {
  vec2 uvX = pos.yz * scale;
  vec2 uvY = pos.xz * scale;
  vec2 uvZ = pos.xy * scale;

  vec3 colorX = texture2D(map, uvX).rgb;
  vec3 colorY = texture2D(map, uvY).rgb;
  vec3 colorZ = texture2D(map, uvZ).rgb;

  vec3 weights = abs(normal);
  weights /= (weights.x + weights.y + weights.z);

  return (colorX * weights.x) + (colorY * weights.y) + (colorZ * weights.z);
}

float triplanarNoise(vec3 pos, vec3 normal, float scale) {
  vec2 uvX = pos.yz * scale;
  vec2 uvY = pos.xz * scale;
  vec2 uvZ = pos.xy * scale;

  float noiseX = texture2D(uNoiseMap, uvX).r;
  float noiseY = texture2D(uNoiseMap, uvY).r;
  float noiseZ = texture2D(uNoiseMap, uvZ).r;

  vec3 weights = abs(normal);
  weights /= (weights.x + weights.y + weights.z);

  return (noiseX * weights.x) + (noiseY * weights.y) + (noiseZ * weights.z);
}

vec3 triplanarNormal(sampler2D map, vec3 pos, vec3 normal, float scale) {
  // A. Calculate UVs (Same as color)
  vec2 uvX = pos.yz * scale;
  vec2 uvY = pos.xz * scale;
  vec2 uvZ = pos.xy * scale;

  // B. Sample the Maps & Unpack from [0,1] to [-1, 1]
  vec3 tX = texture2D(map, uvX).rgb * 2.0 - 1.0;
  vec3 tY = texture2D(map, uvY).rgb * 2.0 - 1.0;
  vec3 tZ = texture2D(map, uvZ).rgb * 2.0 - 1.0;

  // C. Calculate Weights (Sharper blend looks better for normals)
  vec3 weights = abs(normal);
  weights = pow(weights, vec3(4.0));
  weights /= (weights.x + weights.y + weights.z);

  // D. Swizzle (Rotate) to match World Directions
  // We map the texture's "Up" (Blue) to the World's X, Y, or Z axis
  vec3 nX = vec3(0.0, tX.yx);
  vec3 nY = vec3(tY.x, 0.0, tY.y);
  vec3 nZ = vec3(tZ.xy, 0.0);

  // E. Combine and add to the original surface normal
  return normalize(normal + (nX * weights.x + nY * weights.y + nZ * weights.z));
}

void main() {
  float distortedPosition = vDistortedPortion;
  // 2. DEFINE MASKS (Logic Flipped)

  // Glass Zone: Pixels where position is LESS than progress (Left side)
  // returns 1.0 if distortedPosition < uProgress
  float glassMask = 1.0 - step(uProgress, distortedPosition);

  // Ice + Glass Zone: Pixels where position is LESS than progress + width
  float combinedMask = 1.0 - step(uProgress + uIceBandWidth, distortedPosition);

  // Ice Zone: The strip between the Combined and Glass
  float iceZone = combinedMask - glassMask;

  // Terracotta Zone: Everything else (The Right side)
  float terracottaMask = 1.0 - combinedMask;

  // 3. APPLY MATERIALS

  float terraRoughness = triplanarColor(uTerracottaRoughnessMap, vPosition, vCustomNormal, 1.0).r;
  terraRoughness = max(terraRoughness, 1.0);
  float terraAO = triplanarColor(uTerracottaAOMap, vPosition, vCustomNormal, 1.0).r;

  // ROUGHNESS
  // Start with Terracotta (0.8)
  float r = terraRoughness;
  // Blend to Ice (0.15) in the ice zone
  r = mix(r, 0.15, iceZone);
  // Blend to Glass (0.0) in the glass zone
  r = mix(r, 0.0, glassMask);
  csm_Roughness = r;

  // --- TRANSMISSION (Transparency) ---
  // IMPORTANT: Clay must be solid (0.0). Ice is semi-transparent (0.6). Glass is clear (1.0).
  // vec3 c = uTerracottaColor
  vec3 c = triplanarColor(uTerracottaColorMap, vPosition, vNormal, 1.0);
  // now AO is just some fake crackes so we will just multiply

  c = pow(c, vec3(5.2));
  c = c * terraAO;

  vec3 iceTextureColor = triplanarColor(uIceTextureColorMap, vPosition, vNormal, 1.0);
  // Blend to Ice Color
  c = mix(c, iceTextureColor, iceZone);
  // Blend to Glass Color (Base White)
  c = mix(c, csm_DiffuseColor.rgb, glassMask);
  csm_DiffuseColor = vec4(c, 1.0);

  // 4. PHYSICS HACK
  // If we are in the Terracotta zone, force opacity/dielectric
  // (We use 0.5 as a safe threshold for the float mask)
  if (terracottaMask > 0.5) {
    vec3 terracottaNormal = triplanarNormal(uTerracottaNormalMap, vPosition, vCustomNormal, 1.0);
    csm_Metalness = 0.0;
  }

  vec3 finalNormal = vCustomNormal;
  if (terracottaMask > 0.1) {
    vec3 terracottaNormal = triplanarNormal(uTerracottaNormalMap, vPosition, vCustomNormal, 1.0);
    finalNormal = mix(terracottaNormal, vCustomNormal, combinedMask);
  }
  csm_FragNormal = finalNormal;

  float t = 0.0;
  t = mix(t, 0.6, iceZone);
  t = mix(t, 1.0, glassMask);

  csm_Transmission = t;

  float thick = 0.0;
  thick = mix(thick, 1.5, glassMask + iceZone);
  csm_Thickness = thick;
}
