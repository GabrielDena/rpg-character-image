interface AppState {
  selectedFolder: string | null
  selectedImages: string[]
}

const state: AppState = {
  selectedFolder: null,
  selectedImages: [],
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const peers = new Set<any>()

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

export function addPeer(peer: unknown) {
  peers.add(peer)
}

export function removePeer(peer: unknown) {
  peers.delete(peer)
}

export function broadcast(message: object) {
  const data = JSON.stringify(message)
  for (const peer of peers) {
    peer.send(data)
  }
}
