#!/usr/bin/env python3
"""Build everything that is generated from the skill, so the doc, the tokens and the skill stay in sync.

Reads  ~/.claude/skills/dynamic-web-design/{registry/themes/*.json, registry/project_types.json, templates/kit/*}
Writes tokens/tokens.json, tokens/tokens.css, assets/dl-data.js (data for the live gallery), and fills the
<!--GEN:name-->...<!--/GEN:name--> blocks in index.html and DESIGN-LANGUAGE.md.
Run: python3 scripts/build.py   (then node scripts/build_text.js for text.html)
"""
import datetime, html, json, re, subprocess, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import site_md

ROOT = Path(__file__).resolve().parent.parent
SKILL = Path.home() / '.claude/skills/dynamic-web-design'
KIT = SKILL / 'templates/kit'
STATUS = {'light': {'--ok': '#2f7d4f', '--warn': '#8a5a00', '--danger': '#a8362c'}, 'dark': {'--ok': '#6fd39a', '--warn': '#f0c060', '--danger': '#ff8a7d'}}
ROLES = ['--bg', '--surface', '--surface-2', '--ink', '--muted', '--line', '--accent', '--accent-text', '--accent-ink', '--accent-soft', '--accent-2', '--focus', '--overlay', '--glow-rgb']
ROLE_NOTE = {'--bg': 'page background', '--surface': 'cards, panels', '--surface-2': 'wells, code, table heads', '--ink': 'body text', '--muted': 'secondary text',
             '--line': 'borders and rules', '--accent': 'fills, graphics, the brand colour', '--accent-text': 'links, eyebrows (accent that reads as text)', '--accent-ink': 'text on an accent fill',
             '--accent-soft': 'tinted backgrounds', '--accent-2': 'second accent (heat, warnings of attention)', '--focus': 'focus ring', '--overlay': 'transition panels, scrims', '--glow-rgb': 'light that follows the pointer (r, g, b)'}


# ---------------------------------------------------------------- colour maths
def lum(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    c = [v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4 for v in c]
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]


def ratio(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True)
    return round((la + 0.05) / (lb + 0.05), 2)


PAIRS = [('ink / bg', '--ink', '--bg', 4.5), ('ink / surface', '--ink', '--surface', 4.5), ('muted / bg', '--muted', '--bg', 4.5), ('muted / surface', '--muted', '--surface', 4.5),
         ('accent text / bg', '--accent-text', '--bg', 4.5), ('accent text / surface', '--accent-text', '--surface', 4.5), ('accent ink / accent', '--accent-ink', '--accent', 4.5), ('focus / bg', '--focus', '--bg', 3.0)]


def contrast_rows(c):
    c = {**c}
    c.setdefault('--accent-text', c['--accent'])
    return [{'pair': n, 'ratio': ratio(c[a], c[b]), 'min': m, 'pass': ratio(c[a], c[b]) >= m} for n, a, b, m in PAIRS]


# ---------------------------------------------------------------- read the skill
def kit_structure():
    css = (KIT / 'tokens.css').read_text().split('/*THEME-COLORS:START*/')[0]
    out = {}
    for m in re.finditer(r'(--[a-z0-9-]+):\s*([^;]+);', css):
        out[m.group(1)] = re.sub(r'\s+', ' ', m.group(2).strip())
    out.pop('--accent-text', None)   # a colour role: defined per theme and mode
    return out


def kit_base_colors():
    css = (KIT / 'tokens.css').read_text()
    blocks = re.findall(r':root(?:, :root\[data-theme="light"\]|\[data-theme="dark"\])\s*\{(.*?)\}', css, re.S)
    return blocks


