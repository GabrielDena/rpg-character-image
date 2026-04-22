import { readdirSync } from 'node:fs'
import { extname } from 'node:path'
import { getState } from '../utils/state'

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.jfif', '.png', '.gif', '.webp', '.avif', '.bmp'])

export default defineEventHandler(() => {
  const { selectedFolder } = getState()

  if (!selectedFolder) {
    throw createError({ statusCode: 400, message: 'No folder selected' })
  }

  const files = readdirSync(selectedFolder)
  const images = files
    .filter((file) => IMAGE_EXTENSIONS.has(extname(file).toLowerCase()))
    .sort()
    .map((filename) => ({
      filename,
      url: `/api/image/${encodeURIComponent(filename)}`,
    }))

  return { images }
})
