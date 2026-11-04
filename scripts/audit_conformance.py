#!/usr/bin/env python3
"""Conformance audit: read each live repo (never write to it) and check it against the design language.

Each check is a small, readable heuristic over the repo's files. A check is evaluated twice: on the committed files (git HEAD)
and on the working tree. The result is one of
  yes       present in the committed files
  wip       present only in uncommitted edits (a retrofit that is in progress)
  no        absent
Output: docs/conformance.json (read by the style guide and the tests). Run: python3 scripts/audit_conformance.py [--md]
Heuristics can be fooled; checks that need a human eye are listed under "manual" with the date they were looked at.
"""
import datetime, json, os, re, subprocess, sys
from pathlib import Path

HOME = Path.home()
PAGES = [
    ('himawari-io', 'Himawari'), ('calendar-app-io', 'Calendar'), ('abiogenesis-io', 'Abiogenesis'), ('biot6900-io', 'BIOT 6900'),
    ('garage-io', 'The Garage'), ('focuslock-io', 'FocusLock'), ('atlas-mobile-io', 'Atlas Mobile'), ('lucascheck-io', 'LucasCheck'),
    ('ml-projects-io', 'ML projects town'), ('macos-tools-io', 'macOS tools'), ('manifold-io', 'Manifold'),
]
SKIP = {'.git', 'node_modules', 'media-src', 'release', 'img', 'fig', 'structures', 'data', 'screens', 'shots'}
TEXT_EXT = ('.html', '.js', '.mjs', '.css', '.md', '.json')


def git(repo, *args):
    return subprocess.run(['git', '-C', str(repo), *args], capture_output=True, text=True).stdout


def load_work(repo):
    files = {}
    for dp, dn, fn in os.walk(repo):
        dn[:] = [d for d in dn if d not in SKIP]
        for f in fn:
            if f.endswith(TEXT_EXT):
                p = Path(dp) / f
                try:
                    if p.stat().st_size < 600_000:
                        files[str(p.relative_to(repo))] = p.read_text(errors='ignore')
                except OSError:
                    pass
    return files


def load_head(repo):
    files = {}
    for name in git(repo, 'ls-tree', '-r', '--name-only', 'HEAD').splitlines():
        if name.endswith(TEXT_EXT) and not any(part in SKIP for part in name.split('/')[:-1]):
            t = git(repo, 'show', f'HEAD:{name}')
            if len(t) < 600_000:
                files[name] = t
    return files


def code(files):
    """HTML, CSS and JS of the page itself, excluding docs and tests."""
    return '\n'.join(t for n, t in files.items() if n.endswith(('.html', '.js', '.mjs', '.css')) and not n.startswith(('tests/', 'scripts/', 'test/')))


# ---- checks: each takes (files) and returns True/False --------------------------------------------------------------
def c_theme_key(f):
    c = code(f)
    return bool(re.search(r"""(getItem|setItem)\(\s*['"]theme['"]""", c))


def c_theme_three(f):
    c = code(f)
    return bool(re.search(r'role="radiogroup"[^>]*Color theme|aria-label="Color theme"', c)) and bool(re.search(r'data-(theme-)?mode="auto"', c))


def c_theme_early(f):
    h = f.get('index.html', '')
    m = re.search(r'<head>(.*?)</head>', h, re.S)
    return bool(m and re.search(r"""getItem\(\s*['"]theme['"]""", m.group(1)) and 'data-theme' in m.group(1))


def c_no_own_theme_key(f):
    return not re.search(r"""(get|set)Item\(\s*['"][a-z0-9]+-theme['"]""", code(f))


def has_control(f, words):
    h = f.get('index.html', '') + '\n' + '\n'.join(t for n, t in f.items() if n.endswith('.js') and not n.startswith(('tests/', 'scripts/')))
    return bool(re.search(r'(id|class|data-[a-z-]+|aria-label)="[^"]*(' + words + ')', h, re.I)) or bool(re.search(r'(id|aria-label)\s*[:=]\s*["\'][^"\']*(' + words + ')', h, re.I))


def c_sound_ctl(f): return has_control(f, r'sound|snd')
def c_motion_ctl(f): return has_control(f, r'motion|calm|still')
def c_fx_ctl(f): return has_control(f, r'effects|cursor|\bfx\b|b-fx|-fx')
def c_quiet_ctl(f): return has_control(f, r'quiet')


def c_sound_default_on(f):
    """Sound starts on: the shipped markup says aria-pressed=true / 'Sound on', and the code does not read a stored '1' as the only way on."""
    c = code(f)
    if re.search(r'off by default|off until|opt-in', c, re.I):
        return False
    snd = ''.join(re.findall(r'<button[^>]*(?:id="[^"]*(?:sound|snd)[^"]*"|data-sound-switch|class="snd")[^>]*>', f.get('index.html', ''), re.I))
    if snd and 'aria-pressed="false"' in snd and 'aria-label="Sound on"' not in snd:
        return bool(re.search(r"""!==\s*['"](0|off)['"]|=\s*true|on\s*=\s*true""", c)) and not re.search(r"""getItem\([^)]*\)\s*===\s*['"]1['"]""", c)
    return bool(snd)


def c_reduced(f):
    return bool(re.search(r'prefers-reduced-motion', code(f)))


def fallback_kind(f):
    """What a visitor gets without JavaScript: a text.html, an in-page text version, a noscript note, or static content in index.html."""
    h = f.get('index.html', '')
    if 'text.html' in f:
        return 'text.html'
    if re.search(r'text version', h, re.I):
        return 'text version'
    plain = re.sub(r'<script.*?</script>|<style.*?</style>|<[^>]+>', ' ', h, flags=re.S)
    if re.search(r'<noscript', h, re.I):
        return 'noscript'
    if len(plain.split()) >= 300:
        return 'static content'
    return None