def sound_info():
    js = r"""
const S = require(process.argv[1]); const out = {cues: S.CUES, gaps: S.GAP, palettes: {}};
for (const [n, P] of Object.entries(S.PALETTES)) {
  out.palettes[n] = {label: P.label, pad: P.pad, cues: {}};
  for (const c of S.CUES) { const rec = []; const T = S.derive({tone: o => rec.push(o), hiss: o => rec.push(o), R: (a, b) => (a + b) / 2});
    P.cues[c](T); out.palettes[n].cues[c] = {voices: rec.length, peak: Math.max(...rec.map(o => o.gain || 0.04)), ms: Math.round(Math.max(...rec.map(o => ((o.at || 0) + (o.dur || 0.1)) * 1000)))}; }
}
console.log(JSON.stringify(out));"""
    return json.loads(subprocess.run(['node', '-e', js, str(KIT / 'sound.js')], capture_output=True, text=True, check=True).stdout)


def transitions_info():
    js = "global.window=global;global.DW=undefined;" \
         "const s=require('fs').readFileSync(process.argv[1],'utf8').match(/var KINDS = \\{([\\s\\S]*?)\\n  \\};/)[1];" \
         "console.log(JSON.stringify([...s.matchAll(/^    (\\w+):\\s+\\{ panels: (\\d)/gm)].map(m=>({id:m[1],panels:+m[2]}))))"
    return json.loads(subprocess.run(['node', '-e', js, str(KIT / 'transitions.js')], capture_output=True, text=True, check=True).stdout)


def load_all():
    themes = {}
    for p in sorted((SKILL / 'registry/themes').glob('*.json')):
        t = json.loads(p.read_text())
        for mode in ('light', 'dark'):
            t[mode].setdefault('--accent-text', t[mode]['--accent'])
            t[mode] = {k: t[mode][k] for k in ROLES if k in t[mode]}
        if str(t['motion'].get('personality', '')).startswith('TODO'):
            t['motion']['personality'] = 'Not filled in yet: this is the neutral template for new themes (calm, plain, safe).'
            t['signature'] = ['None yet: a new theme names one or two signature interactions']
            t['avoid'] = ['None yet: a new theme lists what would break its mood']
        t['contrast'] = {m: contrast_rows({**t[m]}) for m in ('light', 'dark')}
        t['status'] = STATUS
        themes[t['id']] = t
    types = json.loads((SKILL / 'registry/project_types.json').read_text())['types']
    return themes, types, kit_structure(), sound_info(), transitions_info()


# ---------------------------------------------------------------- exports
def decl(d, ind='  '):
    return '\n'.join(f'{ind}{k}: {v};' for k, v in d.items())


def tokens_css(themes, struct):
    o = ['/* Murmur design language: tokens generated by scripts/build.py from the dynamic-web-design registry. Do not edit by hand.',
         '   Every theme has a light AND a dark set. Use: <section data-dl-theme="workshop"> follows the page mode (:root[data-theme]);',
         '   add data-dl-mode="light|dark" to force one mode for that subtree. Structural tokens (type, space, motion) are in :root. */', ':root {']
    o.append(decl(struct))
    o.append('}')
    for tid, t in themes.items():
        L, D = {**STATUS['light'], **t['light']}, {**STATUS['dark'], **t['dark']}
        sel = f'[data-dl-theme="{tid}"]'
        struct_decl = decl(t.get('tokens', {}))
        o.append(f'/* {tid}: {t["title"]} */')
        o.append(f'{sel} {{\n  color-scheme: light;\n{struct_decl + chr(10) if struct_decl else ""}{decl(L)}\n}}')
        o.append('@media (prefers-color-scheme: dark) {\n:root:not([data-theme]) ' + sel + ':not([data-dl-mode]) {\n  color-scheme: dark;\n' + decl(D) + '\n}\n}')
        o.append(f':root[data-theme="dark"] {sel}:not([data-dl-mode]),\n{sel}[data-dl-mode="dark"] {{\n  color-scheme: dark;\n{decl(D)}\n}}')
        o.append(f'{sel}[data-dl-mode="light"] {{\n  color-scheme: light;\n{decl(L)}\n}}')
    return '\n'.join(o) + '\n'


