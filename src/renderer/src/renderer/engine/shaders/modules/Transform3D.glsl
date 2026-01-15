// vec3 unprojectPoint(vec2 ndc, float clipZ) {
//   // ndc: normalized device coords in [-1,1]
//   vec4 clip = u_InverseTransform3D * vec4(ndc, clipZ, 1.0);

//   // If w is tiny, return a sentinel large value instead of discarding
//   if (abs(clip.w) < 1e-6) {
//     return vec3(1e20);
//   }

//   return clip.xyz / clip.w; // proper perspective divide by w
// }

// vec4 transformLocation3D(vec2 coordinate) {
//   // coordinate is assumed to be NDC (-1..1)
//   vec3 pNear = unprojectPoint(coordinate, -1.0); // near clip
//   vec3 pFar  = unprojectPoint(coordinate,  1.0); // far clip

//   vec3 dir = pFar - pNear;
//   float denom = dir.z;

//   // If ray is nearly parallel to the plane, use pNear as fallback (no discard)
//   if (abs(denom) < 1e-6) {
//     return vec4(pNear, 1.0);
//   }

//   float t = (0.0 - pNear.z) / denom; // intersection with world z = 0
//   // clamp to reasonable range to avoid extreme values
//   t = clamp(t, -1.0e6, 1.0e6);

//   vec3 worldPos = pNear + t * dir;
//   return vec4(worldPos, 1.0);
// }
