import { checkPassword } from '../utils/auth'
import { setFolder, broadcast } from '../utils/state'
import { saveLastFolder } from '../utils/lastFolder'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ path: string; password: string }>(event)

  if (!checkPassword(body?.password)) throw createError({ statusCode: 401, message: 'Unauthorized' })
  if (!body?.path) throw createError({ statusCode: 400, message: 'Path is required' })

  setFolder(body.path)
  broadcast({ type: 'folder-changed', data: { folder: body.path } })
  await saveLastFolder(body.path)

  return { folder: body.path }
})
