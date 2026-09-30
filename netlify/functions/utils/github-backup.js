/**
 * github-backup.js
 * Commits the content backup (utils/backup-file.js) to the site's own
 * GitHub repo through the Contents API — the one deliberate exception to
 * "GitHub holds only site code" (CLAUDE.md, Backup). Best-effort by
 * design: callers wrap this so a failure never blocks or fails a save.
 *
 * The whole file is regenerated from Blobs on every commit rather than
 * patched row-by-row, so two near-simultaneous saves can't clobber each
 * other's rows and a missed commit self-heals on the next one.
 *
 * Commits go to a dedicated branch (default `content-backup`), not main:
 * every save would otherwise (a) trigger a Netlify production rebuild and
 * (b) put bot commits on main that make the developer's next `git push`
 * fail as non-fast-forward. The message also carries `[skip netlify]` in
 * case branch deploys are ever enabled. The branch is created from the
 * repo's default branch on first use.
 *
 * Env vars (see .env.example): GITHUB_BACKUP_TOKEN (fine-grained PAT,
 * Contents: read & write on this one repo), and optionally
 * GITHUB_BACKUP_REPO / GITHUB_BACKUP_BRANCH / GITHUB_BACKUP_PATH.
 */
const { buildBackupCsv } = require("./backup-file");

const API = "https://api.github.com";
// One overall budget for the whole commit (several sequential API calls),
// not per call — the Function itself has a short execution limit.
const TIMEOUT_MS = 7000;

function config() {
  const token = process.env.GITHUB_BACKUP_TOKEN;
  if (!token) throw new Error("GITHUB_BACKUP_TOKEN is not configured.");
  return {
    token,
    repo: process.env.GITHUB_BACKUP_REPO || "Barnaskoli-Karsness-skoli/barnaskolikarsness",
    branch: process.env.GITHUB_BACKUP_BRANCH || "content-backup",
    path: process.env.GITHUB_BACKUP_PATH || "backup/content-backup.csv"
  };
}

function gh(cfg, method, url, body) {
  return fetch(API + url, {
    method,
    signal: cfg.signal,
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      "User-Agent": "barnaskoli-karsness-backup"
    },
    body: body ? JSON.stringify(body) : undefined
  });
}

// Makes sure the backup branch exists, creating it from the default branch.
async function ensureBranch(cfg) {
  const ref = await gh(cfg, "GET", `/repos/${cfg.repo}/git/ref/heads/${encodeURIComponent(cfg.branch)}`);
  if (ref.ok) return;
  if (ref.status !== 404) throw new Error(`GitHub branch lookup failed: HTTP ${ref.status}`);

  const repo = await gh(cfg, "GET", `/repos/${cfg.repo}`);
  if (!repo.ok) throw new Error(`GitHub repo lookup failed: HTTP ${repo.status}`);
  const { default_branch } = await repo.json();
  const base = await gh(cfg, "GET", `/repos/${cfg.repo}/git/ref/heads/${encodeURIComponent(default_branch)}`);
  if (!base.ok) throw new Error(`GitHub default-branch lookup failed: HTTP ${base.status}`);
  const { object } = await base.json();

  const created = await gh(cfg, "POST", `/repos/${cfg.repo}/git/refs`, {
    ref: `refs/heads/${cfg.branch}`,
    sha: object.sha
  });
  // 422 = a concurrent save created it first — fine.
  if (!created.ok && created.status !== 422) throw new Error(`GitHub branch create failed: HTTP ${created.status}`);
}

async function currentSha(cfg) {
  const r = await gh(cfg, "GET", `/repos/${cfg.repo}/contents/${cfg.path}?ref=${encodeURIComponent(cfg.branch)}`);
  if (r.status === 404) return undefined;
  if (!r.ok) throw new Error(`GitHub file lookup failed: HTTP ${r.status}`);
  return (await r.json()).sha;
}

function putFile(cfg, csv, message, sha) {
  return gh(cfg, "PUT", `/repos/${cfg.repo}/contents/${cfg.path}`, {
    message,
    branch: cfg.branch,
    content: Buffer.from(csv, "utf8").toString("base64"),
    sha
  });
}

/**
 * Regenerates the backup from current Blob content and commits it.
 * `reason` is a short string for the commit message, e.g. "page fristund-reglur".
 * Throws on any failure — the caller decides what to do (log + alert).
 */
async function commitContentBackup(reason) {
  const cfg = { ...config(), signal: AbortSignal.timeout(TIMEOUT_MS) };
  const { csv } = await buildBackupCsv();
  const message = `Content backup: ${reason} [skip netlify]`;

  await ensureBranch(cfg);
  let response = await putFile(cfg, csv, message, await currentSha(cfg));
  if (response.status === 409 || response.status === 422) {
    // Stale sha from a concurrent save — refetch once and retry.
    response = await putFile(cfg, csv, message, await currentSha(cfg));
  }
  if (!response.ok) throw new Error(`GitHub commit failed: HTTP ${response.status}`);
}

module.exports = { commitContentBackup };