def tokens_json(themes, types, struct, snd, trans):
    return {
        'name': 'Murmur', 'version': '1.0.0', 'generated': datetime.date.today().isoformat(),
        'source': 'dynamic-web-design skill: registry/themes/*.json and templates/kit',
        'sharedThemeKey': {'localStorage': 'theme', 'values': ['light', 'dark', 'auto'], 'absent': 'auto', 'attributes': ['data-theme-mode', 'data-theme'], 'event': 'themechange'},
        'structure': struct, 'status': STATUS,
        'breakpoints': {'phone': '560px', 'narrow': '760px', 'wide': '1100px'},
        'transitions': trans, 'sound': {'cues': snd['cues'], 'gaps': snd['gaps'], 'masterGain': 0.3, 'partialMax': 0.08, 'voiceCap': 24, 'perSecond': 14,
                                        'palettes': {k: {'label': v['label'], 'pad': v['pad']} for k, v in snd['palettes'].items()}},
        'themes': themes, 'projectTypes': types,
    }


# ---------------------------------------------------------------- generated blocks (HTML and Markdown from the same rows)
def tbl_md(head, rows):
    return '\n'.join(['| ' + ' | '.join(head) + ' |', '|' + '---|' * len(head)] + ['| ' + ' | '.join(str(c) for c in r) + ' |' for r in rows])


def tbl_html(head, rows, cap='', cls=''):
    h = f'<div class="tbl-wrap"><table class="{cls}"><caption>{html.escape(cap)}</caption><thead><tr>' + ''.join(f'<th scope="col">{html.escape(x)}</th>' for x in head) + '</tr></thead><tbody>'
    for r in rows:
        h += '<tr>' + ''.join(('<th scope="row">' if i == 0 else '<td>') + (c if isinstance(c, Raw) else html.escape(str(c))) + ('</th>' if i == 0 else '</td>') for i, c in enumerate(r)) + '</tr>'
    return h + '</tbody></table></div>'


class Raw(str):
    pass


def sw(hexv):
    return Raw(f'<span class="sw" style="background:{hexv}" aria-hidden="true"></span><code>{hexv}</code>') if re.fullmatch(r'#[0-9a-fA-F]{6}', hexv) else Raw(f'<code>{html.escape(hexv)}</code>')


