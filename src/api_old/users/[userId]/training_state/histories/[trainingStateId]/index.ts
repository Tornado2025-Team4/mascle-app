import { Hono } from 'hono';
import get from './get';

const users_userId_training_state_histories_trainingStateId = new Hono();

users_userId_training_state_histories_trainingStateId.get('/', get);

export default users_userId_training_state_histories_trainingStateId;
