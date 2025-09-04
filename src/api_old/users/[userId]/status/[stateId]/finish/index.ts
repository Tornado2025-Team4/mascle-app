import { Hono } from 'hono';
import post from './post';

const users_userId_status_stateId_finish = new Hono();

users_userId_status_stateId_finish.post('/', post);

export default users_userId_status_stateId_finish;
