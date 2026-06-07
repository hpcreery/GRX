export function buf2hex(buffer: ArrayBuffer): string {
  // buffer is an ArrayBuffer
  return [...new Uint8Array(buffer)].map((x) => x.toString(16).padStart(2, "0")).join("")
}

// biome-ignore lint: allow any here
export function isEmpty(obj: Record<any, any>): boolean {
  return Object.keys(obj).length === 0
}

export function eightByteRealToFloat(value: ArrayBuffer): number {
  const view = new DataView(value)
  const short1 = view.getUint16(0, false)
  const short2 = view.getUint16(2, false)
  const long3 = view.getUint32(4, false)
  const exponent = (short1 & 0x7f00) / 256 - 64
  const mantissa = (((short1 & 0x00ff) * 65536 + short2) * 4294967296 + long3) / 72057594037927936.0
  if (short1 & 0x8000) {
    return -mantissa * 16.0 ** exponent
  }
  return mantissa * 16.0 ** exponent
}
