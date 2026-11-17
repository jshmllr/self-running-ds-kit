import path from 'node:path';

import type { ParsedGuidance } from './parseGuidance.ts';

/**
 * The Guidance check over a parsed set of guidance files. Pure: the caller supplies the parsed
 * files, the paths that exist, and the lines this change touched.
 */

/**
 * `error` fails the check, `warning` asks for attention, and `notice` is a problem that
 * predates this change: it sits only in files the change does not touch.
 */
export type Level = 'error' | 'warning' | 'notice';

export interface Finding {
  /** Repo-relative POSIX path. */
  file: string;
  line: number;
  level: Level;
  message: string;
}

/** 1-based, inclusive line range in the current version of a file. */
export interface LineRange {
  start: number;
  end: number;
}

export interface GuidanceInput {
  /** The guidance files, keyed by repo-relative POSIX path. */
  files: ReadonlyMap<string, ParsedGuidance>;
  /** Other Markdown files that guidance links to, parsed so their anchors can be checked. */
  targets?: ReadonlyMap<string, ParsedGuidance>;
  /** Every repo-relative file and directory path that exists. */
  existing: ReadonlySet<string>;
  /** Lines this change added or modified, per file. Sections outside them get no Source warning. */
  changed?: ReadonlyMap<string, readonly LineRange[]>;
  /**
   * Files whose problems are reported at full level. A finding that involves none of them
   * becomes a `notice`. A duplicated sentence is held to its lines instead: it is in scope when
   * one copy sits on a changed line, or anywhere in a scope file that has no `changed` entry.
   * Omit to report every finding at full level.
   */
  scope?: ReadonlySet<string>;
  /**
   * Directories (repo-relative, no trailing slash) whose files are copied from another
   * repository and kept word for word. Their wording is not ours to fix, so they get no Source
   * or duplicate findings; links and rule ids in them are still checked.
   */
  verbatim?: ReadonlySet<string>;
}

/** Sentences shorter than this are too generic to call duplicated guidance. */
export const MIN_DUPLICATE_WORDS = 12;

/** The repo-relative path a link in `from` points at; `null` when it leaves the repo. */
export function resolveLink(from: string, linkPath: string): string | null {
  if (!linkPath) return from;
  const joined = linkPath.startsWith('/')
    ? linkPath.slice(1)
    : path.posix.join(path.posix.dirname(from), linkPath);
  const resolved = path.posix.normalize(joined).replace(/\/+$/, '');
  if (resolved === '..' || resolved.startsWith('../')) return null;
  return resolved === '' ? '.' : resolved;
}

/**
 * Added or modified line ranges per file from `git diff -U0` output. A pure deletion marks the
 * line it follows, so deleting a section's Source line still counts as touching that section.
 */
