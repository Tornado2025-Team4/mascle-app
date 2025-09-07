import { Context } from "vm";
import { SupabaseClient } from "@supabase/supabase-js";
import { mustGetCtx } from "./get_ctx";

export interface SpClSessOrAnon {
    spCl: SupabaseClient;
    spClIsSess: boolean;
}

export const mustGetSpClSessOrAnon = (c: Context): SpClSessOrAnon => {
    const spClSess = c.get('supabaseClientSess') as SupabaseClient | null;
    if (spClSess) {
        return { spCl: spClSess, spClIsSess: true };
    };
    const spClAnon = mustGetCtx<SupabaseClient>(c, 'supabaseClientAnon');
    return { spCl: spClAnon, spClIsSess: false };
};