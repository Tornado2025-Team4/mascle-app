import { Hono } from 'hono';
import del from './delete';
import { verifyJwtMW } from '../../../../_cmn/verify_jwt';
import { createSupabaseSessMW } from '../../../../_cmn/create_supasess';

const app_comments_commentid = new Hono();

app_comments_commentid.delete('/', verifyJwtMW, createSupabaseSessMW, del);

export default app_comments_commentid;