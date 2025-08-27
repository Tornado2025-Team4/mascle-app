import { Hono } from 'hono';
import get from './get';

const gym_chains_gymChainId = new Hono();

gym_chains_gymChainId.get('/', get);

export default gym_chains_gymChainId;
