import { Context } from "hono";
import { ContentfulStatusCode } from "hono/utils/http-status";

export async function FatalErrorHandler(c: Context, e: unknown, addInfo?: string) {
    const stringE =
        typeof e === "object" && e !== null && "toString" in e && typeof e.toString === "function"
            ? e.toString()
            : String(e);
    console.error(`[ERROR] ${stringE} (${addInfo})`);
}

export class ApiError extends Error {
    public readonly kind: string;
    public readonly message: string;
    public readonly detail: string | null;
    public readonly statusCode: number;

    constructor(
        kind: string,
        message: string,
        detail: string | null,
        statusCode: number
    ) {
        super(message);
        this.name = "ApiError";
        this.kind = kind;
        this.message = message;
        this.detail = detail;
        this.statusCode = statusCode;
    }

    into_resp(ctx: Context) {
        return ctx.json({
            error: {
                kind: this.kind,
                message: this.message,
                detail: this.detail
            },
        }, this.statusCode as ContentfulStatusCode);
    }
}

export class ApiErrorBadRequest extends ApiError {
    constructor(message: string, detail: string | null = null) {
        super("BadRequest", message, detail, 400);
        this.name = "ApiErrorBadRequest";
    }
}

export class ApiErrorUnauthorized extends ApiError {
    constructor(detail: string | null = null) {
        super("Unauthorized", "You are not authorized to access this resource.", detail, 401);
        this.name = "ApiErrorUnauthorized";
    }
}

export class ApiErrorForbidden extends ApiError {
    constructor(detail: string | null = null) {
        super("Forbidden", "You do not have permission to access this resource.", detail, 403);
        this.name = "ApiErrorForbidden";
    }
}

export class ApiErrorNotFound extends ApiError {
    constructor(resource: string, detail: string | null = null) {
        super("NotFound", `The requested resource '${resource}' was not found.`, detail, 404);
        this.name = "ApiErrorNotFound";
    }
}

export class ApiErrorConflict extends ApiError {
    constructor(resource: string, detail: string | null = null) {
        super("Conflict", `The requested resource '${resource}' conflicts with an existing resource.`, detail, 409);
        this.name = "ApiErrorConflict";
    }
}

export class ApiErrorUnprocessableEntity extends ApiError {
    constructor(part: string, detail: string | null = null) {
        super("UnprocessableEntity", `The request was well-formed but was unable to be followed due to semantic errors in the ${part}.`, detail, 422);
        this.name = "ApiErrorUnprocessableEntity";
    }
}

export class ApiErrorTooManyRequests extends ApiError {
    constructor(detail: string | null = null) {
        super("TooManyRequests", "You have exceeded the rate limit.", detail, 429);
        this.name = "ApiErrorTooManyRequests";
    }
}

export class ApiErrorInternalServerError extends ApiError {
    constructor() {
        super("InternalServerError", "An unexpected error occurred.", null, 500);
        this.name = "ApiErrorInternalServerError";
    }
}


export class ApiErrorNotImplemented extends ApiError {
    constructor(resource: string, detail: string | null = null) {
        super("NotImplemented", `The requested functionality ${resource} is not implemented.`, detail, 501);
        this.name = "ApiErrorNotImplemented";
    }
}

export class ApiErrorServiceUnavailable extends ApiError {
    constructor() {
        super("ServiceUnavailable", "The service is temporarily unavailable.", null, 503);
        this.name = "ApiErrorServiceUnavailable";
    }
}