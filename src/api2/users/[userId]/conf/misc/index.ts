import { Hono } from 'hono';
import get from './get';

const users_userId_conf_misc = new Hono();

users_userId_conf_misc.get('/', get);

export default users_userId_conf_misc;
