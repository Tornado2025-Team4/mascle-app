import { Hono } from 'hono';
import get from './get';
import users_userId_training_state_histories_trainingStateId from './[trainingStateId]';

const users_userId_training_state_histories = new Hono();

users_userId_training_state_histories.get('/', get);

users_userId_training_state_histories.route('/:trainingStateId', users_userId_training_state_histories_trainingStateId);

export default users_userId_training_state_histories;
