import { setFolder, broadcast } from '../utils/state'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ path: string }>(event)

  if (!body?.path) {
    throw createError({ statusCode: 400, message: 'Path is required' })
  }

  setFolder(body.path)
  broadcast({ type: 'folder-changed', data: { folder: body.path } })

  return { folder: body.path }
})
