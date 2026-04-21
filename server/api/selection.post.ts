import { setSelectedImages, broadcast, getState } from '../utils/state'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ images: string[] }>(event)

  if (!Array.isArray(body?.images)) {
    throw createError({ statusCode: 400, message: 'images must be an array' })
  }

  setSelectedImages(body.images)
  broadcast({ type: 'images-updated', data: { selectedImages: body.images } })

  return { selectedImages: getState().selectedImages }
})
