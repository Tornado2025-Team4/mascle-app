import { Hono } from 'hono';
import get from './get';

const gyms_gymId = new Hono();

gyms_gymId.get('/', get);

export default gyms_gymId;
