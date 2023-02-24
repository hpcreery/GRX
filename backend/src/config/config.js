import { config } from 'dotenv'
import { join } from 'path'
config()

export const port = process.env.PORT || 8081
export const dir = {
  artworkdb: process.env.ARTWORKDB || process.cwd() + '/public/artworkdb/',
  example: process.env.EXAMPLE || process.cwd() + '/public/artwork',
  artwork: process.env.ARTWORK || process.cwd() + '/public/artwork',
}
