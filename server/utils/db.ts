import { createClient } from '@supabase/supabase-js';

interface CampaignState {
    selectedFolder: string | null;
    selectedImages: string[];
}

let _db: ReturnType<typeof createClient> | null = null;

function getDb() {
    if (!_db) {
        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_SECRET_KEY;
        if (!url || !key) throw new Error('SUPABASE_URL or SUPABASE_SECRET_KEY not set');
        _db = createClient(url, key, { auth: { persistSession: false } });
    }
    return _db;
}

export async function loadCampaignState(): Promise<CampaignState | null> {
    try {
        const { data, error } = await (getDb()
            .from('campaign_state')
            .select('current_folder, active_images')
            .eq('id', 1)
            .single() as unknown as Promise<{
            data: { current_folder: string | null; active_images: string[] } | null;
            error: unknown;
        }>);
        if (error || !data) return null;
        return {
            selectedFolder: data.current_folder ?? null,
            selectedImages: Array.isArray(data.active_images) ? data.active_images : [],
        };
    } catch {
        return null;
    }
}

export async function saveCampaignState(folder: string | null, images: string[]): Promise<void> {
    try {
        await (getDb().from('campaign_state') as any).upsert({
            id: 1,
            current_folder: folder,
            active_images: images,
            updated_at: new Date().toISOString(),
        });
    } catch (err) {
        console.error('[db] Failed to save campaign state:', err);
    }
}

