#version 300 es
/*
    Cubic Bezier curve outline, fill, tangent and normal

    Based on:

    OTF Lobster Shadertoy render
    https://www.shadertoy.com/view/Wtt3Wl <-- Long compilation times

    Cubic Bezier - 2D BBox
    https://www.shadertoy.com/view/XdVBWd

    Cubic Bezier vs. Line Intersect
    https://www.shadertoy.com/view/NdjGWz

    https://pomax.github.io/bezierinfo/
    https://www.particleincell.com/2013/cubic-line-intersection/
    https://www.math.ucdavis.edu/~kkreith/tutorials/sample.lesson/cardano.html
    https://en.wikipedia.org/wiki/Even-odd_rule

    Logo
    https://upload.wikimedia.org/wikipedia/commons/4/4f/Twitter-logo.svg

    SVG path to cubic Bezier Converter
    https://itchylabs.com/tools/path-to-bezier/

*/
precision mediump float;

uniform vec3      iResolution;           // viewport resolution (in pixels)
uniform float     iTime;                 // shader playback time (in seconds)
uniform float     iTimeDelta;            // render time (in seconds)
uniform float     iFrameRate;            // shader frame rate
uniform int       iFrame;                // shader playback frame
uniform float     iChannelTime[4];       // channel playback time (in seconds)
uniform vec3      iChannelResolution[4]; // channel resolution (in pixels)
uniform vec4      iMouse;                // mouse pixel coords. xy: current (if MLB down), zw: click
// uniform samplerXX iChannel0..3;          // input channel. XX = 2D/Cube
uniform vec4      iDate;                 // (year, month, day, time in seconds)


// Logo: https://upload.wikimedia.org/wikipedia/commons/4/4f/Twitter-logo.svg
// Converter: https://itchylabs.com/tools/path-to-bezier/
// Some very short curves removed

#define POINT_COUNT 51
#define PATH_COUNT 17.0

// First path is [0, 1, 2, 3] second is [3, 4, 5, 6] etc.
vec2[] points = vec2[](
    vec2(221.95, 51.29),
    vec2(222.10, 53.46),
    vec2(222.10, 55.63),
    vec2(222.10, 57.82),
    vec2(222.10, 124.55),
    vec2(171.30, 201.51),
    vec2(78.41, 201.51),
    vec2(50.97, 201.51),
    vec2(24.10, 193.65),
    vec2(1.00, 178.83),
    vec2(4.99, 179.31),
    vec2(9.00, 179.55),
    vec2(13.02, 179.56),
    vec2(35.76, 179.58),
    vec2(57.85, 171.95),
    vec2(75.74, 157.90),
    vec2(54.13, 157.49),
    vec2(35.18, 143.40),
    vec2(28.56, 122.83),
    vec2(36.13, 124.29),
    vec2(43.93, 123.99),
    vec2(51.36, 121.96),
    vec2(27.80, 117.20),
    vec2(10.85, 96.50),
    vec2(10.85, 71.82),
    vec2(17.87, 75.73),
    vec2(25.73, 77.90),
    vec2(33.77, 78.14),
    vec2(11.58, 63.31),
    vec2(4.74, 33.79),
    vec2(18.14, 10.71),
    vec2(43.78, 42.26),
    vec2(81.61, 61.44),
    vec2(122.22, 63.47),
    vec2(118.15, 45.93),
    vec2(123.71, 27.55),
    vec2(136.83, 15.22),
    vec2(157.17, -3.90),
    vec2(189.16, -2.92),
    vec2(208.28, 17.41),
    vec2(219.59, 15.18),
    vec2(230.43, 11.03),
    vec2(240.35, 5.15),
    vec2(236.58, 16.84),
    vec2(228.69, 26.77),
    vec2(218.15, 33.08),
    vec2(228.16, 31.90),
    vec2(237.94, 29.22),
    vec2(247.15, 25.12),
    vec2(240.37, 35.29),
    vec2(231.83, 44.14),
    vec2(221.95, 51.29)
);

// Draw a smooth outline using linear segments
//#define OUTLINE

// Fill shape using the even-odd rule and Cardano's method
#define FILL

// Uncomment to draw tangent and normal
//#define ANALYSIS

// Switch fill and background colours
//#define INVERT

const vec3 blue = vec3(0.114, 0.608, 0.941);

#ifdef INVERT
const vec3 fillColour = blue;
const vec3 backgroundColour = vec3(1);
#else
const vec3 fillColour = vec3(1);
const vec3 backgroundColour = blue;
#endif

