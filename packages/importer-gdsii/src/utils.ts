export function buf2hex(buffer: ArrayBuffer): string {
  // buffer is an ArrayBuffer
  return [...new Uint8Array(buffer)].map((x) => x.toString(16).padStart(2, "0")).join("")
}

// biome-ignore lint: allow any here
export function isEmpty(obj: Record<any, any>): boolean {
  return Object.keys(obj).length === 0
}
