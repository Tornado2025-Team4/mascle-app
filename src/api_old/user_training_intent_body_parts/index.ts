import { Hono } from 'hono';
import get from './get';

const user_training_intent_body_parts = new Hono();

user_training_intent_body_parts.get('/', get);

export default user_training_intent_body_parts;
