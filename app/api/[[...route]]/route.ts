import { Hono } from "hono";
import { handle } from "hono/vercel";
import { logger } from "hono/logger";
import epson from "./epson";

const app = new Hono().basePath("/api");

app.use("*", logger());
app.route("/epson", epson);

export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
