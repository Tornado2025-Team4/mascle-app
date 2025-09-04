import { Hono } from 'hono';
import get from './get';
import gym_chains_gymChainId from './[gymChainId]';

const gym_chains = new Hono();

gym_chains.get('/', get);

gym_chains.route('/:gymChainId', gym_chains_gymChainId);

export default gym_chains;
