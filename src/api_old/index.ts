import { Hono } from 'hono';
import users from './users';
import { createSupabaseClientMW } from './_mw/create_supaclient';
import user_tags from './user_tags';
import user_training_intents from './user_training_intents';
import user_training_intent_body_parts from './user_training_intent_body_parts';
import user_notifications from './users/[userId]/notifications';
import gym_chains from './gym_chains';
import gyms from './gyms';
import user_posts from './user_posts';

const app = new Hono();

app.use('*', createSupabaseClientMW);

app.route('/users', users);
app.route('/user_tags', user_tags);
app.route('/user_training_intents', user_training_intents);
app.route('/user_training_intent_body_parts', user_training_intent_body_parts);
app.route('/user_notifications', user_notifications);
app.route('/gym_chains', gym_chains);
app.route('/gyms', gyms);
app.route('/user_posts', user_posts);

export default app;
