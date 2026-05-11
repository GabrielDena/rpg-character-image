interface AppState {
  selectedFolder: string | null
  selectedImages: string[]
  selectedBackground: string | null
  galleryFitMode: 'cover' | 'contain'
}

const state: AppState = {
  selectedFolder: null,
  selectedImages: [],
  selectedBackground: null,
  galleryFitMode: 'cover',
}

export function getState(): AppState {
  return { ...state }
}

export function setFolder(folder: string | null) {
  state.selectedFolder = folder
  state.selectedImages = []
  state.selectedBackground = null
}

export function setSelectedImages(images: string[]) {
  state.selectedImages = images
}

export function setSelectedBackground(path: string | null) {
  state.selectedBackground = path
}

export function setGalleryFitMode(mode: 'cover' | 'contain') {
  state.galleryFitMode = mode
}

export function initState(folder: string | null, images: string[], background: string | null) {
  state.selectedFolder = folder
  state.selectedImages = images
  state.selectedBackground = background
}

