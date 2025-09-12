import { Hono } from 'hono';
import get from './get';
import { verifyJwtMWOptional } from '@/src/api/_cmn/verify_jwt';
import { createSupabaseSessMWOptional } from '@/src/api/_cmn/create_supasess';

const app_gyms_gymid_training_users = new Hono();

app_gyms_gymid_training_users.get('/', verifyJwtMWOptional, createSupabaseSessMWOptional, get);

export default app_gyms_gymid_training_users;
