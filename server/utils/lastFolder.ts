import { promises as fs } from 'fs'
import { join } from 'path'

const LAST_FOLDER_FILE = join(process.cwd(), '.data', 'last-folder.txt')

export async function saveLastFolder(folder: string): Promise<void> {
  try {
    await fs.mkdir(join(process.cwd(), '.data'), { recursive: true })
    await fs.writeFile(LAST_FOLDER_FILE, folder, 'utf-8')
  } catch (error) {
    console.error('[Last Folder] Failed to save:', error)
  }
}

export async function getLastFolder(): Promise<string | null> {
  try {
    const content = await fs.readFile(LAST_FOLDER_FILE, 'utf-8')
    return content.trim() || null
  } catch {
    return null
  }
}
