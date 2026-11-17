/**
 * Reads the structure the Guidance check needs out of one Markdown file: headings and their
 * anchors, relative links, `Source:` lines, `rule/<id>` definitions and references, and the
 * prose sentences used to spot duplicated guidance. Fenced code is skipped throughout, so a
 * rule-format example inside a code block defines nothing.
 */

export interface Heading {
  /** 1 for `#`, 6 for `######`. */
  level: number;
  /** Heading text with inline Markdown removed. */
  text: string;
  /** 1-based line number. */
  line: number;
  /** The anchor GitHub generates for the heading, including the `-1` suffix for repeats. */
  slug: string;
}

export interface Link {
  /** The raw link target, e.g. `CLAUDE.md#test-contract-quality`. */
  target: string;
  /** The path part of the target, URL-decoded; empty for a same-file `#anchor` link. */
  path: string;
  /** The anchor without `#`, or `null` when the target has none. */
  anchor: string | null;
  line: number;
}

/**
 * The lines one heading owns directly: from the heading up to the next heading of any level.
 * Index 0 is the preamble before the first heading.
 */
export interface Section {
  /** `null` for the preamble. */
  heading: Heading | null;
  /** First line, 1-based. */
  start: number;
  /** Last line, inclusive. */
  end: number;
  /** Index of the closest earlier section with a lower heading level; `null` for the preamble. */
  parent: number | null;
  /** The section has a `Source:` line, or a `Source` heading directly below it. */
  hasSource: boolean;
  /** The section states a rule: `MUST`, `must`, `Never`, `Always`, or a numbered list. */
  hasRuleMarker: boolean;
}

export interface RuleId {
  /** The id without the `rule/` prefix. */
  id: string;
  line: number;
}

export interface Sentence {
  /** Lower-cased words separated by single spaces, with punctuation and Markdown removed. */
  normalized: string;
  words: number;
  /** First line of the sentence. */
  line: number;
  /** Last line of the sentence. */
  end: number;
}

export interface ParsedGuidance {
  headings: Heading[];
  links: Link[];
  /** Line numbers of `Source:` lines and `Source` headings. */
  sources: number[];
  sections: Section[];
  /** A `rule/<id>` heading, or a bold or code `rule/<id>` term that opens a paragraph. */
  ruleDefinitions: RuleId[];
  /** Every other `rule/<id>` mention outside fenced code. */
  ruleReferences: RuleId[];
  sentences: Sentence[];
}

const ID = '[a-z0-9](?:[a-z0-9-]*[a-z0-9])?';
const FENCE = /^ {0,3}(`{3,}|~{3,})/;
const HEADING = /^ {0,3}(#{1,6})[ \t]+(.*?)(?:[ \t]+#+)?[ \t]*$/;
const INLINE_CODE = /(`+)(.+?)\1/g;
const INLINE_LINK = /!?\[([^\]]*)\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g;
const REFERENCE_DEFINITION = /^ {0,3}\[[^\]]+\]:\s*<?([^\s>]+)>?/;
const RULE_ID = new RegExp(`(?<![\\w/.-])rule/(${ID})`, 'g');
const RULE_HEADING = new RegExp(`^rule/(${ID})`);
const RULE_TERM = new RegExp(`^\\s*(?:\\*\\*\`?|\`)rule/(${ID})`);
const SOURCE_LINE = /(?:^|[\s(*_])(?:\*\*Source:\*\*|\*\*Source\*\*:|Source:)/;
const SOURCE_HEADING = /^sources?$/i;
const RULE_WORD = /\b(?:MUST|must|Never|Always)\b/;
const NUMBERED_ITEM = /^\s{0,3}\d+[.)]\s/;
const LIST_ITEM = /^\s*(?:[-*+]|\d+[.)])\s+/;
const FIELD = /^\s*\*\*[^*]+(?::\*\*|\*\*:)/;
const SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/** Blanks inline code spans so their contents are not read as Markdown. */
function withoutCode(line: string): string {
  return line.replace(INLINE_CODE, ' ');
}

function markupToText(text: string): string {
  return text
    .replace(INLINE_LINK, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/\*+/g, '')
    .replace(/(^|\W)_+|_+(?=\W|$)/g, '$1');
}

/** Renders inline Markdown down to its visible text; code spans keep their contents verbatim. */
function plainText(text: string): string {
  let result = '';
  let last = 0;
  for (const match of text.matchAll(INLINE_CODE)) {
    result += markupToText(text.slice(last, match.index)) + match[2];
    last = match.index + match[0].length;
  }
  return (result + markupToText(text.slice(last))).trim();
}

/**
 * The anchor GitHub generates for a heading: lower-cased, with every character that is not a
 * letter, mark, number, connector, space or hyphen dropped, and spaces turned into hyphens.
 */
export function slugify(text: string): string {
  return plainText(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\p{Pc} -]/gu, '')
    .replace(/ /g, '-');
}

function decode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function toLink(target: string, line: number): Link | null {
  if (SCHEME.test(target) || target.startsWith('//')) return null;
  const hash = target.indexOf('#');
  const rawPath = hash === -1 ? target : target.slice(0, hash);
  const anchor = hash === -1 ? null : decode(target.slice(hash + 1));
  return { target, path: decode(rawPath.replace(/\?.*$/, '')), anchor, line };
}

