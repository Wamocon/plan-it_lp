/**
 * plan-IT Architekturplaner (WAMOCON) — Regression Tests
 *
 * Zweck: Sicherstellen, dass kritische Inhalte, Strukturen und Links
 * nach jeder Änderung korrekt erhalten bleiben.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');

// ── 1. Pflichtdateien vorhanden ─────────────────────────────────────────────
describe('Pflichtdateien', () => {
  test.each([
    'index.html',
    'style.css',
    'script.js',
    'logo.svg',
    'favicon.svg',
    'agb.html',
    'datenschutz.html',
    'impressum.html',
    'cookies.html',
    '.gitignore',
  ])('%s ist vorhanden', (file) => {
    expect(fs.existsSync(path.join(ROOT, file))).toBe(true);
  });
});

// ── 2. Keine LFA/IHK-Inhalte (Regression gegen alten Content) ──────────────
describe('Keine Legacy-Inhalte (LFA / IHK)', () => {
  const files = ['index.html', 'style.css', 'script.js'];
  const banned = [
    { pattern: /\bLFA\b/,      label: 'LFA'         },
    { pattern: /\bIHK\b/,      label: 'IHK'         },
    { pattern: /\bFIAE\b/,     label: 'FIAE'         },
    { pattern: /\.lfa-/,       label: '.lfa- Klasse' },
    { pattern: /chain-lfa/,    label: 'chain-lfa'    },
    { pattern: /fiae-learn/,   label: 'fiae-learn'   },
    { pattern: /&#128208;/,    label: 'Emoji &#128208; (alter Platzhalter)' },
  ];

  files.forEach((file) => {
    banned.forEach(({ pattern, label }) => {
      test(`${file}: enthält kein "${label}"`, () => {
        expect(read(file)).not.toMatch(pattern);
      });
    });
  });
});

// ── 3. index.html: Pflicht-Sektionen ────────────────────────────────────────
describe('index.html: Pflicht-Sektionen vorhanden', () => {
  let html;
  beforeAll(() => { html = read('index.html'); });

  test.each([
    'hero', 'problem', 'roadmap', 'ki-analyse',
    'rollen', 'funktionen', 'vergleich', 'wizard',
    'demo', 'gemini', 'roi', 'testimonials',
    'architektur', 'team', 'cta-final',
  ])('id="%s" vorhanden', (id) => {
    expect(html).toContain(`id="${id}"`);
  });
});

// ── 4. index.html: Navigation & Branding ────────────────────────────────────
describe('index.html: Navigation & Branding', () => {
  let html;
  beforeAll(() => { html = read('index.html'); });

  test('favicon.svg im <head> verlinkt', () => {
    expect(html).toMatch(/href="favicon\.svg"/);
  });

  test('logo.svg in Navigation verwendet', () => {
    expect(html).toMatch(/src="logo\.svg"/);
  });

  test('Markenname "plan-IT" vorhanden', () => {
    expect(html).toContain('plan-IT');
  });
});

// ── 5. index.html: Meta-Tags ─────────────────────────────────────────────────
describe('index.html: Meta-Tags', () => {
  let html;
  beforeAll(() => { html = read('index.html'); });

  test('charset deklariert', () => {
    expect(html.toLowerCase()).toMatch(/charset/);
  });

  test('viewport Meta-Tag vorhanden', () => {
    expect(html).toContain('name="viewport"');
  });

  test('description Meta-Tag vorhanden', () => {
    expect(html).toContain('name="description"');
  });

  test('og:title Open-Graph-Tag vorhanden', () => {
    expect(html).toContain('og:title');
  });
});

// ── 6. index.html: SVG-Sprite alle Symbole definiert ─────────────────────────
describe('index.html: SVG-Sprite Symbole', () => {
  let html;
  beforeAll(() => { html = read('index.html'); });

  test.each([
    'i-shield', 'i-zap',     'i-check',    'i-bot',
    'i-star',   'i-warning', 'i-layers',   'i-edit',
    'i-download','i-tasks',  'i-trending', 'i-message',
    'i-grid',   'i-users',   'i-chart',    'i-clock',
    'i-building','i-file',   'i-link',     'i-calendar',
    'i-compare', 'i-lock',   'i-book',
  ])('Symbol #%s ist definiert', (sym) => {
    expect(html).toContain(`id="${sym}"`);
  });

  test('alle verwendeten <use href="#i-..."> Symbole sind definiert', () => {
    const used     = [...html.matchAll(/href="#(i-[^"]+)"/g)].map((m) => m[1]);
    const defined  = new Set([...html.matchAll(/id="(i-[^"]+)"/g)].map((m) => m[1]));
    const missing  = [...new Set(used)].filter((s) => !defined.has(s));
    expect(missing).toEqual([]);
  });
});

// ── 7. index.html: Roadmap-Knoten ────────────────────────────────────────────
describe('index.html: Roadmap', () => {
  let html;
  beforeAll(() => { html = read('index.html'); });

  test('mindestens 9 Roadmap-Zeilen vorhanden', () => {
    const rows = html.match(/class="rm__row"/g) ?? [];
    expect(rows.length).toBeGreaterThanOrEqual(9);
  });

  test('Roadmap-Endknoten vorhanden', () => {
    expect(html).toContain('rm__end');
  });
});

// ── 8. index.html: Feature-Karten ────────────────────────────────────────────
describe('index.html: Feature-Karten', () => {
  let html;
  beforeAll(() => { html = read('index.html'); });

  test('mindestens 9 Feature-Karten im Grid', () => {
    const cards = html.match(/p-7 rounded-2xl/g) ?? [];
    expect(cards.length).toBeGreaterThanOrEqual(9);
  });
});

// ── 9. index.html: Interne Anker-Links ──────────────────────────────────────
describe('index.html: Interne Anker-Links', () => {
  let html;
  beforeAll(() => { html = read('index.html'); });

  test('alle href="#..." Links verweisen auf existierende IDs', () => {
    const anchors = [...html.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]);
    const ids     = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
    const missing = [...new Set(anchors)].filter((a) => !ids.has(a));
    expect(missing).toEqual([]);
  });
});

// ── 10. Dateigröße-Grenzen ───────────────────────────────────────────────────
describe('Dateigröße (Regression gegen unkontrolliertes Wachstum)', () => {
  test('index.html ist kleiner als 600 KB', () => {
    const { size } = fs.statSync(path.join(ROOT, 'index.html'));
    expect(size).toBeLessThan(600 * 1024);
  });

  test('style.css ist kleiner als 150 KB', () => {
    const { size } = fs.statSync(path.join(ROOT, 'style.css'));
    expect(size).toBeLessThan(150 * 1024);
  });

  test('script.js ist kleiner als 150 KB', () => {
    const { size } = fs.statSync(path.join(ROOT, 'script.js'));
    expect(size).toBeLessThan(150 * 1024);
  });
});

// ── 11. SVG-Assets ──────────────────────────────────────────────────────────
describe('SVG-Assets', () => {
  test('logo.svg ist gültiges SVG mit viewBox', () => {
    const svg = read('logo.svg');
    expect(svg).toMatch(/<svg/);
    expect(svg).toContain('</svg>');
    expect(svg).toContain('viewBox');
  });

  test('favicon.svg ist gültiges SVG', () => {
    const svg = read('favicon.svg');
    expect(svg).toMatch(/<svg/);
    expect(svg).toContain('</svg>');
  });
});

// ── 12. Rechtliche Seiten ───────────────────────────────────────────────────
describe('Rechtliche Seiten: Grundstruktur', () => {
  test.each(['agb.html', 'datenschutz.html', 'impressum.html', 'cookies.html'])(
    '%s hat gültige HTML-Struktur und enthält plan-IT',
    (page) => {
      const content = read(page);
      expect(content.toLowerCase()).toContain('<!doctype html');
      expect(content.toLowerCase()).toContain('<html');
      expect(content.toLowerCase()).toContain('</html>');
      expect(content).toContain('plan-IT');
    }
  );
});
