import { Context } from "vm";
import { ApiErrorFatal } from './error';

export const mustGetCtx = <T>(c: Context, key: string): T => {
    const value = c.get(key);
    if (value !== undefined && value !== null) {
        return value as T;
    } else {
        throw new ApiErrorFatal(`Context variable '${key}' is not set.(missing middleware chain?)`);
    }
};
