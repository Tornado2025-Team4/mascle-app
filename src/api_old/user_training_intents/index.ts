import { Hono } from 'hono';
import get from './get';

const user_training_intents = new Hono();

user_training_intents.get('/', get);

export default user_training_intents;
