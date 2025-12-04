varying vec3 vPosition;
varying float vElevation;
varying float vShoreFactor;

uniform vec3 uCameraPosition;
uniform float uShininess;
uniform float uSpecularIntensity; 
uniform float uFoamThreshold;
uniform float uFoamSoftness;
uniform vec3 uFoamColor;
uniform vec3 uShoreColor;
uniform vec3 uFogColor;
uniform float uFogNear;
uniform float uFogFar;

uniform float uTime;

// --- NEW: 2D SIMPLEX NOISE FUNCTION ---
// This is a standard, high-quality noise function.
// We'll treat it as a tool we can now use.
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626,
0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}
// --- END OF NOISE FUNCTION ---


void main() {
  //first step is calculating the normals
  vec3 dx = dFdx(vPosition);
  vec3 dy = dFdy(vPosition);

  vec3 normal = normalize(cross(dx, dy));

  vec3 lightDirection = normalize(vec3(1.0, 1.0, 0.5));

  float diffuse = max(dot(normal, lightDirection), 0.0);

  vec3 viewDirection=normalize(uCameraPosition-vPosition);

  vec3 halfWayDirection=normalize(viewDirection+lightDirection);

  float specular=pow(max(dot(normal,halfWayDirection),0.0),uShininess);

  float foamFactor=smoothstep(uFoamThreshold,uFoamThreshold+uFoamSoftness,vElevation+0.1); 


  vec3 baseColor = vec3(0.1, 0.3, 0.8);
  vec3 diffusedColor = baseColor * diffuse;
  vec3 specularColor=vec3(1.0)*specular*uSpecularIntensity;
  vec3 waterColor=diffusedColor+specularColor;

  
  float dist=distance(vPosition.xz,vec2(-1.0,0.0));


  float radius = 1.0; 

  // 2. INVERT LOGIC & SOFTEN EDGES:
  // smoothstep(inner, outer, value) creates a soft gradient.
  // We do "1.0 - smoothstep" to make the Center = 1 and Outside = 0
  float alpha = step(dist,radius);

  // 3. OPTIMIZATION: Discard pixels that are fully invisible to avoid Z-fighting
  if (alpha < 0.01) discard;

  gl_FragColor = vec4(waterColor, alpha);
}

