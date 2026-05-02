import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

export function useSupabase() {
    if (!_client) {
        const { public: pub } = useRuntimeConfig();
        _client = createClient(pub.supabaseUrl as string, pub.supabaseKey as string);
    }
    return _client;
}

