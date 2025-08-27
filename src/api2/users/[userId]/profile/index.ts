import { Hono } from 'hono';
import get from './get';

const users_userId_profile = new Hono();

users_userId_profile.get('/', get);

export default users_userId_profile;
