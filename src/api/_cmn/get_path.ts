import { Context } from "vm";
import { ApiErrorFatal } from './error';

export const mustGetPath = (c: Context, name: string): string => {
    const value = c.req.param(name);
    if (value !== undefined && value !== null) {
        return value as string;
    } else {
        throw new ApiErrorFatal(`Path element '${name}' is not set.(missing middleware chain?)`);
    }
};
