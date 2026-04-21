import { readdirSync, existsSync } from 'node:fs'
import { join, resolve, sep } from 'node:path'
import os from 'node:os'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const dir = resolve((query.path as string) || os.homedir())

  if (!existsSync(dir)) {
    throw createError({ statusCode: 404, message: 'Directory not found' })
  }

  try {
    const entries = readdirSync(dir, { withFileTypes: true })
    const directories = entries
      .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
      .map((e) => ({ name: e.name, path: join(dir, e.name) }))
      .sort((a, b) => a.name.localeCompare(b.name))

    const parent = dir !== sep ? resolve(dir, '..') : null

    return { current: dir, parent, directories }
  } catch {
    throw createError({ statusCode: 403, message: 'Cannot read directory' })
  }
})
