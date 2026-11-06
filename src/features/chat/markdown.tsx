import {Fragment, type ReactNode} from 'react';

/**
 * Tiny, safe Markdown-subset renderer for assistant answers (UX-16).
 * Supported: **bold**, *italic*, `inline code`, fenced code, bullet and numbered
 * lists, headings (# to ####, rendered as strong text) and [text](http(s) url).
 * Everything is emitted as React elements, so all text is escaped by React;
 * there is no HTML injection path.
 */

export type MarkdownBlock =
  | {kind: 'p'; text: string}
  | {kind: 'h'; text: string}
  | {kind: 'ul' | 'ol'; items: string[]}
  | {kind: 'code'; text: string};

const FENCE = /^```/;
const HEADING = /^#{1,6}\s+(.*)$/;
const BULLET = /^\s*[-*+]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;

export function parseMarkdown(source: string): MarkdownBlock[] {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const blocks: MarkdownBlock[] = [];
  let para: string[] = [];

  const flushPara = () => {
    if (para.length) blocks.push({kind: 'p', text: para.join('\n')});
    para = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (FENCE.test(line.trim())) {
      flushPara();
      const code: string[] = [];
      i++;
      while (i < lines.length && !FENCE.test(lines[i].trim())) code.push(lines[i++]);
      blocks.push({kind: 'code', text: code.join('\n')});
      continue;
    }

    if (!line.trim()) {
      flushPara();
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      flushPara();
      blocks.push({kind: 'h', text: heading[1]});
      continue;
    }

    const bullet = BULLET.exec(line);
    const numbered = bullet ? null : NUMBERED.exec(line);
    if (bullet || numbered) {
      flushPara();
      const kind = bullet ? 'ul' : 'ol';
      const matcher = bullet ? BULLET : NUMBERED;
      const items: string[] = [];
      while (i < lines.length) {
        const m = matcher.exec(lines[i]);
        if (!m) break;
        items.push(m[1]);
        i++;
      }
      i--;
      blocks.push({kind, items});
      continue;
    }

    para.push(line);
  }
  flushPara();
  return blocks;
}

// Order matters: code, bold, italic, link, citation marker.
const INLINE =
  /(`[^`\n]+`)|(\*\*[^*\n]+?\*\*|__[^_\n]+?__)|(\*[^*\s][^*\n]*?\*)|(\[([^\]\n]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\))|(\[(\d+)\])/g;

export interface InlineOptions {
  /** Renders a `[n]` citation marker; return null to keep it as plain text. */
  renderCitation?: (index: number) => ReactNode | null;
}

export function renderInline(text: string, options: InlineOptions = {}, keyPrefix = 'i'): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let n = 0;
  for (const m of text.matchAll(INLINE)) {
    const start = m.index ?? 0;
    if (start > last) out.push(text.slice(last, start));
    const key = `${keyPrefix}-${n++}`;
    if (m[1]) {
      out.push(
        <code key={key} className="rounded-small bg-subtle px-1 py-0.5 font-mono text-small text-strong">
          {m[1].slice(1, -1)}
        </code>,
      );
    } else if (m[2]) {
      out.push(<strong key={key}>{renderInline(m[2].slice(2, -2), options, key)}</strong>);
    } else if (m[3]) {
      out.push(<em key={key}>{renderInline(m[3].slice(1, -1), options, key)}</em>);
    } else if (m[4]) {
      out.push(
        <a
          key={key}
          href={m[6]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-text underline underline-offset-2 hover:text-primary-hover"
        >
          {m[5]}
        </a>,
      );
    } else if (m[7]) {
      const citation = options.renderCitation?.(Number(m[8]));
      out.push(citation ? <Fragment key={key}>{citation}</Fragment> : m[7]);
    }
    last = start + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export interface MarkdownProps extends InlineOptions {
  text: string;
  className?: string;
}

export function Markdown({text, className, renderCitation}: MarkdownProps) {
  const options = {renderCitation};
  const blocks = parseMarkdown(text);
  return (
    <div className={className}>
      {blocks.map((b, i) => {
        const key = `b${i}`;
        switch (b.kind) {
          case 'h':
            return (
              <p key={key} className="mt-4 text-body-strong text-strong first:mt-0">
                {renderInline(b.text, options, key)}
              </p>
            );
          case 'ul':
          case 'ol': {
            const List = b.kind;
            return (
              <List
                key={key}
                className={`mt-2 space-y-1 pl-6 first:mt-0 ${b.kind === 'ul' ? 'list-disc' : 'list-decimal'}`}
              >
                {b.items.map((item, j) => (
                  <li key={j}>{renderInline(item, options, `${key}-${j}`)}</li>
                ))}
              </List>
            );
          }
          case 'code':
            return (
              <pre
                key={key}
                className="mt-2 overflow-x-auto rounded-control bg-subtle p-3 font-mono text-small text-strong first:mt-0"
              >
                <code>{b.text}</code>
              </pre>
            );
          default:
            return (
              <p key={key} className="mt-2 whitespace-pre-wrap first:mt-0">
                {renderInline(b.text, options, key)}
              </p>
            );
        }
      })}
    </div>
  );
}
