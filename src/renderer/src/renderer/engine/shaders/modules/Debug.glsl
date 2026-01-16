// This module shall be imported in the main method of a fragment shader. It provides a function to render a signed distance field.

  if (DEBUG == 1) {
    // float scale = sqrt(pow(u_Transform[0][0], 2.0) + pow(u_Transform[1][0], 2.0)) * u_Resolution.x;
    // // float pixel_size = u_PixelSize / scale;
    // float pixel_size = u_PixelSize * (v_Z + 1.0) / (scale);
    vec3 col = (dist > 0.0) ? vec3(0.9, 0.6, 0.3) : vec3(0.65, 0.85, 1.0);
    col *= 1.0 - exp(-3.0*abs(dist * 0.01 / pixel_size));
    col *= 0.8 + 0.25*cos(dist / pixel_size);
    // col = mix( col, vec3(1.0), 1.0-smoothstep(0.0,u_PixelSize,abs(dist)) );
    // if (dist < 0.0 && dist > -pixel_size) {
    if (dist < pixel_size && dist > -pixel_size) {
      col = vec3(1.0, 1.0, 1.0);
    }
    gl_FragColor = vec4(col, 1.0);
    return;
  }
