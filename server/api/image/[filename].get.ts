import { createReadStream, existsSync } from 'node:fs'
import { join, extname, resolve } from 'node:path'
import { getState } from '../../utils/state'

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.bmp': 'image/bmp',
  '.jfif': 'image/jpeg',
}

export default defineEventHandler((event) => {
  const filename = decodeURIComponent(getRouterParam(event, 'filename') || '')
  const { selectedFolder } = getState()

  if (!selectedFolder || !filename) {
    throw createError({ statusCode: 400, message: 'Invalid request' })
  }

  const filePath = resolve(join(selectedFolder, filename))

  // Prevent path traversal
  if (!filePath.startsWith(resolve(selectedFolder))) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  if (!existsSync(filePath)) {
    throw createError({ statusCode: 404, message: 'Image not found' })
  }

  const ext = extname(filename).toLowerCase()
  const contentType = MIME_TYPES[ext] || 'application/octet-stream'

  setHeader(event, 'Content-Type', contentType)
  setHeader(event, 'Cache-Control', 'public, max-age=3600')

  return sendStream(event, createReadStream(filePath))
})
