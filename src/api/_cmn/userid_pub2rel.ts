import { SupabaseClient } from "@supabase/supabase-js";

export async function userIdPub2Rel(spCl: SupabaseClient, pubId: string) {
    const { data, error } = await spCl
        .from('users_master')
        .select('rel_id')
        .eq('pub_id', pubId)
        .single();
    if (error) {
        throw error;
    }
    return data.rel_id;
}
