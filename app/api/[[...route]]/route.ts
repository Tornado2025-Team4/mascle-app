
import { Hono } from "hono";
import { handle } from "hono/vercel";
import { logger } from "hono/logger";
import api from '../../../src/api/index';

const app = new Hono().basePath("/api");
app.use("*", logger());
app.route("/", api);

export const GET = handle(app);
export const HEAD = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
export const OPTIONS = handle(app);
