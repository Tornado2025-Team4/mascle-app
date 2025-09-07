import { Hono } from 'hono';
import get from './get';

const users_userId_conf_frontendui = new Hono();

users_userId_conf_frontendui.get('/', get);

export default users_userId_conf_frontendui;