def blocks(themes, types, struct, snd, trans, conf):
    B = {}
    # structural scales
    def S(prefix, keys=None):
        return [(k, v) for k, v in struct.items() if k.startswith(prefix)]
    scales = {'type': S('--step') + [('--leading', struct['--leading']), ('--leading-tight', struct['--leading-tight']), ('--measure', struct['--measure'])],
              'space': S('--space') + [('--gutter', struct['--gutter']), ('--wrap', struct['--wrap'])],
              'radius': S('--radius') + [('--border', struct['--border'])], 'shadow': S('--shadow'),
              'motion': S('--dur') + S('--ease') + [('--reveal-distance', struct['--reveal-distance']), ('--reveal-stagger', struct['--reveal-stagger'])],
              'z': S('--z'), 'fonts': S('--font') + [('--weight-display', struct['--weight-display']), ('--track-display', struct['--track-display'])]}
    notes = {'--dur-instant': 'press feedback', '--dur-fast': 'hover, small state change', '--dur-base': 'cards, tabs, tooltips, toast', '--dur-slow': 'reveals, chart bars', '--dur-scene': 'section and page transitions (two halves)',
             '--ease-standard': 'default: arrives fast, settles', '--ease-in': 'leaving', '--ease-out': 'exits and reveals', '--ease-spring': 'small overshoot, physical metaphors only',
             '--z-field': 'ambient canvas', '--z-content': 'page content', '--z-nav': 'header', '--z-controls': 'symbol controls and progress', '--z-modal': 'dialogs', '--z-toast': 'toasts and skip link', '--z-tx': 'transition panels'}
    for name, rows in scales.items():
        r = [(k, v, notes.get(k, '')) for k, v in rows]
        B['scale-' + name] = (tbl_md(['Token', 'Value', 'Use'], [(f'`{k}`', f'`{v}`', n) for k, v, n in r]), tbl_html(['Token', 'Value', 'Use'], [(Raw(f'<code>{k}</code>'), Raw(f'<code>{html.escape(v)}</code>'), n) for k, v, n in r], f'{name} tokens'))
    bp = [('phone', '560px', 'single column, 44px controls, particles capped at 28'), ('narrow', '760px', 'header wraps, nav scrolls sideways'), ('wide', '1100px', 'wide layouts, side-by-side demos')]
    B['breakpoints'] = (tbl_md(['Name', 'Max width', 'What changes'], [(a, f'`{b}`', c) for a, b, c in bp]), tbl_html(['Name', 'Max width', 'What changes'], bp, 'Breakpoints'))
    # contrast
    head = ['Theme', 'Mode'] + [p[0] for p in PAIRS]
    rows_md, rows_h = [], []
    for tid, t in themes.items():
        for m in ('light', 'dark'):
            c = t['contrast'][m]
            rows_md.append([tid, m] + [f"{x['ratio']}" + ('' if x['pass'] else ' FAIL') for x in c])
            rows_h.append([tid, m] + [Raw(f'<span class="{"ok" if x["pass"] else "bad"}">{x["ratio"]}</span>') for x in c])
    B['contrast'] = (tbl_md(head, rows_md), tbl_html(head, rows_h, 'WCAG contrast ratios, computed from the token values (text pairs need 4.5, the focus ring 3)', 'contrast'))
    # per-theme colour tables (md appendix)
    md = []
    for tid, t in themes.items():
        rows = [(f'`{r}`', f"`{t['light'][r]}`", f"`{t['dark'][r]}`") for r in ROLES if r in t['light']]
        md.append(f"#### {t['title']} (`{tid}`)\n\n{t['summary']}\n\n" + tbl_md(['Role', 'Light', 'Dark'], rows) + (f"\n\nStructural overrides: " + ', '.join(f'`{k}: {v}`' for k, v in t['tokens'].items()) if t.get('tokens') else '\n\nNo structural overrides (uses the base scale).'))
    hh = []
    for tid, t in themes.items():
        rows = [(Raw(f'<code>{r}</code>'), sw(t['light'][r]), sw(t['dark'][r])) for r in ROLES if r in t['light']]
        hh.append(f'<details class="tok"><summary>{html.escape(t["title"])} <code>{tid}</code></summary>' + tbl_html(['Role', 'Light', 'Dark'], rows, f'{t["title"]} colour roles') + '</details>')
    B['theme-tables'] = ('\n\n'.join(md), '\n'.join(hh))
    # status
    st = [(k, STATUS['light'][k], STATUS['dark'][k], ratio(STATUS['light'][k], '#ffffff'), ratio(STATUS['dark'][k], '#14181b')) for k in STATUS['light']]
    B['status'] = (tbl_md(['Role', 'Light', 'Dark', 'Light on white', 'Dark on #14181b'], [(f'`{a}`', f'`{b}`', f'`{c}`', d, e) for a, b, c, d, e in st]),
                   tbl_html(['Role', 'Light', 'Dark', 'Light on white', 'Dark on #14181b'], [(Raw(f'<code>{a}</code>'), sw(b), sw(c), d, e) for a, b, c, d, e in st], 'Status colours (shared by every theme; always paired with a word or icon)'))
    # themes table
    rows = [(tid, t['summary'], t['designedFirst'], t['motion']['transition'] + ' / ' + t['motion']['reveal'] + ' / ' + t['motion']['ambient'], t['sound']['palette']) for tid, t in themes.items()]
    B['themes-table'] = (tbl_md(['Theme', 'Feel', 'Designed first', 'Transition / reveal / ambient', 'Sound'], rows), tbl_html(['Theme', 'Feel', 'Designed first', 'Transition / reveal / ambient', 'Sound'], rows, 'Themes'))
    # sound
    cues = snd['cues']
    rows = [(f"{p['label']} (`{n}`)", *[f"{p['cues'][c]['peak']:.3f}" for c in cues]) for n, p in snd['palettes'].items()]
    B['sound-peaks'] = (tbl_md(['Palette'] + cues, rows), tbl_html(['Palette'] + cues, rows, 'Loudest single partial per cue (ceiling 0.08)'))
    rows = [(c, f"{snd['gaps'].get(c, 40)} ms", CUE_USE[c]) for c in cues]
    B['cue-vocab'] = (tbl_md(['Cue', 'Minimum gap', 'Plays when'], [(f'`{a}`', b, c) for a, b, c in rows]), tbl_html(['Cue', 'Minimum gap', 'Plays when'], [(Raw(f'<code>{a}</code>'), b, c) for a, b, c in rows], 'The cue vocabulary'))
    rows = [(t['id'], t['panels'], TX_USE.get(t['id'], '')) for t in trans]
    B['transitions'] = (tbl_md(['Transition', 'Panels', 'Used by'], [(f'`{a}`', b, c) for a, b, c in rows]), tbl_html(['Transition', 'Panels', 'Used by'], rows, 'Transition catalogue'))
    # types guide
    rows = [(t['label'], ', '.join(t['themes']), t['motionNote'], t['soundNote']) for t in types.values()]
    B['types'] = (tbl_md(['Project type', 'Themes to try first', 'Motion', 'Sound'], rows), tbl_html(['Project type', 'Themes to try first', 'Motion', 'Sound'], rows, 'Choosing a theme by project type'))
    # conformance
    B.update(conformance_blocks(conf))
    return B


