export function getPublicUrl(storagePath: string): string {
    return supabaseAdmin().storage.from(STORAGE_BUCKET).getPublicUrl(storagePath).data.publicUrl;
}
