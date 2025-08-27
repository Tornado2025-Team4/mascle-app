import { Hono } from 'hono';
import get from './get';
import { verifyUserAuthnMW } from '../../../_mw/verify_user_authn';
import { createSupabaseSessionMW } from '../../../_mw/create_supasess';

const user_notifications = new Hono();

user_notifications.use('*', verifyUserAuthnMW, createSupabaseSessionMW)

user_notifications.get('/', get);

export default user_notifications;
