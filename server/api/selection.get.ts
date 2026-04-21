import { getState } from '../utils/state'

export default defineEventHandler(() => {
  return { selectedImages: getState().selectedImages }
})
