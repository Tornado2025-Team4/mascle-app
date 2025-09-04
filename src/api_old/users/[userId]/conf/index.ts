import { Hono } from 'hono';
import users_userId_conf_frontendui from './frontend_ui';
import users_userId_conf_misc from './misc';
import users_userId_conf_privacy from './privacy';

const users_userId_conf = new Hono();

users_userId_conf.route('/frontend_ui', users_userId_conf_frontendui);
users_userId_conf.route('/privacy', users_userId_conf_privacy);
users_userId_conf.route('/misc', users_userId_conf_misc);

export default users_userId_conf;
