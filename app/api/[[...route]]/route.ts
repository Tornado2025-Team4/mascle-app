
import { Hono } from "hono";
import { handle } from "hono/vercel";
import { logger } from "hono/logger";
import apiApp from "@/src/api";

export const GET = handle(apiApp);
export const HEAD = handle(apiApp);
export const POST = handle(apiApp);
export const PUT = handle(apiApp);
export const PATCH = handle(apiApp);
export const DELETE = handle(apiApp);
export const OPTIONS = handle(apiApp);
