/**
 * Robust CSS Block Parser handling nested @media, @keyframes, comments
 */
function parseCssDeclarations(cssText) {
  let text = cssText.replace(/\/\*[\s\S]*?\*\//g, '');
  const rules = [];

  let i = 0;
  while (i < text.length) {
    const openBrace = text.indexOf('{', i);
    if (openBrace === -1) break;

    const selectorChunk = text.slice(i, openBrace).trim();

    if (selectorChunk.startsWith('@media') || selectorChunk.startsWith('@supports')) {
      let depth = 1;
      let j = openBrace + 1;
      while (j < text.length && depth > 0) {
        if (text[j] === '{') depth++;
        else if (text[j] === '}') depth--;
        j++;
      }
      const mediaBody = text.slice(openBrace + 1, j - 1);
      const innerRules = parseCssDeclarations(mediaBody);
      innerRules.forEach(r => rules.push({ ...r, media: selectorChunk }));
      i = j;
      continue;
    } else if (selectorChunk.startsWith('@keyframes')) {
      let depth = 1;
      let j = openBrace + 1;
      while (j < text.length && depth > 0) {
        if (text[j] === '{') depth++;
        else if (text[j] === '}') depth--;
        j++;
      }
      i = j;
      continue;
    }

    const closeBrace = text.indexOf('}', openBrace);
    if (closeBrace === -1) break;

    const body = text.slice(openBrace + 1, closeBrace);
    const selectors = selectorChunk.split(',').map(s => s.trim()).filter(Boolean);

    const decls = {};
    body.split(';').forEach(line => {
      const idx = line.indexOf(':');
      if (idx !== -1) {
        const prop = line.slice(0, idx).trim().toLowerCase();
        const val = line.slice(idx + 1).trim().replace(/!important/i, '').trim();
        decls[prop] = val;
      }
    });

    selectors.forEach(sel => {
      rules.push({ selector: sel, declarations: decls, media: null });
    });

    i = closeBrace + 1;
  }

  return rules;
}

module.exports = { parseCssDeclarations };
