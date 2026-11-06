import {Fragment, type ReactNode} from 'react';
import {MARK_TEXT_COLOR, highlightColorOf} from '../materialModel';

/**
 * Markdown subset used by generated documents (same syntax the legacy viewer
 * handled): `##` / `###` headings, `**bold**`, `> quote`, `[text](#anchor)`
 * index links and `<mark>author</mark>` highlights. Emitted as React elements
 * (no HTML injection). Lists (`-`, `1.`) are rendered as lists.
 */

const INLINE = /(<mark[^>]*>([\s\S]*?)<\/mark>)|(\*\*([^*\n]+?)\*\*)|(\[([^\]\n]+)\]\(#([^)\s]*)\))/gi;

function slug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function renderInline(text: string, colorId: string | undefined, key: string): ReactNode[] {
  const color = highlightColorOf(colorId);
  const out: ReactNode[] = [];
  let last = 0;
  let n = 0;
  for (const m of text.matchAll(INLINE)) {
    const start = m.index ?? 0;
    if (start > last) out.push(text.slice(last, start));
    const k = `${key}-${n++}`;
    if (m[1]) {
      out.push(
        <mark
          key={k}
          className="rounded-small px-1.5 py-0.5 font-semibold"
          style={{backgroundColor: color.bg, color: MARK_TEXT_COLOR}}
        >
          {m[2]}
        </mark>,
      );
    } else if (m[3]) {
      out.push(<strong key={k}>{m[4]}</strong>);
    } else if (m[5]) {
      out.push(
        <a
          key={k}
          href={`#${m[7]}`}
          className="text-primary-text underline underline-offset-2 hover:text-primary-hover"
          onClick={(e) => {
            // The router owns the URL: scroll to the heading without changing it.
            e.preventDefault();
            document.getElementById(`doc-${m[7]}`)?.scrollIntoView({block: 'start'});
          }}
        >
          {m[6]}
        </a>,
      );
    }
    last = start + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const H2 = /^##\s+(.*)$/;
const H3 = /^###\s+(.*)$/;
const H1 = /^#\s+(.*)$/;
const QUOTE = /^>\s?(.*)$/;
const BULLET = /^\s*[-*+]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;

export function DocumentText({text, highlightColor}: {text: string; highlightColor?: string}) {
  const lines = (text || '').replace(/\r\n?/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let para: string[] = [];
  let i = 0;
  let b = 0;

  const flush = () => {
    if (!para.length) return;
    const key = `p${b++}`;
    blocks.push(
      <p key={key} className="whitespace-pre-wrap">
        {renderInline(para.join('\n'), highlightColor, key)}
      </p>,
    );
    para = [];
  };

  while (i < lines.length) {
    const line = lines[i];
    const key = `b${b}`;
    let m: RegExpExecArray | null;

    if (!line.trim()) {
      flush();
      i++;
    } else if ((m = H3.exec(line))) {
      flush();
      b++;
      blocks.push(
        <h3 key={key} id={`doc-${slug(m[1])}`} className="mt-4 text-body-strong text-primary-on-tint">
          {renderInline(m[1], highlightColor, key)}
        </h3>,
      );
      i++;
    } else if ((m = H2.exec(line)) || (m = H1.exec(line))) {
      flush();
      b++;
      blocks.push(
        <h2 key={key} id={`doc-${slug(m[1])}`} className="mt-6 border-b border-hairline pb-1 text-h3 text-strong">
          {renderInline(m[1], highlightColor, key)}
        </h2>,
      );
      i++;
    } else if ((m = QUOTE.exec(line))) {
      flush();
      b++;
      const quote: string[] = [];
      while (i < lines.length && (m = QUOTE.exec(lines[i]))) {
        quote.push(m[1]);
        i++;
      }
      blocks.push(
        <blockquote key={key} className="rounded-r-control border-l-4 border-primary bg-primary-tint py-1 pl-3 pr-2 italic text-primary-on-tint">
          {renderInline(quote.join('\n'), highlightColor, key)}
        </blockquote>,
      );
    } else if (BULLET.test(line) || NUMBERED.test(line)) {
      flush();
      b++;
      const ordered = !BULLET.test(line);
      const matcher = ordered ? NUMBERED : BULLET;
      const items: string[] = [];
      while (i < lines.length && (m = matcher.exec(lines[i]))) {
        items.push(m[1]);
        i++;
      }
      const List = ordered ? 'ol' : 'ul';
      blocks.push(
        <List key={key} className={`space-y-1 pl-6 ${ordered ? 'list-decimal' : 'list-disc'}`}>
          {items.map((item, j) => (
            <li key={j}>{renderInline(item, highlightColor, `${key}-${j}`)}</li>
          ))}
        </List>,
      );
    } else {
      para.push(line);
      i++;
    }
  }
  flush();

  return (
    <div className="flex flex-col gap-3 text-body text-default [&>h2:first-child]:mt-0 [&>h3:first-child]:mt-0">
      {blocks.map((block, idx) => (
        <Fragment key={idx}>{block}</Fragment>
      ))}
    </div>
  );
}
