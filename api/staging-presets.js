/* LOCAL-MOD LM-0002: STAGING-ONLY shared design-system presets API.
 *
 * <!-- STAGING-ONLY: DESIGN SYSTEM PRESETS API — REMOVE BEFORE MERGING/DEPLOYING TO MAIN -->
 * Delete this file before merging to main (see STAGING-ONLY.md).
 * Backed by Vercel Storage (Upstash Redis / Vercel KV) on Preview deployments.
 * Hard-disabled when VERCEL_ENV === 'production'.
 * <!-- /STAGING-ONLY -->
 */

const REDIS_KEY = 'querent:staging:presets:v1';
const MAX_PRESETS = 40;
const MAX_BODY_BYTES = 16384;

function getRedisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '';
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '';
  if (!url || !token) return null;
  return { url: url.replace(/\/+$/, ''), token };
}

async function redisCmd(cfg, cmd) {
  const res = await fetch(cfg.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(cmd),
  });
  if (!res.ok) throw new Error('Storage request failed');
  const data = await res.json();
  return data.result;
}

async function readPresets(cfg) {
  const raw = await redisCmd(cfg, ['GET', REDIS_KEY]);
  if (!raw) return [];
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writePresets(cfg, list) {
  await redisCmd(cfg, ['SET', REDIS_KEY, JSON.stringify(list)]);
}

function cleanStr(v, max) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

function cleanHexMap(obj) {
  const out = {};
  if (!obj || typeof obj !== 'object') return out;
  for (const [k, v] of Object.entries(obj)) {
    if (/^--[a-z0-9-]+$/i.test(k) && typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v)) {
      out[k] = v;
    }
  }
  return out;
}

function cleanPreset(body) {
  if (!body || typeof body !== 'object') return null;
  const name = cleanStr(body.name, 40);
  if (!name) return null;
  const author = cleanStr(body.author, 32);
  const logo = cleanStr(body.logo, 20) || 'flat';

  const colorIn = body.color && typeof body.color === 'object' ? body.color : {};
  const color = {
    source: cleanStr(colorIn.source, 40) || 'Official Querent',
    anchorHex: typeof colorIn.anchorHex === 'string' && /^#[0-9a-f]{6}$/i.test(colorIn.anchorHex) ? colorIn.anchorHex : null,
    state: cleanHexMap(colorIn.state),
    manual: Array.isArray(colorIn.manual) ? colorIn.manual.filter((k) => typeof k === 'string' && /^--[a-z0-9-]+$/i.test(k)).slice(0, 32) : [],
    btnGradOn: Boolean(colorIn.btnGradOn),
  };

  const typeIn = body.typography && typeof body.typography === 'object' ? body.typography : {};
  const typeVars = {};
  if (typeIn.vars && typeof typeIn.vars === 'object') {
    for (const [k, v] of Object.entries(typeIn.vars)) {
      if (/^--t-[a-z0-9-]+$/i.test(k) && typeof v === 'string' && v.length <= 32) typeVars[k] = v;
    }
  }
  const typography = {
    preset: cleanStr(typeIn.preset, 24) || 'sleek',
    display: cleanStr(typeIn.display, 40) || 'Bricolage Grotesque',
    body: cleanStr(typeIn.body, 40) || 'Source Sans 3',
    vars: typeVars,
  };

  const shapeIn = body.shape && typeof body.shape === 'object' ? body.shape : {};
  const edge = {};
  if (shapeIn.edge && typeof shapeIn.edge === 'object') {
    for (const [fam, cfg] of Object.entries(shapeIn.edge)) {
      if (!/^[a-z-]+$/.test(fam) || !cfg || typeof cfg !== 'object') continue;
      const cleanFam = {};
      for (const [k, v] of Object.entries(cfg)) {
        if (['r', 'edge', 'k', 'bw', 'blur', 'pad', 'gap'].includes(k) && typeof v === 'number' && Number.isFinite(v)) {
          cleanFam[k] = v;
        } else if (['bc', 'surf'].includes(k) && typeof v === 'string' && /^[a-z]+$/.test(v)) {
          cleanFam[k] = v;
        }
      }
      if (Object.keys(cleanFam).length) edge[fam] = cleanFam;
    }
  }
  const shape = {
    preset: cleanStr(shapeIn.preset, 24) || 'default',
    iconStroke: typeof shapeIn.iconStroke === 'number' && Number.isFinite(shapeIn.iconStroke) ? shapeIn.iconStroke : null,
    edge,
  };

  const swatches = Array.isArray(body.swatches)
    ? body.swatches.filter((c) => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c)).slice(0, 6)
    : [];

  return {
    id: cleanStr(body.id, 48) || ('p-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6)),
    name,
    author,
    updatedAt: new Date().toISOString(),
    swatches,
    logo,
    color,
    typography,
    shape,
  };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (process.env.VERCEL_ENV === 'production') {
    return res.status(404).json({ error: 'Not available in production' });
  }

  const cfg = getRedisConfig();
  if (!cfg) {
    if (req.method === 'GET') {
      return res.status(200).json({ shared: false, presets: [] });
    }
    return res.status(503).json({ shared: false, error: 'Vercel Storage (Upstash Redis) is not connected to Preview yet.' });
  }

  try {
    if (req.method === 'GET') {
      const presets = await readPresets(cfg);
      return res.status(200).json({ shared: true, presets });
    }

    if (req.method === 'POST') {
      const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
      if (rawBody.length > MAX_BODY_BYTES) {
        return res.status(413).json({ error: 'Preset payload too large' });
      }
      const parsed = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const preset = cleanPreset(parsed);
      if (!preset) {
        return res.status(400).json({ error: 'Invalid preset name or payload' });
      }
      const list = await readPresets(cfg);
      const lower = preset.name.toLowerCase();
      const filtered = list.filter((p) => p && p.id !== preset.id && String(p.name || '').toLowerCase() !== lower);
      const next = [preset, ...filtered].slice(0, MAX_PRESETS);
      await writePresets(cfg, next);
      return res.status(200).json({ shared: true, preset, presets: next });
    }

    if (req.method === 'DELETE') {
      const id = cleanStr(req.query && req.query.id, 48);
      if (!id) return res.status(400).json({ error: 'Missing preset id' });
      const list = await readPresets(cfg);
      const next = list.filter((p) => p && p.id !== id);
      await writePresets(cfg, next);
      return res.status(200).json({ shared: true, presets: next });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch {
    return res.status(500).json({ shared: true, error: 'Failed to sync staging presets' });
  }
}
