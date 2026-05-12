export default defineEventHandler(() => {
  return { folder: getState().selectedFolder }
})
