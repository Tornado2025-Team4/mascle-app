import { Hono } from 'hono';
import get from './get';
import patch from './patch';
import deleteHandler from './delete';
import app_users_userId_status_stateId_finish from './finish';

const users_userId_status_stateId = new Hono();

users_userId_status_stateId.get('/', get);
users_userId_status_stateId.patch('/', patch);
users_userId_status_stateId.delete('/', deleteHandler);
users_userId_status_stateId.route('/finish', app_users_userId_status_stateId_finish);

export default users_userId_status_stateId;