const float outlineSegments = 32.0;
const float outlineThickness = 1.0;

#define ZERO min(0, iFrame)
#define PI 3.14159265359
#define TWO_PI 6.28318530718
#define FOUR_PI 12.5663706144
#define O3 (1.0 / 3.0)

// Return real cuberoot
float cuberoot(float v) {
    /*
    if(v < 0.0){
        return -pow(-v, O3);
    }
    return pow(v, O3);
    */
    return sign(v) * pow(abs(v), O3);
}

// Cardano's method
// https://pomax.github.io/bezierinfo/#extremities
// Slightly simplified
// Given cubic y-coordinates pa, pb, pc, pd, find all roots
void cubicRoots(float pa, float pb, float pc, float pd, inout vec3 roots){

    // Precompute 3.0 * p for a, b, c
    vec3 pabc3 = 3.0 * vec3(pa, pb, pc);

    float a = (pabc3.x - 6.0 * pb + pabc3.z);  // (3.0 * pa - 6.0 * pb + 3.0 * pc)
    float b = pabc3.y - pabc3.x;               // (-3.0 * pa + 3.0 * pb)
    float d = pabc3.y - pabc3.z + pd - pa;     // (-pa + 3.0 * pb - 3.0 * pc + pd)

    a /= d;
    b /= d;
    pa /= d;

    // Precompute a / 3.0
    float a3 = a * O3;

    // Precompute a^2
    float a2 = a * a;

    float p = (3.0 * b - a2) * O3 * O3;
    float p3 = p * p * p;

    // Divide q by 27.0 manually
    float q = (0.07407407407 * a2 * a - O3 * a * b + pa);
    float q2 = 0.5 * q;
    float discriminant = q2 * q2 + p3;

    // Three possible real roots
    if(discriminant < 0.0){

        float r = sqrt(-p3);
        float phi = acos(clamp(-q / (2.0 * r), -1.0, 1.0));

        roots.x = phi;
        roots.y = phi + TWO_PI;
        roots.z = phi + FOUR_PI;

        roots = 2.0 * cuberoot(r) * cos(roots * O3) - a3;

    }else if(discriminant < 1e-8){
        // Three real roots, but two of them are equal
        float u1 = q2 < 0.0 ? cuberoot(-q2) : -cuberoot(q2);
        roots.x = 2.0 * u1;
        roots.y = -u1;

        roots.xy -= a3;

    }else{
        // One real root, two complex roots
        float sd = sqrt(discriminant);
        roots.x = cuberoot(sd - q2) - cuberoot(sd + q2) - a3;
    }
}

// First derivative of a cubic Bezier. The tangent of the curve.
vec2 cubicDerivative(vec2 a, vec2 b, vec2 c, vec2 d, float t){
    float omt = 1.0 - t;
    vec2 aD = 3.0 * (b - a);
    vec2 bD = 3.0 * (c - b);
    vec2 cD = 3.0 * (d - c);
    return  aD * omt * omt +
            bD * 2.0 * omt * t +
            cD * t * t;
}

// Four control point and distance t between a and d in [0, 1]
vec2 cubicBezier(vec2 a, vec2 b, vec2 c, vec2 d, float t){
    float omt = 1.0 - t;
    return  a * omt * omt * omt +
            b * 3.0 * omt * omt * t +
            c * 3.0 * omt * t * t +
            d * t * t * t;
}

// https://iquilezles.org/articles/distfunctions2d
float sdSegment(vec2 p, vec2 a, vec2 b){
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h);
}

// https://www.shadertoy.com/view/XdVBWd
// Cubic distance calculation is complex
// Discretize the curve with linear segments
// Performance can be pretty poor but works for single frame render
// TODO: cull AABB / OOBB
float distanceToCurve(vec2 a, vec2 b, vec2 c, vec2 d, vec2 p){

    float dist = 1e10;

    vec2 minimum = min(min(a, b), min(c, d));
    vec2 maximum = max(max(a, b), max(c, d));

    // Only draw outline for pixels in the curve bounding box
    if(p.x > (minimum.x - outlineThickness) && p.x < (maximum.x + outlineThickness) &&
       p.y > (minimum.y - outlineThickness) && p.y < (maximum.y + outlineThickness)){

        const float deltaS = 1.0 / (outlineSegments - 1.0);

        vec2 p0 = a;

        for(float i = 1.0; i < outlineSegments; i += 1.0){

            vec2 p1 = cubicBezier(a, b, c, d, i * deltaS);
            dist = min(dist, sdSegment(p, p0, p1));

            p0 = p1;

        }
    }
    return dist;
}

