import { createClient } from '@supabase/supabase-js';
import { MiddlewareHandler } from 'hono';

export const createSupabaseClientMW: MiddlewareHandler = async (c, next) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const spClAnon = createClient(supabaseUrl, supabaseAnonKey);
    const spClService = createClient(supabaseUrl, supabaseServiceRoleKey);

    c.set('supabaseClientAnon', spClAnon);
    c.set('supabaseClientService', spClService);

    await next();
}