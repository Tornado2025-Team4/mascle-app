import { Context } from "hono";
import { ApiErrorBadRequestResp, ApiErrorConflictResp, ApiErrorFatalResp, ApiErrorForbiddenResp, ApiErrorNotFoundResp, ApiErrorResp, ApiErrorTransientResp, ApiErrorUnauthorizedResp, ApiErrorUnprocessableResp } from "./error_resp";

export class ApiError extends Error {
    name: string;
    detail: string | null;
    resp: ApiErrorResp | null;

    constructor(
        name: string = 'ApiError',
        detail: string | null = null,
        resp: ApiErrorResp | null = null
    ) {
        super();
        this.name = name;
        this.detail = detail;
        this.resp = resp;
    }

    intoResp(c: Context) {
        return (this.resp || new ApiErrorFatalResp()).intoResp(c);
    }

    intoString() {
        return `[${new Date().toISOString()}] ${this.name}: ${this.detail} ${this.stack ? `\n${this.stack}` : ''}`;
    }

    async logging() {
        console.error(`[Error] ${this.intoString()}`);
        return this;
    }
}

export class ApiErrorFatal extends ApiError {
    constructor(
        detail: string | null = null
    ) {
        super('ApiErrorFatal', detail, new ApiErrorFatalResp());
    }
}

export class ApiErrorTransient extends ApiError {
    constructor(
        detail: string | null = null
    ) {
        super('ApiErrorTransient', detail, new ApiErrorTransientResp());
    }
}

export class ApiErrorBadRequest extends ApiError {
    constructor(
        message: string,
        detail: string | null = null
    ) {
        super('ApiErrorBadRequest', message + (detail ? `: (${detail})` : ''), new ApiErrorBadRequestResp(message, detail));
    }
}

export class ApiErrorUnauthorized extends ApiError {
    constructor(
        resource: string,
        detail: string | null = null
    ) {
        super('ApiErrorUnauthorized', resource + (detail ? `: (${detail})` : ''), new ApiErrorUnauthorizedResp(resource, detail));
    }
}

export class ApiErrorForbidden extends ApiError {
    constructor(
        resource: string,
        detail: string | null = null
    ) {
        super('ApiErrorForbidden', resource + (detail ? `: (${detail})` : ''), new ApiErrorForbiddenResp(resource, detail));
    }
}

export class ApiErrorNotFound extends ApiError {
    constructor(
        resource: string,
        detail: string | null = null
    ) {
        super('ApiErrorNotFound', resource + (detail ? `: (${detail})` : ''), new ApiErrorNotFoundResp(resource, detail));
    }
}

export class ApiErrorConflict extends ApiError {
    constructor(
        resource: string,
        detail: string | null = null
    ) {
        super('ApiErrorConflict', resource + (detail ? `: (${detail})` : ''), new ApiErrorConflictResp(resource, detail));
    }
}

export class ApiErrorUnprocessable extends ApiError {
    constructor(
        part: string,
        detail: string | null = null
    ) {
        super('ApiErrorUnprocessable', part + (detail ? `: (${detail})` : ''), new ApiErrorUnprocessableResp(part, detail));
    }
}
