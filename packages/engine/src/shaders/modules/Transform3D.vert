vec4 transformLocation3D(vec2 coordinate) {
  // if u_Transform3D is identity, skip the transformation
  if (u_Transform3D == mat4(1.0)) {
    return vec4(coordinate.xy, 0.0, 0.0);
  }

  vec4 transformed_position_3d = u_Transform3D * vec4(coordinate.xy, u_ZOffset, 1.0);
  // if (1.0 + transformed_position_3d.w < 0.0) {
  //   transformed_position_3d.w = -0.9999;
  // }
  // transformed_position_3d.xy /= max(1.0 + (transformed_position_3d.z), 0.0);
  // transformed_position_3d.xy /= abs(1.0 + (transformed_position_3d.z));
  if (!u_Perspective3D) {
    // transformed_position_3d.xy /= 1.0 + transformed_position_3d.z;
    transformed_position_3d.w = 0.0;
  }
  return transformed_position_3d;
}

#pragma glslify: export(transformLocation3D)
