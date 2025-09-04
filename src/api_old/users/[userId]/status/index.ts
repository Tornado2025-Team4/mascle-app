import { Hono } from 'hono';
import get from './get';
import post from './post';
import app_users_userId_status_stateId from './[stateId]';

const users_userId_status = new Hono();

users_userId_status.get('/', get);
users_userId_status.post('/', post);

users_userId_status.route('/:stateId', app_users_userId_status_stateId);

export default users_userId_status;
