import { Context } from 'hono';
import { nanoid } from 'nanoid';
import { SupabaseClient } from '@supabase/supabase-js';
import { ApiErrorFatal, ApiErrorUnprocessable } from '../_cmn/error';
import { mustGetCtx } from '../_cmn/get_ctx';

interface ReqBody {
    name: string;
}

export default async function post(c: Context) {
    const spClSess = mustGetCtx<SupabaseClient>(c, 'supabaseClientSess');

    let reqBody: ReqBody;
    try {
        reqBody = await c.req.json();
    } catch {
        throw new ApiErrorUnprocessable('body', 'Invalid JSON body');
    }

    if (!reqBody.name || typeof reqBody.name !== 'string' || reqBody.name.trim().length === 0) {
        throw new ApiErrorUnprocessable('name', 'name is required and must be a non-empty string');
    }

    const trimmedName = reqBody.name.trim();
    if (trimmedName.length > 100) {
        throw new ApiErrorUnprocessable('name', 'name must be 100 characters or less');
    }

    const pubId = nanoid(21);

    const { error: insertError } = await spClSess
        .from('tags_master')
        .insert({
            pub_id: pubId,
            name: trimmedName
        });

    if (insertError) {
        throw new ApiErrorFatal(`Failed to create tag: ${insertError.message}`);
    }

    return c.json({ pub_id: pubId });
}
