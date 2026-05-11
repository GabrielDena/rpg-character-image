import { loadCampaignState } from '../utils/db'
import { initState } from '../utils/state'

export default defineNitroPlugin(async () => {
    try {
        const saved = await loadCampaignState()
        if (saved) {
            initState(saved.selectedFolder, saved.selectedImages)
            console.log(`[init] Restored state from DB: folder=${saved.selectedFolder}, images=${saved.selectedImages.length}`)
        }
    } catch (err) {
        console.error('[init] Failed to restore state from DB:', err)
    }
})