def summary_lines(conf):
    pages = [p for p in conf['pages'] if not p.get('missing')]
    out = []
    for c in conf['checks']:
        no = [p['name'] for p in pages if p['status'][c['id']] == 'no']
        wip = [p['name'] for p in pages if p['status'][c['id']] == 'wip']
        yes = len(pages) - len(no) - len(wip)
        out.append(f"{c['label']}: {yes} of {len(pages)} have it" + (f"; in progress: {', '.join(wip)}" if wip else '') + (f"; missing: {', '.join(no)}" if no else '') + '.')
    kinds = ', '.join(f"{p['name']} ({p['fallbackKind']})" for p in pages)
    out.append(f'What a visitor without JavaScript gets (checked in code): {kinds}.')
    for p in pages:
        for k, v in p['manual'].items():
            if k == 'themeNote':
                out.append(f"Seen by reading {p['name']}: {v}.")
    return out


CUE_USE = {'click': 'any press on a link, button or tab', 'hover': 'pointer enters a control or card (fine pointers only)', 'open': 'a panel, dialog or drawer opens', 'close': 'it closes', 'success': 'an action completed',
           'error': 'an action failed (low and short, never harsh)', 'whoosh': 'start of a section or page transition', 'reveal': 'end of a transition, a section arriving, and the theme change', 'on': 'a switch turns on', 'off': 'a switch turns off'}
TX_USE = {'fade': 'default, calm pages', 'wipe': 'reports and documentation (paper-report, blueprint-math)', 'iris': 'research and lab pages, and the theme change (circle reveal)', 'slide': 'app and shop pages',
          'zoom': 'entering a building in the town', 'door': 'workbench tools (two panels part)', 'curtain': 'the garage roller door', 'dither': 'the one-bit desktop (stepped)'}


