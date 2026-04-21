import { getState } from '../utils/state'

export default defineEventHandler(() => {
  return { folder: getState().selectedFolder }
})
