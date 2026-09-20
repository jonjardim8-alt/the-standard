// Cloudflare Worker — proxies the app's Quick Add bar to Anthropic's API.
//
// The Standard is a static site with its source fully public (GitHub
// Pages), so the Anthropic API key can never live in script.js — anyone
// could read it out of the page. This Worker holds the key server-side
// (as a Cloudflare secret, set via `wrangler secret put ANTHROPIC_API_KEY`
// or the dashboard, never committed here) and the app calls this Worker
// instead of Anthropic directly.
//
// Deploy: see the setup steps given alongside this file. In short —
// `wrangler deploy` from this folder, then set ANTHROPIC_API_KEY as a
// secret, then put the Worker's *.workers.dev URL into AI_WORKER_URL in
// script.js.

const ALLOWED_ORIGIN = 'https://jonjardim8-alt.github.io';

// v1 quick-add scope: task / daily habit / weekly habit / tomorrow's
// plan. Calendar events are deliberately left out for now — day-of-week
// vs. dated events and category selection add enough complexity to be
// its own follow-up once this is working end-to-end.
const SYSTEM_PROMPT = `You convert one short natural-language request into a single structured action for a personal productivity app called The Standard. Reply with ONLY a single JSON object — no other text, no markdown, no code fences — matching exactly one of these shapes:

{"action":"add_task","text":"...","category":"work|school|health|personal|faith","dueDate":"YYYY-MM-DD or null","priority":"low|normal|high"}
{"action":"add_daily_habit","name":"..."}
{"action":"add_weekly_habit","name":"...","target":<integer, default 3 if not specified>}
{"action":"add_tomorrow_block","text":"...","startTime":"HH:MM (24h)","endTime":"HH:MM (24h) or null"}
{"action":"unknown","reason":"one short sentence explaining why this couldn't be mapped"}

Rules:
- Pick "category" for add_task by best judgment from the request's content; default to "personal" if unclear.
- Pick "priority" by urgency language in the request ("asap", "urgent" -> high); default to "normal".
- Interpret relative dates/times ("tomorrow", "Friday", "next week") using the provided current date. dueDate must be an actual YYYY-MM-DD or null, never a relative phrase.
- add_tomorrow_block is for a specific time-blocked item on tomorrow's schedule (e.g. "put gym at 6pm tomorrow"); add_task is for a general to-do, with or without a due date.
- If the request is ambiguous about which action it is, or doesn't fit any shape, use "unknown".
- Output nothing but the raw JSON object — it is parsed directly by JSON.parse.`;

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }
    if (request.method !== 'POST') {
      return json({ action: 'unknown', reason: 'Method not allowed' }, 405);
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return json({ action: 'unknown', reason: 'Invalid request body' }, 400);
    }

    const text = (body && body.text ? String(body.text) : '').slice(0, 300).trim();
    if (!text) return json({ action: 'unknown', reason: 'Empty request' }, 400);

    const today = new Date().toISOString().slice(0, 10);

    let anthropicRes;
    try {
      anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-5',
          max_tokens: 300,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: `Today's date: ${today}\nRequest: ${text}` }],
        }),
      });
    } catch (e) {
      return json({ action: 'unknown', reason: 'Could not reach the AI service' }, 502);
    }

    if (!anthropicRes.ok) {
      return json({ action: 'unknown', reason: 'AI service error (' + anthropicRes.status + ')' }, 502);
    }

    const data = await anthropicRes.json();
    const raw = (data.content && data.content[0] && data.content[0].text) || '';
    let action;
    try {
      action = JSON.parse(raw);
    } catch (e) {
      return json({ action: 'unknown', reason: "Couldn't understand that — try rephrasing" }, 200);
    }

    return json(action, 200);
  },
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
  };
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json', ...corsHeaders() },
  });
}
