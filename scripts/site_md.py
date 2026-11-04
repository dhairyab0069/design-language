"""Tiny Markdown to HTML converter for DESIGN-LANGUAGE.md, plus chunking by <!--id:key--> markers.

The document is the single source of the prose: the site template (src/index.tpl.html) pulls chunks with {{md:key}},
so the page and the document cannot disagree. Supports what the document uses: headings, paragraphs, lists, tables,
fenced code, blockquotes, inline code, italic, links, and <!--GEN:name--> blocks (filled with the HTML table).
"""
import html, re


def chunks(md):
    """Return {key: [lines]}. A heading directly before an id marker belongs to that chunk (## headings are dropped, the template has its own)."""
    lines = md.split('\n')
    out, key, buf = {}, 'intro', []
    i = 0
    while i < len(lines):
        m = re.match(r'<!--id:([a-z0-9-]+)-->', lines[i])
        if m:
            heading = None
            while buf and not buf[-1].strip():
                buf.pop()
            if buf and re.match(r'#{2,4} ', buf[-1]):
                heading = buf.pop()
            out[key] = buf
            key, buf = m.group(1), ([heading] if heading and not heading.startswith('## ') else [])
        else:
            buf.append(lines[i])
        i += 1
    out[key] = buf
    return out


def inline(t):
    codes = []

    def keep(m):
        codes.append(m.group(1))
        return f'\x00{len(codes) - 1}\x00'
    t = re.sub(r'`([^`]+)`', keep, t)
    t = html.escape(t, quote=False)
    t = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', t)
    t = re.sub(r'(?<![">\w])(https://[^\s<)]+[^\s<).,])', r'<a href="\1">\1</a>', t)
    t = re.sub(r'(?<![\w*])\*([^*\n]+)\*(?![\w*])', r'<em>\1</em>', t)
    return re.sub(r'\x00(\d+)\x00', lambda m: '<code>' + html.escape(codes[int(m.group(1))], quote=False) + '</code>', t)


def to_html(lines, gen):
    out, i, n = [], 0, len(lines)
    while i < n:
        ln = lines[i]
        if not ln.strip():
            i += 1
            continue
        g = re.match(r'<!--GEN:([a-z-]+)-->', ln)
        if g:
            out.append(gen.get(g.group(1), ''))
            while i < n and not lines[i].startswith('<!--/GEN'):
                i += 1
            i += 1
            continue
        if ln.startswith('```'):
            j = i + 1
            while j < n and not lines[j].startswith('```'):
                j += 1
            out.append('<pre><code>' + html.escape('\n'.join(lines[i + 1:j]), quote=False) + '</code></pre>')
            i = j + 1
            continue
        h = re.match(r'(#{3,4}) (.*)', ln)
        if h:
            lvl = len(h.group(1))
            out.append(f'<h{lvl}>{inline(h.group(2))}</h{lvl}>')
            i += 1
            continue
        if ln.startswith('|'):
            rows = []
            while i < n and lines[i].startswith('|'):
                rows.append([c.strip() for c in lines[i].strip().strip('|').split('|')])
                i += 1
            body = [r for r in rows[2:]]
            out.append('<div class="tbl-wrap"><table><thead><tr>' + ''.join(f'<th scope="col">{inline(c)}</th>' for c in rows[0]) + '</tr></thead><tbody>' +
                       ''.join('<tr>' + ''.join(('<th scope="row">' if k == 0 else '<td>') + inline(c) + ('</th>' if k == 0 else '</td>') for k, c in enumerate(r)) + '</tr>' for r in body) + '</tbody></table></div>')
            continue
        if re.match(r'(- |\d+\. )', ln):
            ordered = ln[0].isdigit()
            items = []
            while i < n and re.match(r'(- |\d+\. )', lines[i]):
                items.append(re.sub(r'^(- |\d+\. )', '', lines[i]))
                i += 1
            tag = 'ol' if ordered else 'ul'
            out.append(f'<{tag}>' + ''.join(f'<li>{inline(x)}</li>' for x in items) + f'</{tag}>')
            continue
        para = []
        while i < n and lines[i].strip() and not re.match(r'(#{3,4} |\||- |\d+\. |```|<!--GEN)', lines[i]):
            para.append(lines[i])
            i += 1
        out.append('<p>' + inline(' '.join(para)) + '</p>')
    return '\n'.join(out)


def assemble(tpl, md, gen):
    ch = chunks(md)
    missing = []

    def sub(m):
        k = m.group(1)
        if k not in ch:
            missing.append(k)
            return ''
        return to_html(ch[k], gen)
    out = re.sub(r'\{\{md:([a-z0-9-]+)\}\}', sub, tpl)
    return out, missing
