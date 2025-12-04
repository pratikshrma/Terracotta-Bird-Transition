// Uniforms passed from our React component
uniform float uTime;
uniform float uAmplitude;
uniform float uWaveLength;
uniform float uWaveIterations;
uniform float uSteepness;
uniform float uShoreDistance;
uniform float uShoreSoftness;

varying vec3 vPosition;
varying float vElevation;
varying float vShoreFactor;

// GLSL doesn't have a built-in random function, so we create one.
// It takes a 2D vector and returns a pseudo-random float between 0.0 and 1.0.
float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// This function generates a pseudo-random 2D direction vector from a float seed.
vec2 randomDirection(float seed) {
  // Create a vector from the seed.
  vec2 st = vec2(seed, seed);
  // Use our random function to get two different random numbers.
  float r1 = random(st * 3.14);
  float r2 = random(st * 6.28);
  // Use those numbers with sin and cos to create a random direction vector.
  return vec2(sin(r1 * 6.283), cos(r2 * 6.283));
}

void main() {
  vec3 transformedPosition = position;
  float elevation = 0.0;
  float dist = distance(position.xy+0.5, vec2(-0.9, .5));

  vShoreFactor = smoothstep(uShoreDistance, uShoreDistance + uShoreSoftness, dist);
  for (float i = 1.0; i <= uWaveIterations; i++) {
    vec2 dir = randomDirection(i);
    float amp = uAmplitude / i;

    float waveLen = uWaveLength * (4.0 / i);

    float speed = 1.0 + random(vec2(i, i)) * 2.0;
    float wave = sin(dot(position.xy, dir) * (6.283 / waveLen) + uTime * speed);
    float cosWave = cos(dot(position.xy, dir) * (6.283 / waveLen) + uTime * speed);

    transformedPosition.xy += dir * uSteepness * cosWave * amp;

    elevation += wave * amp;
  }
  elevation *= vShoreFactor;
  vElevation = elevation;
  transformedPosition.z += elevation;

  vec4 modelPosition = modelMatrix * vec4(transformedPosition, 1.0);

  vPosition = modelPosition.xyz;

  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;

  gl_Position = projectedPosition;
}

