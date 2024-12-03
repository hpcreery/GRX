import { characters } from './characters'
const fontWidth = 7
const fontHeight = 13
const radius = Math.ceil(Math.sqrt(characters.length))
const textureWidth = radius * fontWidth
const textureHeight = radius * fontHeight
export const fontInfo = {
  fontWidth,
  fontHeight,
  textureWidth,
  textureHeight,
  glyphInfos: characters.reduce((acc, char, i) => {
    const x = i % radius
    const y = Math.floor(i / radius)
    acc[char] = { x: x * fontWidth, y: y * fontHeight }
    return acc
  }, {} as Record<string, { x: number; y: number }>)
}
