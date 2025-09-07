import { Hono } from 'hono';
import get from './get';
import users_userId from './[userId]';
import { verifyUserAuthnMW } from '../_mw/verify_user_authn';
import { createSupabaseSessionMW } from '../_mw/create_supasess';

const users = new Hono();

users.use('*', verifyUserAuthnMW, createSupabaseSessionMW);

users.get('/', get);

users.route('/:userId', users_userId);

export default users;
