import { mustGetCtx } from "@/src/api/_cmn/get_ctx"
import { MiddlewareHandler } from "hono"
import { UserIdInfo } from "./userid_resolve";
import { ApiErrorForbidden } from "@/src/api/_cmn/error";

export const rejectSpecByAnonMW: MiddlewareHandler = async (c, next) => {
    const userIdInfo = mustGetCtx<UserIdInfo>(c, 'userIdInfo');
    if (userIdInfo.specByAnon) {
        throw new ApiErrorForbidden('User', 'Can not access by anon id')
    }
    await next();
    return;
}