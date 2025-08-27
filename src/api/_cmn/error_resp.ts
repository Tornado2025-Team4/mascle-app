import { Context } from "hono";
import { ContentfulStatusCode } from "hono/utils/http-status";

export class ApiErrorResp {
    status: number;
    title: string;
    message: string;
    detail: string | null;

    constructor(
        status: number,
        title: string,
        message: string,
        detail: string | null = null,
    ) {
        this.status = status;
        this.title = title;
        this.message = message;
        this.detail = detail;
    }

    intoResp(c: Context) {
        return c.json({
            status: this.status,
            title: this.title,
            message: this.message
        }, this.status as ContentfulStatusCode);
    }
}

export class ApiErrorFatalResp extends ApiErrorResp {
    constructor(
        detail: string | null = null
    ) {
        super(500, 'InternalServerError', 'An unexpected error occurred.', detail);
    }
}

export class ApiErrorNotImplementedResp extends ApiErrorResp {
    constructor(
        resource: string,
        detail: string | null = null
    ) {
        super(501, 'NotImplemented', `The requested functionality ${resource} is not implemented.`, detail);
    }
}

export class ApiErrorTransientResp extends ApiErrorResp {
    constructor(
        detail: string | null = null
    ) {
        super(503, 'ServiceUnavailable', 'The service is temporarily unavailable.', detail);
    }
}

export class ApiErrorBadRequestResp extends ApiErrorResp {
    constructor(
        message: string,
        detail: string | null = null
    ) {
        super(400, 'Bad Request', message, detail);
    }
}

export class ApiErrorUnauthorizedResp extends ApiErrorResp {
    constructor(
        resource: string,
        detail: string | null = null
    ) {
        super(401, 'Unauthorized', `Unauthorized access to ${resource}.`, detail);
    }
}

export class ApiErrorForbiddenResp extends ApiErrorResp {
    constructor(
        resource: string,
        detail: string | null = null
    ) {
        super(403, 'Forbidden', `Forbidden access to ${resource}.`, detail);
    }
}

export class ApiErrorNotFoundResp extends ApiErrorResp {
    constructor(
        resource: string,
        detail: string | null = null
    ) {
        super(404, 'Not Found', `The requested resource '${resource}' was not found.`, detail);
    }
}

export class ApiErrorConflictResp extends ApiErrorResp {
    constructor(
        resource: string,
        detail: string | null = null
    ) {
        super(409, 'Conflict', `The requested resource '${resource}' conflicts with an existing resource.`, detail);
    }
}

export class ApiErrorUnprocessableResp extends ApiErrorResp {
    constructor(
        part: string,
        detail: string | null = null
    ) {
        super(422, 'Unprocessable', `The request could not be processed due to semantic errors in ${part}.`, detail);
    }
}
