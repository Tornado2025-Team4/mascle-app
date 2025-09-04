import { Hono } from 'hono';
import get from './get';
import gyms_gymId from './[gymId]';

const gyms = new Hono();

gyms.get('/', get);

gyms.route('/:gymId', gyms_gymId);

export default gyms;
