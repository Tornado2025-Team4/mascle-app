import { Hono } from 'hono';

const app_hello = new Hono();

app_hello.get('/', (c) => c.json({ message: 'hello world' }));

export default app_hello;


