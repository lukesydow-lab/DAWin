#!/usr/bin/env node
/**
 * create-figma-tokens.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Creates the GDAW design token variable collection in a Figma file using the
 * Figma REST API. No external npm dependencies — only Node.js built-in `https`.
 *
 * ── HOW TO GET A FIGMA PERSONAL ACCESS TOKEN ─────────────────────────────────
 *  1. Open Figma in the browser and log in.
 *  2. Click your avatar (top-left) → Settings → Security → Personal access tokens.
 *  3. Click "Generate new token".
 *  4. Give it a name (e.g. "gdaw-token-script").
 *  5. Under Scopes, enable:
 *       • File content  → Read & Write
 *       • Variables     → Read & Write   ← this one is required
 *  6. Set an expiry that suits you, then click Generate.
 *  7. Copy the token immediately — Figma will not show it again.
 *
 * ── HOW TO RUN ───────────────────────────────────────────────────────────────
 *  FIGMA_TOKEN=your_token_here node scripts/create-figma-tokens.js
 *
 * ── WHAT IT DOES ─────────────────────────────────────────────────────────────
 *  In a single atomic POST request it:
 *    1. Creates a variable collection "GDAW Tokens" with one mode "Dark".
 *    2. Creates all 13 COLOR variables in that collection.
 *    3. Sets the Dark-mode value for each variable.
 *
 *  If anything is invalid Figma returns 400 and nothing is persisted.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import https from 'https';

// ── Config ────────────────────────────────────────────────────────────────────

const FILE_KEY = 'o4IccZFYzEvsHe3dVcco7X';
const TOKEN    = process.env.FIGMA_TOKEN;

if (!TOKEN) {
  console.error(
    '[error] FIGMA_TOKEN environment variable is not set.\n' +
    '        Run: FIGMA_TOKEN=your_token_here node scripts/create-figma-tokens.js'
  );
  process.exit(1);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function hexToFigmaColor(hex, a = 1) {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) {
    throw new Error(`Invalid hex color: "${hex}" — must be exactly 6 hex digits.`);
  }
  return {
    r: parseInt(clean.slice(0, 2), 16) / 255,
    g: parseInt(clean.slice(2, 4), 16) / 255,
    b: parseInt(clean.slice(4, 6), 16) / 255,
    a,
  };
}

function figmaPost(path, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const options = {
      hostname: 'api.figma.com',
      path,
      method: 'POST',
      headers: {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'X-Figma-Token':  TOKEN,
      },
    };

    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(raw);
        } catch {
          return reject(new Error(`Non-JSON response (HTTP ${res.statusCode}):\n${raw}`));
        }

        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(parsed);
        } else {
          reject(
            new Error(
              `Figma API error HTTP ${res.statusCode}:\n` +
              JSON.stringify(parsed, null, 2)
            )
          );
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ── Token definitions ─────────────────────────────────────────────────────────
//   Matches the C object in src/App.tsx exactly.
//   [ name, hex, alpha? ]

const TOKEN_DEFS = [
  ['bg',          '#0A0A0F'],
  ['surface',     '#111118'],
  ['elevated',    '#1A1A24'],
  ['accent',      '#6B5CE7'],
  ['danger',      '#E94560'],
  ['success',     '#1D9E75'],
  ['textPri',     '#F0F0F5'],
  ['textSec',     '#888899'],
  ['control',     '#2A2A38'],
  ['border',      '#1E1E28'],
  ['well',        '#0D0D14'],
  ['warn',        '#F5A623'],
  ['accentMuted', '#6B5CE7', 0.13],
];

// ── Temporary IDs (resolved by Figma to real IDs before persisting) ───────────

const TMP_COLLECTION_ID = 'gdaw_collection';
const TMP_MODE_ID       = 'gdaw_mode_dark';

// ── Build payload ─────────────────────────────────────────────────────────────

const variableCollections = [
  {
    action:        'CREATE',
    id:            TMP_COLLECTION_ID,
    name:          'GDAW Tokens',
    initialModeId: TMP_MODE_ID,
  },
];

const variableModes = [
  {
    action:               'UPDATE',
    id:                   TMP_MODE_ID,
    name:                 'Dark',
    variableCollectionId: TMP_COLLECTION_ID,
  },
];

const variables        = [];
const variableModeValues = [];

for (const def of TOKEN_DEFS) {
  const [tokenName, hex, alpha = 1] = def;
  const tmpVarId = `gdaw_var_${tokenName}`;

  variables.push({
    action:               'CREATE',
    id:                   tmpVarId,
    name:                 tokenName,
    variableCollectionId: TMP_COLLECTION_ID,
    resolvedType:         'COLOR',
  });

  variableModeValues.push({
    variableId: tmpVarId,
    modeId:     TMP_MODE_ID,
    value:      hexToFigmaColor(hex, alpha),
  });
}

const requestBody = {
  variableCollections,
  variableModes,
  variables,
  variableModeValues,
};

// ── Run ───────────────────────────────────────────────────────────────────────

(async () => {
  console.log(`\nPosting ${TOKEN_DEFS.length} color variables to file ${FILE_KEY}...`);
  console.log('Collection : GDAW Tokens');
  console.log('Mode       : Dark\n');

  try {
    const result = await figmaPost(`/v1/files/${FILE_KEY}/variables`, requestBody);

    if (result.error === true) {
      console.error('[error] Figma reported an error in the response body:');
      console.error(JSON.stringify(result, null, 2));
      process.exit(1);
    }

    console.log('[success] Variable collection created.\n');

    const ids = result.variableIds ?? {};
    console.log('Created variables:');
    for (const def of TOKEN_DEFS) {
      const [tokenName, hex, alpha = 1] = def;
      const tmpId    = `gdaw_var_${tokenName}`;
      const realId   = ids[tmpId] ?? '(id not returned)';
      const alphaStr = alpha < 1 ? ` @ ${Math.round(alpha * 100)}% opacity` : '';
      console.log(`  ${tokenName.padEnd(14)} ${hex}${alphaStr}  →  ${realId}`);
    }

    console.log('\nOpen your Figma file and check Local variables → GDAW Tokens → Dark.');
  } catch (err) {
    console.error('\n[error]', err.message);

    if (err.message.includes('403')) {
      console.error(
        '\nHint: 403 usually means the token lacks "Variables: Write" scope,\n' +
        '      or the token owner does not have edit access to this file.'
      );
    } else if (err.message.includes('404')) {
      console.error(
        '\nHint: 404 means the file key is wrong or the token owner cannot\n' +
        '      see the file. Check FILE_KEY and file sharing settings.'
      );
    } else if (err.message.includes('400')) {
      console.error(
        '\nHint: 400 means the payload failed Figma validation. Nothing was saved.\n' +
        '      The error body above should identify which field is invalid.'
      );
    }

    process.exit(1);
  }
})();
