import { Hono } from 'hono';
import users_userId_conf_privacy_type from './[type]';


const users_userId_conf_privacy = new Hono();

users_userId_conf_privacy.route('/:type', users_userId_conf_privacy_type);

export default users_userId_conf_privacy;
