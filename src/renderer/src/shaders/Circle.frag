precision highp float;

uniform vec2 u_position;
uniform float u_radius;

const float threshold = 0.3;

// vec4 circle(vec2 uv, vec2 pos, float rad, vec3 color) {
//   float d = length(pos - uv) - rad;
//   float t = clamp(d, 0.0, 1.0);
//   return vec4(color, 1.0 - t);
// }

// void main() {
//   float dist = distance(u_position, gl_FragCoord.xy);
//   if(dist > u_radius)
//     discard;

//   float d = dist / u_radius;
//   vec4 fill_color = vec4(0.69, 0.4, 0.4, 1.0);
//   vec3 color = mix(fill_color.rgb, vec3(0.0), step(1.0 - threshold, d));

//   gl_FragColor = vec4(color, 1.0);
// }

uniform vec2 u_resolution;
/**
 * @author jonobr1 / http://jonobr1.com/
 */

/**
 * Convert r, g, b to normalized vec3
 */
// vec3 rgb(float r, float g, float b) {
//   return vec3(r / 255.0, g / 255.0, b / 255.0);
// }

// /**
//  * Draw a circle at vec2 `pos` with radius `rad` and
//  * color `color`.
//  */
// vec4 circle(vec2 uv, vec2 pos, float rad, vec3 color) {
//   float d = length(pos - uv) - rad;
//   float t = clamp(d, 0.0, 1.0);
//   return vec4(color, 1.0 - t);
// }

// void main() {

//   vec2 uv = gl_FragCoord.xy;
//   vec2 center = vec2(0.0, 0.0);
//   float radius = 0.25;

//     // Background layer
//   vec4 layer1 = vec4(rgb(210.0, 222.0, 228.0), 1.0);

// 	// Circle
//   vec3 red = rgb(225.0, 95.0, 60.0);
//   vec4 layer2 = circle(uv, center, radius, red);

// 	// Blend the two
//   gl_FragColor = mix(layer1, layer2, layer2.a);

// }

void main() {
  //
  // -- ex4: circle with 30% from iResolution
  vec2 uv = gl_FragCoord.xy;
  // set center for circle
  vec2 center = u_resolution.xy * 0.5;
  // set radius of circle
  float radius = u_radius;
  // create circle with delta and theta function
  // make delta
  float d = length(center - uv) - radius;
  if(d > u_radius)
    discard;
  gl_FragColor = vec4(0.56, 0.44, 0.44, 1.0);
}