def conformance_blocks(conf):
    if not conf:
        return {}
    cols = [c for c in conf['checks']]
    head = ['Page'] + [c['label'] for c in cols] + ['Follows shared theme', 'State']
    sym = {'yes': 'yes', 'wip': 'in progress', 'no': 'missing'}
    rows_md, rows_h = [], []
    for p in conf['pages']:
        if p.get('missing'):
            continue
        s = p['status']
        follow = 'yes' if all(s[k] == 'yes' for k in ('themeKey', 'themeThree', 'themeEarly')) else 'in progress' if all(s[k] in ('yes', 'wip') for k in ('themeKey', 'themeThree', 'themeEarly')) else 'no'
        state = ('edits in progress' if p['inProgress'] else 'committed') + f" ({p['lastCommit']['hash']}, {p['lastCommit']['date']})" if p['lastCommit'] else ''
        cells = [sym[s[c['id']]] for c in cols] + [follow, state]
        rows_md.append([p['name']] + cells)
        rows_h.append([Raw(f'<a href="{p["url"]}">{html.escape(p["name"])}</a>')] + [Raw(f'<span class="st st-{x.replace(" ", "-")}">{x}</span>') for x in cells[:-1]] + [cells[-1]])
    cap = f"Conformance audit read from the repositories on {conf['date']}"
    L = summary_lines(conf)
    return {'conformance': (tbl_md(head, rows_md), tbl_html(head, rows_h, cap, 'conf')),
            'conformance-summary': ('\n'.join('- ' + x for x in L), '<ul>' + ''.join(f'<li>{html.escape(x)}</li>' for x in L) + '</ul>')}


def fill(path, B, which):
    t = path.read_text()
    for name, (md, h) in B.items():
        pat = re.compile(rf'(<!--GEN:{name}-->)(.*?)(<!--/GEN:{name}-->)', re.S)
        body = md if which == 'md' else h
        t = pat.sub(lambda m: f'{m.group(1)}\n{body}\n{m.group(3)}', t)
    left = re.findall(r'<!--GEN:([a-z-]+)-->', t)
    path.write_text(t)
    return [x for x in left if x not in B]


def main():
    themes, types, struct, snd, trans = load_all()
    conf = json.loads((ROOT / 'docs/conformance.json').read_text()) if (ROOT / 'docs/conformance.json').exists() else None
    (ROOT / 'tokens').mkdir(exist_ok=True)
    J = tokens_json(themes, types, struct, snd, trans)
    (ROOT / 'tokens/tokens.json').write_text(json.dumps(J, indent=2, ensure_ascii=False) + '\n')
    (ROOT / 'tokens/tokens.css').write_text(tokens_css(themes, struct))
    gallery = {'themes': {k: {x: v[x] for x in ('id', 'title', 'summary', 'designedFirst', 'light', 'dark', 'motion', 'sound', 'signature', 'avoid', 'bestFor', 'contrast')} for k, v in themes.items()},
               'sound': {'cues': snd['cues'], 'palettes': {k: {'label': v['label'], 'pad': bool(v['pad'])} for k, v in snd['palettes'].items()}}, 'transitions': [t['id'] for t in trans]}
    (ROOT / 'assets/dl-data.js').write_text('/* Generated by scripts/build.py from tokens/tokens.json. Do not edit. */\nwindow.DL_DATA = ' + json.dumps(gallery, ensure_ascii=False) + ';\n')
    B = blocks(themes, types, struct, snd, trans, conf)
    md = ROOT / 'DESIGN-LANGUAGE.md'
    left = fill(md, B, 'md')
    if left:
        print(f'DESIGN-LANGUAGE.md: unknown GEN blocks: {left}')
    gen = {k: v[1] for k, v in B.items()}
    page, missing = site_md.assemble((ROOT / 'src/index.tpl.html').read_text(), md.read_text(), gen)
    if missing:
        print('index.html: template asks for missing chunks:', missing)
    (ROOT / 'index.html').write_text(page)
    print(f'built: {len(themes)} themes, {len(snd["cues"])} cues, {len(trans)} transitions')


if __name__ == '__main__':
    main()
