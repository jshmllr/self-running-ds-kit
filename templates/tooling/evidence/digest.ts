/**
 * Turns the week's bot review comments into the plain Markdown summary the Evidence digest
 * posts: counts per file, per cited rule or `CLAUDE.md` section, and per reviewer. Pure, so the
 * grouping is the same every run for the same comments.
 */

export interface EvidencePullRequest {
  number: number;
  title: string;
  /** Repo-relative paths the pull request changed. */
  files: string[];
}

export interface EvidenceComment {
  /** Number of the pull request the comment was left on. */
  pr: number;
  /** An inline review comment, a review summary, or a "Second opinion" summary comment. */
  kind: 'review-comment' | 'review' | 'summary';
  author: string;
  /** The file an inline comment is attached to; `null` for summaries. */
  path: string | null;
  url: string;
  body: string;
}

export interface Evidence {
  /** First day of the window, `YYYY-MM-DD`. */
  since: string;
  /** Day the digest ran, `YYYY-MM-DD`. */
  until: string;
  pullRequests: EvidencePullRequest[];
  comments: EvidenceComment[];
}

/** A `CLAUDE.md` heading a comment can cite by name or by anchor. */
export interface KnownSection {
  text: string;
  slug: string;
}

interface Group {
  key: string;
  comments: number;
  prs: Set<number>;
}

const RULE_ID = /(?<![\w/.-])rule\/([a-z0-9](?:[a-z0-9-]*[a-z0-9])?)/g;
const SECTION_SIGN = /CLAUDE\.md`?\s*§\s*([^\n]*)/g;
const ANCHOR = /CLAUDE\.md#([\w-]+)/g;
const UNKNOWN_SECTION = /^[^.,;:)\]`*_|]{1,60}?(?=\s*(?:[.,;:)\]`*_|]|$))/;
const EXCERPT_LENGTH = 200;
const EXCERPT_LIMIT = 60;
const NO_FILE = '(review summary, no file)';

/** The `rule/…` ids and `CLAUDE.md § …` sections a comment cites, each once. */
export function references(body: string, sections: readonly KnownSection[]): string[] {
  const found = new Set<string>();
  for (const match of body.matchAll(RULE_ID)) found.add(`rule/${match[1]}`);
  // A heading is also cited by its name without a trailing parenthetical: "§ Styling Rules".
  const names = sections
    .flatMap((section) => [
      { name: section.text, label: section.text },
      { name: section.text.replace(/\s*\([^)]*\)$/, ''), label: section.text },
    ])
    .sort((a, b) => b.name.length - a.name.length);
  for (const match of body.matchAll(SECTION_SIGN)) {
    const after = match[1].replace(/^[`*_\s]+/, '').toLowerCase();
    const known = names.find(({ name }) => after.startsWith(name.toLowerCase()));
    const name =
      known?.label ?? UNKNOWN_SECTION.exec(match[1].replace(/^[`*_\s]+/, ''))?.[0].trim();
    if (name) found.add(`CLAUDE.md § ${name}`);
  }
  for (const match of body.matchAll(ANCHOR)) {
    const known = sections.find((section) => section.slug === match[1].toLowerCase());
    found.add(known ? `CLAUDE.md § ${known.text}` : `CLAUDE.md#${match[1]}`);
  }
  return [...found];
}

function add(groups: Map<string, Group>, key: string, pr: number) {
  const group = groups.get(key) ?? { key, comments: 0, prs: new Set<number>() };
  group.comments += 1;
  group.prs.add(pr);
  groups.set(key, group);
}

function sorted(groups: Map<string, Group>): Group[] {
  return [...groups.values()].sort((a, b) => b.comments - a.comments || a.key.localeCompare(b.key));
}

function cell(value: string): string {
  return value.replace(/\|/g, '\\|');
}

function prList(prs: Set<number>): string {
  return [...prs]
    .sort((a, b) => a - b)
    .map((pr) => `#${pr}`)
    .join(', ');
}

function table(heading: string, groups: Group[], code: boolean): string[] {
  return [
    `| ${heading} | Comments | Pull requests |`,
    '| --- | --- | --- |',
    ...groups.map((group) => {
      const key = code && group.key !== NO_FILE ? `\`${group.key}\`` : group.key;
      return `| ${cell(key)} | ${group.comments} | ${prList(group.prs)} |`;
    }),
  ];
}

/**
 * One line of a comment body, safe to list inside the digest's `<details>`: HTML comments and
 * tags, quotes, heading markers and line breaks removed.
 */
export function excerpt(body: string): string {
  const flat = body
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\/?[a-z][^>]*>/gi, ' ')
    .replace(/^\s*>.*$/gm, '')
    .replace(/^\s*#{1,6}\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
  return flat.length > EXCERPT_LENGTH ? `${flat.slice(0, EXCERPT_LENGTH - 1).trimEnd()}…` : flat;
}

export function summarizeEvidence(
  evidence: Evidence,
  sections: readonly KnownSection[] = []
): string {
  const { since, until, pullRequests, comments } = evidence;
  const byFile = new Map<string, Group>();
  const byReference = new Map<string, Group>();
  const byAuthor = new Map<string, Group>();
  let uncited = 0;
  for (const comment of comments) {
    add(byFile, comment.path ?? NO_FILE, comment.pr);
    add(byAuthor, comment.author, comment.pr);
    const cited = references(comment.body, sections);
    if (!cited.length) uncited += 1;
    for (const reference of cited) add(byReference, reference, comment.pr);
  }
  const reviewed = new Set(comments.map((comment) => comment.pr)).size;

  const lines = [
    `# Review evidence, ${since} to ${until}`,
    '',
    `${comments.length} bot review comment${comments.length === 1 ? '' : 's'} on ${reviewed} of ${
      pullRequests.length
    } pull request${pullRequests.length === 1 ? '' : 's'} merged in this window.`,
    '',
  ];
  if (!comments.length) return `${lines.join('\n')}\n`;

  lines.push('## By file', '', ...table('File', sorted(byFile), true), '');
  lines.push('## By rule or CLAUDE.md section', '');
  if (byReference.size) {
    lines.push(...table('Reference', sorted(byReference), false), '');
  }
  lines.push(
    `${uncited} comment${uncited === 1 ? '' : 's'} cited no \`rule/…\` id or \`CLAUDE.md §\` section.`,
    ''
  );
  lines.push('## By reviewer', '', '| Reviewer | Comments |', '| --- | --- |');
  for (const group of sorted(byAuthor)) lines.push(`| ${cell(group.key)} | ${group.comments} |`);
  lines.push('');

  const ordered = [...comments].sort(
    (a, b) =>
      a.pr - b.pr || (a.path ?? '').localeCompare(b.path ?? '') || a.url.localeCompare(b.url)
  );
  lines.push('<details><summary>Comments</summary>', '');
  for (const comment of ordered.slice(0, EXCERPT_LIMIT)) {
    const where = comment.path ? ` \`${comment.path}\`` : '';
    lines.push(
      `- #${comment.pr}${where} (${comment.author}): ${excerpt(comment.body)} [link](${comment.url})`
    );
  }
  if (ordered.length > EXCERPT_LIMIT) {
    lines.push(
      `- …and ${ordered.length - EXCERPT_LIMIT} more in \`evidence/comments.json\` (the run's \`evidence\` artifact).`
    );
  }
  lines.push('', '</details>', '');
  return `${lines.join('\n')}\n`;
}
