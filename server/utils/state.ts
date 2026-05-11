interface AppState {
  selectedFolder: string | null
  selectedImages: string[]
}

const state: AppState = {
  selectedFolder: null,
  selectedImages: [],
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

