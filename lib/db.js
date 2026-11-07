import { neon } from '@neondatabase/serverless';
// Created lazily so the build does not fail when DATABASE_URL is not available at import time.
export const sql = (strings, ...values) => neon(process.env.DATABASE_URL)(strings, ...values);
