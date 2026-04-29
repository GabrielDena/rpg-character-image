import { readdirSync, existsSync } from 'node:fs'
import { extname, resolve } from 'node:path'

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.jfif', '.png', '.gif', '.webp', '.avif', '.bmp'])
const MAX_PREVIEW = 12

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const dir = resolve((query.path as string) || '')

  if (!dir || !existsSync(dir)) {
    return { images: [] }
  }

  try {
    const files = readdirSync(dir)
    const images = files
      .filter((f) => IMAGE_EXTENSIONS.has(extname(f).toLowerCase()))
      .sort()
      .slice(0, MAX_PREVIEW)
      .map((filename) => ({
        filename,
        url: `/api/folder/image?folder=${encodeURIComponent(dir)}&filename=${encodeURIComponent(filename)}`,
      }))

    return { images }
  } catch {
    return { images: [] }
  }
})
