'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const KINDS = ['enabled', 'optional'];
const PART = /^(.+\.zip)\.part(\d+)\.dylan$/i;
const LINK = /^(.+\.zip)\.url$/i;

const README = [
  'DylanClient site resource packs',
  '',
  'Put resource pack .zip files in these folders and every player who opens this site gets them:',
  '',
  '  enabled/   packs that are switched on for everyone by default (players can still turn them off)',
  '  optional/  packs that show up in Options > Resource Packs, switched off until a player turns them on',
  '',
  'The client downloads each pack once and keeps it in browser storage, so later visits start instantly.',
  'When you replace or remove a pack here, players get the change the next time they open the site.',
  '',
  'packs.json lists the packs and their versions. It lets hosts that do not show folder listings',
  '(GitHub Pages, jsDelivr, Cloudflare Pages, Netlify) find the packs. After adding or removing packs, run:',
  '',
  '  node make-sitepacks.js resourcepacks',
  '',
  'from the folder that holds resourcepacks/ (add --split for jsDelivr, which splits packs bigger than 19 MB).',
  'Hosts that show folder listings (nginx autoindex, Apache, Caddy browse, python -m http.server) also pick up',
  'packs that are missing from packs.json.',
  '',
  'A pack whose license does not allow rehosting can be linked instead of copied: put a text file named',
  '<pack>.zip.url next to the others with the https download address on its first line. Players then download',
  'it straight from that address (the host must allow cross-origin downloads, as Modrinth and GitHub releases do).',
  ''
].join('\n');

function args() {
  const out = { _: [] };
  for (const a of process.argv.slice(2)) {
    const m = /^--([^=]+)(?:=(.*))?$/.exec(a);
    if (m) {
      out[m[1]] = m[2] === undefined ? true : m[2];
    } else {
      out._.push(a);
    }
  }
  return out;
}

function sha1(buffers) {
  const h = crypto.createHash('sha1');
  for (const b of buffers) {
    h.update(b);
  }
  return h.digest('hex').slice(0, 16);
}

function scanKind(dir) {
  const packs = new Map();
  if (!fs.existsSync(dir)) {
    return packs;
  }
  for (const name of fs.readdirSync(dir).sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }))) {
    if (name.startsWith('.')) {
      continue;
    }
    const full = path.join(dir, name);
    if (!fs.statSync(full).isFile()) {
      continue;
    }
    const link = LINK.exec(name);
    if (link) {
      const url = fs.readFileSync(full, 'utf8').split(/\r?\n/)[0].trim();
      if (/^https:\/\/[^\s]+$/i.test(url)) {
        const entry = packs.get(link[1]) || { file: link[1], parts: [] };
        entry.link = url;
        packs.set(link[1], entry);
      } else {
        console.warn('skipping ' + name + ': the first line must be an https address');
      }
      continue;
    }
    const part = PART.exec(name);
    if (part) {
      const entry = packs.get(part[1]) || { file: part[1], parts: [] };
      entry.parts[Number(part[2])] = full;
      packs.set(part[1], entry);
    } else if (name.toLowerCase().endsWith('.zip')) {
      const entry = packs.get(name) || { file: name, parts: [] };
      entry.whole = full;
      packs.set(name, entry);
    }
  }
  return packs;
}

function build(root, opt) {
  const split = opt.split ? Number(opt.split === true ? 19e6 : opt.split) : 0;
  const manifest = { scan: !opt['no-scan'], enabled: [], optional: [] };
  for (const kind of KINDS) {
    const dir = path.join(root, kind);
    fs.mkdirSync(dir, { recursive: true });
    for (const entry of scanKind(dir).values()) {
      if (entry.link && !entry.whole && !entry.parts.some(Boolean)) {
        manifest[kind].push({ file: entry.file, url: entry.link, version: sha1([Buffer.from(entry.link)]) });
        continue;
      }
      let parts;
      if (entry.whole) {
        const data = fs.readFileSync(entry.whole);
        if (split && data.length > split) {
          entry.parts.forEach((p) => p && fs.unlinkSync(p));
          parts = [];
          for (let i = 0, n = 0; i < data.length; i += split, n++) {
            const file = path.join(dir, entry.file + '.part' + n + '.dylan');
            fs.writeFileSync(file, data.subarray(i, Math.min(data.length, i + split)));
            parts.push(file);
          }
          fs.unlinkSync(entry.whole);
          console.log('split ' + kind + '/' + entry.file + ' into ' + parts.length + ' parts');
        } else {
          entry.parts.forEach((p) => p && fs.unlinkSync(p));
          parts = [entry.whole];
        }
      } else {
        parts = entry.parts;
        if (parts.some((p) => !p)) {
          console.warn('skipping ' + kind + '/' + entry.file + ': some parts are missing');
          continue;
        }
      }
      const version = sha1(parts.map((p) => fs.readFileSync(p)));
      const item = { file: entry.file, version };
      if (parts.length > 1 || parts[0] !== entry.whole) {
        item.parts = parts.length;
      }
      manifest[kind].push(item);
    }
    const keep = path.join(dir, 'README.txt');
    if (!fs.existsSync(keep)) {
      fs.writeFileSync(keep, kind === 'enabled'
        ? 'Resource packs in this folder are switched on for every player by default.\n'
        : 'Resource packs in this folder are available in Options > Resource Packs but switched off until a player turns them on.\n');
    }
  }
  fs.writeFileSync(path.join(root, 'packs.json'), JSON.stringify(manifest, null, 1) + '\n');
  fs.writeFileSync(path.join(root, 'README.txt'), README);
  if (opt.tool) {
    fs.copyFileSync(__filename, path.join(path.dirname(root), 'make-sitepacks.js'));
  }
  const count = manifest.enabled.length + manifest.optional.length;
  console.log('site packs: ' + manifest.enabled.length + ' enabled, ' + manifest.optional.length + ' optional (' + count + ' total) -> ' + path.join(root, 'packs.json'));
  return manifest;
}

if (require.main === module) {
  const opt = args();
  const root = path.resolve(opt._[0] || 'resourcepacks');
  if (opt.from) {
    const from = path.resolve(opt.from);
    for (const kind of KINDS) {
      const src = path.join(from, kind);
      if (!fs.existsSync(src)) {
        continue;
      }
      fs.mkdirSync(path.join(root, kind), { recursive: true });
      for (const name of fs.readdirSync(src)) {
        if (!name.startsWith('.') && fs.statSync(path.join(src, name)).isFile() && name !== 'README.txt' && name !== 'NOTICE.txt') {
          fs.copyFileSync(path.join(src, name), path.join(root, kind, name));
        }
      }
    }
  }
  build(root, opt);
}

module.exports = { build };
