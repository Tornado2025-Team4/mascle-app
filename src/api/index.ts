import { Hono } from 'hono';
import { createSupabaseClientMW } from './_cmn/create_supaclient';
import app_tags from './tags';
import { ApiError, ApiErrorFatal } from './_cmn/error';

const app = new Hono();

app.use('*', createSupabaseClientMW);

app.route('/tags', app_tags);

app.onError(async (err, c) => {
    const castedErr = err instanceof ApiError ? err : new ApiErrorFatal(`unknown error`);
    await castedErr.logging();
    return castedErr.intoResp(c);
});

export default app;
