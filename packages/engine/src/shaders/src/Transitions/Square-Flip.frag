// inspired by shader from VoidChicken
// https://www.shadertoy.com/view/XtdXR2
// ... and portal of course ;)
precision highp float;
uniform vec3      iResolution;           // viewport resolution (in pixels)
uniform float     iTime;                 // shader playback time (in seconds)
uniform float     iTimeDelta;            // render time (in seconds)
uniform float     iFrameRate;            // shader frame rate
uniform int       iFrame;                // shader playback frame
uniform float     iChannelTime[4];       // channel playback time (in seconds)
uniform vec3      iChannelResolution[4]; // channel resolution (in pixels)
uniform vec4      iMouse;                // mouse pixel coords. xy: current (if MLB down), zw: click
uniform sampler2D iChannel0;             // input channel. XX = 2D/Cube
uniform vec4      iDate;                 // (year, month, day, time in seconds)

// 1 .. 3
const int transitionType = 1;

void mainImage(out vec4 fragColor, vec2 fragCoord)
{
    fragColor = vec4(0);
    float depth = -1e3;
    for (float i=0. ; i<=1. ; ++i)
    {
        vec2 xy = fragCoord - iResolution.xy / 2.0;
        float grid_width = 64.0;
        xy /= grid_width;
        xy.y += i + .5;
        xy.y /= 2.;
        vec2 grid = floor(xy);
        xy -= grid + 0.5;
        xy.y *= 2.;
        grid.y = grid.y * 2. - i;

        float phase = 0.0;//iMouse.x / iResolution.x;
        float offset = (grid.y - grid.x)*0.1;
        float time = iTime*1.0 - offset;
        if (transitionType == 1)
            // looping + wrapping
            time = mod(time, 6.0);
        else if (transitionType == 2)
            // flip once
            time = clamp(time - 1., 0., 1.);
        else if (transitionType == 3)
            ;// flip and return once
        phase += smoothstep(0.0, 1.0, time);
        phase += 1.0 - smoothstep(3.0, 4.0, time);
        phase = abs(mod(phase, 2.0)-1.0);

        float side = step(0.5, phase);

        float angle = radians(phase * 180.), z = 2.;
        vec3 p = inverse(mat3(cos(angle),0,-sin(angle), 0,1,0, 0,0,z)) * vec3(xy, z);
        vec2 uv = p.xy / p.z + .5;

        float alpha = 1.;
        if (uv.x>=0.0&&uv.y>=0.0&&uv.x<=1.0&&uv.y<=1.0 && p.z>depth)
            depth = p.z;
        else
            alpha = 0.;

        vec2 scale = grid_width / iResolution.xy;
        vec2 uv1 = (grid + uv                   ) * scale + .5;
        vec2 uv2 = (grid + vec2(1. - uv.x, uv.y)) * scale + .5;
        vec4 c1 = texture(iChannel0, uv1);
        // vec4 c2 = texture(iChannel1, uv2);
        vec4 c2 = vec4(0.0, 0.0, 0.0, 1.0);

        fragColor = mix(fragColor, mix(c1, c2, side), alpha);
        //fragColor = mix(fragColor, vec4(p.z-1., 1.-p.z, 0, 1)*10., alpha);
    }
}
