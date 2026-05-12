export default defineEventHandler(() => {
  return { selectedImages: getState().selectedImages }
})
