// Implementation of https://mobile.twitter.com/keenanisalive/status/1448036393012322313
// Complex functions taken from https://www.shadertoy.com/view/fsyXzz

precision highp float;
uniform vec2      u_Resolution;           // viewport resolution (in pixels)
uniform float     u_Time;                 // shader playback time (in seconds)
// uniform float     iTimeDelta;            // render time (in seconds)
// uniform float     iFrameRate;            // shader frame rate
// uniform int       iFrame;                // shader playback frame
// uniform float     iChannelTime[4];       // channel playback time (in seconds)
// uniform vec3      iChannelResolution[4]; // channel resolution (in pixels)
// uniform vec4      iMouse;                // mouse pixel coords. xy: current (if MLB down), zw: click
// uniform sampler2D iChannel0;             // input channel. XX = 2D/Cube
// uniform vec4      iDate;                 // (year, month, day, time in seconds)


#define PI 3.141592653589
// #define T ( u_Time * 3. )
// #define M iMouse.xy
// #define R u_Resolution.xy

vec2 as_polar( vec2 z ) {
	return vec2(
	  length( z ),
	  atan( z.y, z.x ) );
}

vec2 c_pow( vec2 v, float p ) {
	vec2 z = as_polar( v );
	return pow( z.x, p ) * vec2( cos( z.y * p ), sin( z.y * p ) );
}

vec2 c_div( vec2 a, vec2 b ) {
	return vec2(
	         a.x * b.x + a.y * b.y,
	         a.y * b.x - a.x * b.y ) /
	       dot( b, b );
}

float im( vec2 z ) {
	return ( ( atan( z.y, z.x ) / PI ) + 1.0 ) * 0.5;
}

float line( vec2 z, vec2 p, vec2 q ) {
	vec2 pz = z - p;
	vec2 qz = z - q;

	vec2 pz_over_qz = c_div( pz, qz );
	vec2 log_pz_over_qz = c_pow( pz_over_qz, 1.0 );
	float im_z = im( log_pz_over_qz );
	return im_z;
}

void mainImage( out vec4 O, in vec2 I ) {
	// Normalized pixel coordinates (from -1 to 1)
	vec2 z = I / u_Resolution.xy * 2.0 - 1.0;
	z.x *= u_Resolution.x / u_Resolution.y;

  float T = u_Time * 2.;

	vec2 p = vec2( -.5, 0.5 * cos( T ) );
	vec2 q = vec2( .5, 0.5 * sin( T ) );

	vec2 p2 = vec2( .5, 0.5 * -sin( T ) );
	vec2 q2 = vec2( -.5, 0.5 * -cos( T ) );

	// Output to screen
	O = vec4( vec3( 1. - pow( ( line( z, p, q ) + line( z, p2, q2 ) ), 1. ) ) * vec3( 0.8, 0.8, 0.8 ), 1.0 );
}

void main() {
  mainImage( gl_FragColor, gl_FragCoord.xy );
}
