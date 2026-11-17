#!/usr/bin/env node
// Tells the agent to load a stack skill whenever planning starts.
// Fires on PreToolUse:EnterPlanMode unconditionally, and on UserPromptSubmit only when the
// prompt reads like planning work, so ordinary prompts pay no context cost.
//
// Node only: no jq, no grep. A JavaScript repo always has node on PATH, and a Windows
// Git Bash install often has neither jq nor GNU grep (`\b` is a GNU extension).
// Settings call it as `node .claude/hooks/load-planning-skill.js`.

'use strict';

// Which skill to load, and the one-line reminder. Edit both for your stack.
const SKILL = '{{PLANNING_SKILL}}';
const CONTEXT =
  `Planning detected. Before shaping the plan, invoke the \`${SKILL}\` skill (Skill tool) ` +
  'and apply it to the code the plan touches. CLAUDE.md wins on conflict; the list of its ' +
  'rules to skip in this repo is in AGENTS.md under "Load the planning skill". Read that ' +
  'section before applying the skill.';

const PLANNING = /\b(plan(s|ned|ning)?|roadmap|spec|contract|architect(ure)?|approach|brainstorm|design doc)\b/i;

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  raw += chunk;
});
process.stdin.on('end', () => {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    // Unreadable event: stay silent rather than fail the prompt.
    process.exit(0);
  }
  const event = input.hook_event_name || '';
  if (event === 'UserPromptSubmit' && !PLANNING.test(input.prompt || '')) {
    process.exit(0);
  }
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: event, additionalContext: CONTEXT },
    })
  );
});
