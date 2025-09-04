import { Hono } from 'hono';
import get from './get';

const users_userId_conf_privacy_type = new Hono();

users_userId_conf_privacy_type.get('/', get);

export default users_userId_conf_privacy_type;
