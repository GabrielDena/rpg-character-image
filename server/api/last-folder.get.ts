import { getLastFolder } from '../utils/lastFolder'

export default defineEventHandler(async () => {
  const folder = await getLastFolder()
  return { folder }
})
