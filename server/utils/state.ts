import { existsSync, statSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const FOLDER_FILE = resolve(process.cwd(), 'folder-path.txt')

interface AppState {
  selectedFolder: string | null
  selectedImages: string[]
}

const state: AppState = {
  selectedFolder: null,
  selectedImages: [],
}

// Load persisted folder on startup
if (existsSync(FOLDER_FILE)) {
  const savedPath = readFileSync(FOLDER_FILE, 'utf-8').trim()
  if (savedPath && existsSync(savedPath) && statSync(savedPath).isDirectory()) {
    state.selectedFolder = savedPath
  } else {
    writeFileSync(FOLDER_FILE, '', 'utf-8')
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const peers = new Set<any>()

export function getState(): AppState {
  return { ...state }
}

export function setFolder(folder: string | null) {
  state.selectedFolder = folder
  state.selectedImages = []
  writeFileSync(FOLDER_FILE, folder ?? '', 'utf-8')
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
