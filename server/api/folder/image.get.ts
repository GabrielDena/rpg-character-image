import { createReadStream, existsSync } from 'node:fs'
import { join, extname, resolve } from 'node:path'

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
  const query = getQuery(event)
  const folder = query.folder as string
  const filename = query.filename as string

  if (!folder || !filename) {
    throw createError({ statusCode: 400, message: 'Invalid request' })
  }

  const resolvedFolder = resolve(folder)
  const filePath = resolve(join(resolvedFolder, filename))

  if (!filePath.startsWith(resolvedFolder + '/') && filePath !== resolvedFolder) {
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
