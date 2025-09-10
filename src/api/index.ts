import { Hono } from 'hono';
import { createSupabaseClientMW } from './_cmn/create_supaclient';
import app_tags from './tags';
import app_intents from './intents';
import app_bodyparts from './bodyparts';
import app_gyms from './gyms';
import { ApiError, ApiErrorFatal, ApiErrorNotFound, ApiErrorTransient } from './_cmn/error';
import { getEnvMW } from './_cmn/get_env';
import { logger } from 'hono/logger';
import app_users from './users';
import app_gymchains from './gymchains';
import app_posts from './posts';
import app_dm from './dm';
//import app_auth from './auth';

const apiApp = new Hono().basePath("/api");

apiApp.use(
    '*',
    logger(),
    getEnvMW,
    createSupabaseClientMW,
);

apiApp.route('/tags', app_tags);
apiApp.route('/intents', app_intents);
apiApp.route('/bodyparts', app_bodyparts);
apiApp.route('/gyms', app_gyms);
apiApp.route('/gymchains', app_gymchains);
apiApp.route('/users', app_users);
apiApp.route('/posts', app_posts);
apiApp.route('/dm', app_dm);
//apiApp.route('/auth', app_auth); //*! 使ってなさそうなので一旦コメントアウトして様子見

apiApp.notFound(() => {
    throw new ApiErrorNotFound('API Endpoint');
});

apiApp.onError(async (err, c) => {
    if (err instanceof ApiError
        && (err instanceof ApiErrorFatal
            || err instanceof ApiErrorTransient)) {
        await err.logging();
    } else {
        console.error(err);
    }
    return (err instanceof ApiError ? err : new ApiErrorFatal(`unknown error`)).intoResp(c);
});

export default apiApp;