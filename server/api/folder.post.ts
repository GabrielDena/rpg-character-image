import { existsSync, statSync } from 'node:fs'
import { setFolder, broadcast } from '../utils/state'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ path: string }>(event)

  if (!body?.path || !existsSync(body.path) || !statSync(body.path).isDirectory()) {
    throw createError({ statusCode: 400, message: 'Invalid folder path' })
  }

  setFolder(body.path)
  broadcast({ type: 'folder-changed', data: { folder: body.path } })

  return { folder: body.path }
})