export function changedRanges(diff: string): Map<string, LineRange[]> {
  const ranges = new Map<string, LineRange[]>();
  let file: string | null = null;
  for (const line of diff.split('\n')) {
    if (line.startsWith('+++ ')) {
      file = line === '+++ /dev/null' ? null : line.slice(4).replace(/^b\//, '');
      continue;
    }
    const hunk = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/.exec(line);
    if (!hunk || file === null) continue;
    const start = Math.max(Number(hunk[1]), 1);
    const count = hunk[2] === undefined ? 1 : Number(hunk[2]);
    const range = { start, end: count === 0 ? start : start + count - 1 };
    ranges.set(file, [...(ranges.get(file) ?? []), range]);
  }
  return ranges;
}

function where(file: string, line: number): string {
  return `${file}:${line}`;
}

export function checkGuidance(input: GuidanceInput): Finding[] {
  const { files, existing, scope } = input;
  const targets: ReadonlyMap<string, ParsedGuidance> = input.targets ?? new Map();
  const changed: ReadonlyMap<string, readonly LineRange[]> = input.changed ?? new Map();
  const verbatim = [...(input.verbatim ?? [])].map((dir) => `${dir}/`);
  const isVerbatim = (file: string) => verbatim.some((dir) => file.startsWith(dir));
  const findings: Finding[] = [];
  const report = (involved: string[], finding: Finding) => {
    const inScope = !scope || involved.some((file) => scope.has(file));
    findings.push(inScope ? finding : { ...finding, level: 'notice' });
  };

  for (const [file, parsed] of files) {
    for (const link of parsed.links) {
      const target = resolveLink(file, link.path);
      if (target === null || !existing.has(target)) {
        report([file], {
          file,
          line: link.line,
          level: 'error',
          message: `Broken link: ${link.target} points at a file that does not exist.`,
        });
        continue;
      }
      if (!link.anchor || !target.endsWith('.md')) continue;
      const anchored = files.get(target) ?? targets.get(target);
      if (!anchored) continue;
      const anchor = link.anchor.toLowerCase();
      if (!anchored.headings.some((heading) => heading.slug === anchor)) {
        report([file, target], {
          file,
          line: link.line,
          level: 'error',
          message: `Broken anchor: ${link.target} matches no heading in ${target}.`,
        });
      }
    }
  }

  const definitions = new Map<string, { file: string; line: number }[]>();
  for (const [file, parsed] of files) {
    for (const { id, line } of parsed.ruleDefinitions) {
      definitions.set(id, [...(definitions.get(id) ?? []), { file, line }]);
    }
  }
  for (const [id, places] of definitions) {
    if (places.length < 2) continue;
    const involved = places.map((place) => place.file);
    for (const place of places.slice(1)) {
      report(involved, {
        file: place.file,
        line: place.line,
        level: 'error',
        message: `rule/${id} is defined in more than one place (${places
          .map((p) => where(p.file, p.line))
          .join(', ')}). One home per rule: keep one definition and reference it elsewhere.`,
      });
    }
  }
  for (const [file, parsed] of files) {
    for (const { id, line } of parsed.ruleReferences) {
      if (definitions.has(id)) continue;
      report([file], {
        file,
        line,
        level: 'error',
        message: `rule/${id} is referenced but defined nowhere in the guidance.`,
      });
    }
  }

  for (const [file, ranges] of changed) {
    const parsed = files.get(file);
    if (!parsed || isVerbatim(file)) continue;
    for (const section of parsed.sections) {
      if (!section.hasRuleMarker || section.hasSource) continue;
      if (section.parent !== null && parsed.sections[section.parent].hasSource) continue;
      const touched = ranges.some(
        (range) => range.start <= section.end && range.end >= section.start
      );
      if (!touched) continue;
      report([file], {
        file,
        line: section.start,
        level: 'warning',
        message: `New or changed rule without a Source line: "${
          section.heading?.text ?? '(before the first heading)'
        }" states a rule (MUST, must, Never, Always, or a numbered list) but neither it nor its parent section has a Source: line.`,
      });
    }
  }

  // A file in scope without changed lines was named explicitly, so all of its sentences count.
  const touches = (file: string, start: number, end: number) => {
    const ranges = changed.get(file);
    if (!ranges) return scope?.has(file) ?? true;
    return ranges.some((range) => range.start <= end && range.end >= start);
  };
  const sentences = new Map<
    string,
    { file: string; line: number; touched: boolean; copied: boolean }[]
  >();
  for (const [file, parsed] of files) {
    const copied = isVerbatim(file);
    for (const sentence of parsed.sentences) {
      if (sentence.words < MIN_DUPLICATE_WORDS) continue;
      const places = sentences.get(sentence.normalized) ?? [];
      if (!places.some((place) => place.file === file)) {
        const touched = !copied && touches(file, sentence.line, sentence.end);
        places.push({ file, line: sentence.line, touched, copied });
      }
      sentences.set(sentence.normalized, places);
    }
  }
  for (const [sentence, places] of sentences) {
    // A sentence shared only between copied files is upstream's to deduplicate.
    if (places.length < 2 || places.every((place) => place.copied)) continue;
    const at = places.find((place) => place.touched);
    const own = at ?? places.find((place) => !place.copied) ?? places[0];
    const excerpt = sentence.split(' ').slice(0, 8).join(' ');
    const finding: Finding = {
      file: own.file,
      line: own.line,
      level: at ? 'warning' : 'notice',
      message: `Duplicated guidance: "${excerpt}…" appears in ${places
        .map((p) => where(p.file, p.line))
        .join(' and ')}. Keep one home and point to it from the other.`,
    };
    findings.push(finding);
  }

  return findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
}
