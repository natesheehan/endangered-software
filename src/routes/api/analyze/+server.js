import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';

export async function GET() {
  return json({ message: 'POST { owner, repo } to analyze a repository' });
}

export async function POST({ request }) {
  if (!env.github) {
    return json({ error: 'Missing env var: github (check .env and restart dev server)' }, { status: 500 });
  }

  const { owner, repo } = await request.json();

  if (!owner || !repo) {
    return json({ error: 'Missing owner/repo in request body' }, { status: 400 });
  }

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const query = `
    query RepoHealth($owner: String!, $repo: String!, $since: GitTimestamp!) {
      repository(owner: $owner, name: $repo) {
        name
        nameWithOwner
        description
        createdAt
        pushedAt
        stargazerCount
        forkCount
        issues(first: 100, states: OPEN) {
          totalCount
          nodes { createdAt }
        }
        closedIssues: issues(first: 100, states: CLOSED) {
          totalCount
        }
        defaultBranchRef {
          target {
            ... on Commit {
              history(since: $since, first: 100) {
                totalCount
                nodes { author { user { login } } }
              }
            }
          }
        }
      }
    }
  `;

  const ghRes = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.github}`
    },
    body: JSON.stringify({
      query,
      variables: { owner, repo, since: oneYearAgo.toISOString() }
    })
  });

  const ghJson = await ghRes.json();

  // Surface GitHub errors (this is the key)
  if (!ghRes.ok || ghJson.errors?.length || !ghJson.data?.repository) {
    return json(
      {
        error: 'GitHub API error',
        httpStatus: ghRes.status,
        githubErrors: ghJson.errors ?? null,
        // helpful hint:
        hint:
          ghRes.status === 401 ? 'Bad token' :
          ghRes.status === 403 ? 'Token lacks access / rate-limited' :
          'Repo not found OR token has no access'
      },
      { status: 400 }
    );
  }

  return json(ghJson.data.repository);
}
