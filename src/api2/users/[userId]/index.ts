import { Hono } from 'hono';
import get from './get';
import { resolveUserIdMW } from './_mw/userid_resolve';
import users_userId_profile from './profile';
import users_userId_conf from './conf';
import users_userId_training_state from './training_state';
import users_userId_follows from './follows';
import users_userId_followers from './followers';

const users_userId = new Hono();

users_userId.use('*', resolveUserIdMW);

users_userId.get('/', get);

users_userId.route('/profile', users_userId_profile);
users_userId.route('/conf', users_userId_conf);
users_userId.route('/training_state', users_userId_training_state);
users_userId.route('/follows', users_userId_follows);
users_userId.route('/followers', users_userId_followers);

export default users_userId;