function normalize(sentence: string): string {
  return plainText(sentence)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Splits a paragraph into sentences, each tagged with the line it starts on. */
function sentencesOf(lines: string[], firstLine: number): Sentence[] {
  const text = lines.join('\n');
  const result: Sentence[] = [];
  let start = 0;
  const push = (end: number) => {
    const chunk = text.slice(start, end);
    const normalized = normalize(chunk);
    if (!normalized) return;
    const leadingSpace = chunk.length - chunk.trimStart().length;
    const line = firstLine + text.slice(0, start + leadingSpace).split('\n').length - 1;
    const lineCount = chunk.trim().split('\n').length;
    result.push({
      normalized,
      words: normalized.split(' ').length,
      line,
      end: line + lineCount - 1,
    });
  };
  for (const match of text.matchAll(/[.!?](?=\s|$)/g)) {
    push(match.index + 1);
    start = match.index + 1;
  }
  push(text.length);
  return result;
}

const TABLE_NAME_CELL = /^\s*\|\s*`([^`]+)`\s*\|/;

/**
 * The skill names in the third-party notices file: the first cell of every table row that
 * holds a code span. Header and separator rows have no code span, so they are skipped.
 */
export function parseThirdPartySkills(markdown: string): string[] {
  const names: string[] = [];
  for (const line of markdown.split(/\r?\n/)) {
    const match = TABLE_NAME_CELL.exec(line);
    if (match && !names.includes(match[1])) names.push(match[1]);
  }
  return names;
}

export function parseGuidance(markdown: string): ParsedGuidance {
  const lines = markdown.split(/\r?\n/);
  const parsed: ParsedGuidance = {
    headings: [],
    links: [],
    sources: [],
    sections: [
      {
        heading: null,
        start: 1,
        end: lines.length,
        parent: null,
        hasSource: false,
        hasRuleMarker: false,
      },
    ],
    ruleDefinitions: [],
    ruleReferences: [],
    sentences: [],
  };
  const { headings, links, sources, sections, ruleDefinitions, ruleReferences, sentences } = parsed;
  const slugs = new Map<string, number>();

  let fence: string | null = null;
  let paragraph: string[] = [];
  let paragraphLine = 0;
  let paragraphStart = true;

  const flush = () => {
    if (paragraph.length) sentences.push(...sentencesOf(paragraph, paragraphLine));
    paragraph = [];
  };

  lines.forEach((raw, index) => {
    const line = index + 1;
    const fenceMatch = FENCE.exec(raw);
    if (fence !== null) {
      if (fenceMatch && fenceMatch[1][0] === fence[0] && fenceMatch[1].length >= fence.length) {
        fence = null;
        paragraphStart = true;
      }
      return;
    }
    if (fenceMatch) {
      flush();
      fence = fenceMatch[1];
      return;
    }

    const headingMatch = HEADING.exec(raw);
    if (headingMatch) {
      flush();
      const level = headingMatch[1].length;
      const text = plainText(headingMatch[2]);
      const base = slugify(headingMatch[2]);
      let slug = base;
      while (slugs.has(slug)) {
        const count = (slugs.get(base) ?? 0) + 1;
        slugs.set(base, count);
        slug = `${base}-${count}`;
      }
      slugs.set(slug, 0);
      const heading: Heading = { level, text, line, slug };
      headings.push(heading);

      sections[sections.length - 1].end = line - 1;
      let parent = sections.length - 1;
      while (parent > 0 && (sections[parent].heading?.level ?? 0) >= level) {
        parent = sections[parent].parent ?? 0;
      }
      const isSource = SOURCE_HEADING.test(text);
      sections.push({
        heading,
        start: line,
        end: lines.length,
        parent,
        hasSource: isSource,
        hasRuleMarker: RULE_WORD.test(text),
      });
      if (isSource) {
        sources.push(line);
        sections[parent].hasSource = true;
      }

      const definition = RULE_HEADING.exec(text);
      if (definition) ruleDefinitions.push({ id: definition[1], line });
      for (const match of text.matchAll(RULE_ID)) {
        if (!definition || match.index !== 0) ruleReferences.push({ id: match[1], line });
      }
      paragraphStart = true;
      return;
    }

    const code = withoutCode(raw);
    const section = sections[sections.length - 1];
    if (SOURCE_LINE.test(code)) {
      sources.push(line);
      section.hasSource = true;
    }
    if (RULE_WORD.test(code) || NUMBERED_ITEM.test(raw)) section.hasRuleMarker = true;

    for (const match of code.matchAll(INLINE_LINK)) {
      const link = toLink(match[2], line);
      if (link) links.push(link);
    }
    const reference = REFERENCE_DEFINITION.exec(code);
    if (reference) {
      const link = toLink(reference[1], line);
      if (link) links.push(link);
    }

    const definition = paragraphStart ? RULE_TERM.exec(raw) : null;
    if (definition) ruleDefinitions.push({ id: definition[1], line });
    for (const match of raw.matchAll(RULE_ID)) {
      if (!definition || match.index >= definition[0].length) {
        ruleReferences.push({ id: match[1], line });
      }
    }

    const blank = raw.trim() === '';
    if (blank || reference || raw.trimStart().startsWith('|')) {
      flush();
    } else {
      if (LIST_ITEM.test(raw) || FIELD.test(raw)) flush();
      if (!paragraph.length) paragraphLine = line;
      paragraph.push(raw.replace(/^\s*>\s?/, '').replace(LIST_ITEM, ''));
    }
    paragraphStart = blank;
  });
  flush();

  return parsed;
}