def c_text(f):
    return fallback_kind(f) is not None


def c_text_version(f):
    return 'text.html' in f or 'text-version' in code(f).lower() or 'text version' in code(f).lower()


def c_readme(f): return 'README.md' in f
def c_design(f): return 'DESIGN.md' in f
def c_tests(f): return any(n.startswith(('tests/', 'test/')) for n in f)


def c_external(f):
    """True when NO external request is made: no script/link/img/css url()/fetch to another origin."""
    c = code(f)
    own = re.compile(r'^https?://(dhairyab0069\.github\.io|localhost)')
    bad = []
    for m in re.finditer(r"""(?:<script[^>]+src|<link[^>]+href|<img[^>]+src|<iframe[^>]+src|<source[^>]+src)\s*=\s*["'](https?:)?//([^"']+)""", c):
        if not own.match('https://' + m.group(2)) and 'rel="canonical"' not in m.group(0):
            bad.append(m.group(2))
    for m in re.finditer(r"""(?:url\(\s*|@import\s+|fetch\(\s*)["']?(https?:)?//([^"')\s]+)""", c):
        bad.append(m.group(2))
    bad = [b for b in bad if not b.startswith('dhairyab0069.github.io')]
    return not bad


def c_privacy_file(f): return '.privacy-deny' in f or any(n.endswith('.privacy-deny') for n in f)


CHECKS = [
    ('sound', 'Sound symbol control', c_sound_ctl),
    ('motion', 'Motion symbol control', c_motion_ctl),
    ('effects', 'Effects symbol control', c_fx_ctl),
    ('quiet', 'Quiet-everything control', c_quiet_ctl),
    ('soundOn', 'Sound on by default', c_sound_default_on),
    ('themeKey', 'Shared theme key', c_theme_key),
    ('themeThree', 'Light/Dark/Auto selector', c_theme_three),
    ('themeEarly', 'Early theme script in head', c_theme_early),
    ('reduced', 'Reduced-motion gate', c_reduced),
    ('fallback', 'Text or no-JS fallback', c_text),
    ('readme', 'README.md', c_readme),
    ('design', 'DESIGN.md', c_design),
    ('tests', 'Tests', c_tests),
    ('noExternal', 'No external requests', c_external),
]


def evaluate(files):
    return {k: bool(fn(files)) for k, _, fn in CHECKS}


# Facts that need a human eye. Looked at on the date shown; not computed.
MANUAL = {
    'ml-projects-io': {'themeNote': 'its theme is a single cycle button with its own key (mlp-theme), not the shared theme key'},
    'calendar-app-io': {'themeNote': 'retro desktop with stepped motion by design (steps, no easing curves)'},
    'biot6900-io': {'themeNote': 'the Sound button is injected by sound.js (so the markup search misses it) and is off until pressed; the page loads Literata from Google Fonts and 3Dmol from cdnjs',
                    'override': {'sound': 'yes'}},
}


def audit():
    out = {'date': datetime.date.today().isoformat(), 'checks': [{'id': k, 'label': l} for k, l, _ in CHECKS], 'pages': []}
    for slug, name in PAGES:
        repo = HOME / slug
        if not repo.exists():
            out['pages'].append({'slug': slug, 'name': name, 'missing': True})
            continue
        head, work = load_head(repo), load_work(repo)
        eh, ew = evaluate(head), evaluate(work)
        status = {k: ('yes' if eh[k] else 'wip' if ew[k] else 'no') for k in eh}
        status.update(MANUAL.get(slug, {}).get('override', {}))
        dirty = [l[3:] for l in git(repo, 'status', '--short').splitlines()]
        last = git(repo, 'log', '-1', '--format=%h|%ad|%s', '--date=short').strip().split('|', 2)
        recent = git(repo, 'log', '--since=2 days ago', '--format=%s').lower()
        retro = bool(re.search(r'theme|symbol|sound on|light|dark', recent))
        out['pages'].append({
            'slug': slug, 'name': name, 'url': f'https://dhairyab0069.github.io/{slug}/', 'status': status,
            'uncommitted': len(dirty), 'lastCommit': {'hash': last[0], 'date': last[1], 'subject': last[2][:90]} if len(last) == 3 else None,
            'fallbackKind': fallback_kind(work), 'inProgress': bool(dirty), 'manual': {k: v for k, v in MANUAL.get(slug, {}).items() if k != 'override'},
            'score': sum(1 for v in status.values() if v == 'yes'), 'total': len(status),
        })
    return out


def md(a):
    cols = [c['id'] for c in a['checks']]
    lines = ['| Page | ' + ' | '.join(c['label'] for c in a['checks']) + ' | State |', '|' + '---|' * (len(cols) + 2)]
    sym = {'yes': 'yes', 'wip': 'in progress', 'no': 'missing'}
    for p in a['pages']:
        if p.get('missing'):
            continue
        lines.append(f"| {p['name']} | " + ' | '.join(sym[p['status'][c]] for c in cols) + f" | {'edits in progress' if p['inProgress'] else 'clean'} |")
    return '\n'.join(lines)


if __name__ == '__main__':
    a = audit()
    root = Path(__file__).resolve().parent.parent
    (root / 'docs').mkdir(exist_ok=True)
    (root / 'docs' / 'conformance.json').write_text(json.dumps(a, indent=2) + '\n')
    print(md(a) if '--md' in sys.argv else f"wrote docs/conformance.json ({len(a['pages'])} pages, {a['date']})")
