// src/routes/+page.server.js
import { env } from '$env/dynamic/private';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
  return {
    githubToken: env.github // server-only secret
  };
}
