varying vec3 vPosition;
varying vec3 vCustomNormal;
varying vec2 vUv;
void main() {
  vPosition = position;
  vUv = uv;
  vCustomNormal=normal;
}
