import { Hono } from 'hono';
import { createSupabaseClientMW } from './_cmn/create_supaclient';
import app_tags from './tags';
import { ApiError, ApiErrorFatal, ApiErrorNotFound, ApiErrorTransient } from './_cmn/error';
import { getEnvMW } from './_cmn/get_env';
import { logger } from 'hono/logger';

const apiApp = new Hono().basePath("/api");

apiApp.use('*', logger(), getEnvMW, createSupabaseClientMW);

apiApp.route('/tags', app_tags);

apiApp.notFound(() => {
    throw new ApiErrorNotFound('API Endpoint');
});

apiApp.onError(async (err, c) => {
    const castedErr = err instanceof ApiError ? err : new ApiErrorFatal(`unknown error`);
    if (castedErr instanceof ApiErrorFatal || castedErr instanceof ApiErrorTransient) {
        await castedErr.logging();
    }
    return castedErr.intoResp(c);
});

export default apiApp;
