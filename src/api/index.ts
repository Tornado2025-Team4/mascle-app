import { Hono } from 'hono';
import { createSupabaseClientMW } from './_cmn/create_supaclient';
import app_tags from './tags';
import { ApiError, ApiErrorFatal, ApiErrorNotFound } from './_cmn/error';
import { getEnvMW } from './_cmn/get_env';

const app = new Hono();

app.use('*', getEnvMW, createSupabaseClientMW);

app.route('/tags', app_tags);

app.notFound((c) => {
    throw new ApiErrorNotFound('API Endpoint');
});

app.onError(async (err, c) => {
    const castedErr = err instanceof ApiError ? err : new ApiErrorFatal(`unknown error`);
    await castedErr.logging();
    return castedErr.intoResp(c);
});

export default app;