int intersectionCount(vec2 a, vec2 b, vec2 c, vec2 d, vec2 uv){

    // Intersections are the roots when the curve is translated so the pixel row is the x-axis
    vec3 roots = vec3(-1);
    vec2 shift = vec2(0.0, uv.y);

    vec2 sA = a - shift;
    vec2 sB = b - shift;
    vec2 sC = c - shift;
    vec2 sD = d - shift;

    vec2 minimum = min(min(sA, sB), min(sC, sD));
    vec2 maximum = max(max(sA, sB), max(sC, sD));

    // Epsilon to avoid near miss artefacts at segment ends
    float eps = 1e-5;

    // Only check for roots when the curve bounding box intersects the pixel row
    // If the whole curve is above or below the x-axis, there are no roots for t in [0, 1]
    if(minimum.y > -eps || maximum.y < eps){
        return 0;
    }

    // Pass the y values of the shifted curve
    cubicRoots(sA.y, sB.y, sC.y, sD.y, roots);

    int count = 0;

    vec2 p = vec2(0);

    for(int i = 0; i < 3; i++){

        // If the roots exist on the curve between t = 0 and t = 1
        if(roots[i] >= -eps && roots[i] <= 1.0 + eps){

            // Find the coordinates of the root
            p = cubicBezier(sA, sB, sC, sD, roots[i]);

            // If the intersection is to the right of the pixel
            if(p.x > uv.x){
                count++;
            }
        }
    }

    return count;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord){

    vec2 uv = fragCoord/iResolution.xy;
    uv -= 0.5;
    uv.y /= iResolution.x/iResolution.y;

    // Flip y-axis
    uv.y *= -1.0;

    // Zoom out
    uv *= 500.0;

    // Logo dimensions are [248, 204]
    vec2 dim = vec2(248.0, 204.0);

    uv += 0.5 * dim;

    vec3 col = backgroundColour;
    float dist = 1e10;

    // Only draw outline for pixels in the logo bounding box
    bool drawOutline =  uv.x > -outlineThickness &&
                        uv.x < dim.x + outlineThickness &&
                        uv.y > -outlineThickness &&
                        uv.y < dim.y + outlineThickness;
    int count = 0;

    for(int i = 0; i < POINT_COUNT; i += 3){

#ifdef FILL
        count += intersectionCount(points[i], points[i+1], points[i+2], points[i+3], uv);
#endif

#ifdef OUTLINE
        if(drawOutline){
            dist= min(dist,distanceToCurve(points[i],points[i+1],points[i+2],points[i+3],uv));
        }
#endif

    }

    // Fill interior using the even-odd rule
    // https://en.wikipedia.org/wiki/Even-odd_rule
    // Find the number of intersections to the right of the pixel.
    // Odd: inside
    // Even: outside
    if(count % 2 > 0){
       col = fillColour;
    }

    dist = smoothstep(outlineThickness, max(0.0, outlineThickness-1.0), dist);
    col = mix(col, fillColour, dist);

#ifdef ANALYSIS
    // Draw point travelling along the curve
    float time = iTime * 0.1;
    float curve = floor(fract(time) * PATH_COUNT);
    float t = fract(fract(time) * PATH_COUNT);
    int i = 3 * int(curve);

    vec2 a = points[i];
    vec2 b = points[i + 1];
    vec2 c = points[i + 2];
    vec2 d = points[i + 3];

    vec2 pos = cubicBezier(a, b, c, d, t);
    dist = length(pos - uv);
    dist = smoothstep(4.0, 3.0, dist);
    col = mix(col, vec3(0), dist);

    float lineLength = 25.0;
    float minSize = 1.0;
    float maxSize = 1.5;

    // Draw tangent at the point
    vec2 tangent = normalize(cubicDerivative(a, b, c, d, t));
    dist = sdSegment(uv, pos, pos + lineLength * tangent);
    dist = smoothstep(maxSize, minSize, dist);
    col = mix(col, vec3(1, 0, 0), dist);

    // Draw normal at the point
    vec2 normal = normalize(cross(vec3(tangent, 0.0), vec3(0, 0, 1))).xy;
    dist = sdSegment(uv, pos, pos + lineLength * normal);
    dist = smoothstep(maxSize, minSize, dist);
    col = mix(col, vec3(0.5 + 0.5 * normal, 1.0), dist);
#endif

    // Output to screen
    fragColor = vec4(col, 1.0);
}
