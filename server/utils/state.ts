interface AppState {
  selectedFolder: string | null
  selectedImages: string[]
  galleryFitMode: 'cover' | 'contain'
}

const state: AppState = {
  selectedFolder: null,
  selectedImages: [],
  galleryFitMode: 'cover',
}

export function getState(): AppState {
  return { ...state }
}

export function setFolder(folder: string | null) {
  state.selectedFolder = folder
  state.selectedImages = []
}

export function setSelectedImages(images: string[]) {
  state.selectedImages = images
}

export function setGalleryFitMode(mode: 'cover' | 'contain') {
  state.galleryFitMode = mode
}

export function initState(folder: string | null, images: string[]) {
  state.selectedFolder = folder
  state.selectedImages = images
}

