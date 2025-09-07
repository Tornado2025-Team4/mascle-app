import { Hono } from 'hono';
import users_userId_training_state_histories from './histories';

const users_userId_training_state = new Hono();

users_userId_training_state.route('histories', users_userId_training_state_histories);

export default users_userId_training_state;
