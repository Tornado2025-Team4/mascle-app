import { SupabaseClient } from "@supabase/supabase-js";

export async function userIdPub2Rel(spClService: SupabaseClient, pubId: string) {
    const { data, error } = await spClService
        .from('users_master')
        .select('rel_id')
        .eq('pub_id', pubId)
        .single();
    if (error) {
        throw error;
    }
    return data.rel_id;
}
