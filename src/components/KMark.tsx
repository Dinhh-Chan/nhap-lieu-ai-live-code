import React from "react";

interface KMarkProps {
  content?: string;
  className?: string;
}

const escapeHtml = (unsafe: string) =>
  unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const renderMarkdown = (raw: string): string => {
  if (!raw) return "";
  let s = raw.replace(/\r\n?/g, "\n");

  // Extract fenced code blocks first
  const codeBlocks: string[] = [];
  s = s.replace(/```([\s\S]*?)```/g, (_m, p1) => {
    const idx = codeBlocks.push(escapeHtml(p1.trim())) - 1;
    return `\n{{KMARK-CODE-BLOCK-${idx}}}\n`;
  });

  // Extract inline code to protect from other replacements
  const inlineCodes: string[] = [];
  s = s.replace(/`([^`]+)`/g, (_m, p1) => {
    const idx = inlineCodes.push(escapeHtml(p1)) - 1;
    return `{{KMARK-INLINE-CODE-${idx}}}`;
  });

  // Escape HTML
  s = escapeHtml(s);

  // Headings
  s = s.replace(/^######\s+(.*)$/gm, '<h6>$1</h6>');
  s = s.replace(/^#####\s+(.*)$/gm, '<h5>$1</h5>');
  s = s.replace(/^####\s+(.*)$/gm, '<h4>$1</h4>');
  s = s.replace(/^###\s+(.*)$/gm, '<h3>$1</h3>');
  s = s.replace(/^##\s+(.*)$/gm, '<h2>$1</h2>');
  s = s.replace(/^#\s+(.*)$/gm, '<h1>$1</h1>');

  // Bold (before italic to avoid conflicts)
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/__(.+?)__/g, '<strong>$1</strong>');

  // Italic
  s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');
  s = s.replace(/_(.+?)_/g, '<em>$1</em>');

  // Strikethrough
  s = s.replace(/~~(.+?)~~/g, '<del>$1</del>');

  // Em dash (-- becomes —)
  s = s.replace(/--/g, '—');

  // Horizontal rule
  s = s.replace(/^(-{3,}|\*{3,}|_{3,})$/gm, '<hr/>');

  // Links [text](url)
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Images ![alt](url)
  s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto;"/>' );

  // Ordered lists
  s = s.replace(/^(\d+\.\s+.+(\n\d+\.\s+.+)*)$/gm, (block) => {
    const items = block
      .split(/\n/)
      .map((line) => line.replace(/^\d+\.\s+/, "").trim())
      .filter(li => li)
      .map((li) => `<li>${li}</li>`)
      .join("");
    return `<ol>${items}</ol>`;
  });

  // Unordered lists (supporting -, *, +)
  s = s.replace(/^([*\-+]\s+.+(\n[*\-+]\s+.+)*)$/gm, (block) => {
    const items = block
      .split(/\n/)
      .map((line) => line.replace(/^[*\-+]\s+/, "").trim())
      .filter(li => li)
      .map((li) => `<li>${li}</li>`)
      .join("");
    return `<ul>${items}</ul>`;
  });

  // Blockquotes
  s = s.replace(/^>\s+(.*)$/gm, '<blockquote>$1</blockquote>');

  // Paragraphs
  s = s
    .split(/\n{2,}/)
    .map((para) => {
      para = para.trim();
      if (!para) return "";
      // Skip if already a block element
      if (/^<(h[1-6]|ul|ol|pre|code|blockquote|hr|div)[\s>]/.test(para)) return para;
      return `<p>${para.replace(/\n/g, '<br/>')}</p>`;
    })
    .filter(p => p)
    .join("");

  // Restore inline code
  s = s.replace(/\{\{KMARK-INLINE-CODE-(\d+)\}\}/g, (_m, idx) => {
    const code = inlineCodes[Number(idx)] || "";
    return `<code class=\"kmark-code-inline\">${code}</code>`;
  });

  // Restore fenced code blocks
  s = s.replace(/\{\{KMARK-CODE-BLOCK-(\d+)\}\}/g, (_m, idx) => {
    const code = codeBlocks[Number(idx)] || "";
    return `<pre class=\"kmark-pre\"><code class=\"kmark-code\">${code}</code></pre>`;
  });

  return s;
};

const KMark: React.FC<KMarkProps> = ({ content, className }) => {
  const html = React.useMemo(() => renderMarkdown(content || ""), [content]);
  return (
    <div className={className}>
      <style>{`
        .kmark h1 { font-size: 2em; font-weight: bold; margin: 0.67em 0; }
        .kmark h2 { font-size: 1.5em; font-weight: bold; margin: 0.75em 0; }
        .kmark h3 { font-size: 1.17em; font-weight: bold; margin: 0.83em 0; }
        .kmark h4 { font-size: 1em; font-weight: bold; margin: 1.12em 0; }
        .kmark h5 { font-size: 0.83em; font-weight: bold; margin: 1.5em 0; }
        .kmark h6 { font-size: 0.75em; font-weight: bold; margin: 1.67em 0; }
        .kmark p { margin: 1em 0; line-height: 1.6; }
        .kmark ul, .kmark ol { margin: 1em 0; padding-left: 2em; }
        .kmark ul { list-style-type: disc; }
        .kmark ol { list-style-type: decimal; }
        .kmark li { margin: 0.5em 0; }
        .kmark strong { font-weight: bold; }
        .kmark em { font-style: italic; }
        .kmark del { text-decoration: line-through; }
        .kmark code.kmark-code-inline { 
          background: #f3f4f6; 
          padding: 0.2em 0.4em; 
          border-radius: 3px; 
          font-family: 'Courier New', monospace;
          font-size: 0.9em;
        }
        .kmark pre.kmark-pre { 
          background: #1e293b; 
          color: #e2e8f0;
          padding: 1em; 
          border-radius: 6px; 
          overflow-x: auto;
          margin: 1em 0;
          white-space: pre-wrap;
        }
        .kmark code.kmark-code { 
          font-family: 'Courier New', monospace;
          font-size: 0.9em;
        }
        .kmark blockquote {
          border-left: 4px solid #3b82f6;
          padding-left: 1em;
          margin: 1em 0;
          color: #64748b;
          font-style: italic;
        }
        .kmark hr {
          border: none;
          border-top: 2px solid #e2e8f0;
          margin: 2em 0;
        }
        .kmark a {
          color: #3b82f6;
          text-decoration: underline;
        }
        .kmark a:hover {
          color: #2563eb;
        }
      `}</style>
      <div
        className={`kmark`}
        style={{
          fontFamily:
            'Inter, system-ui, -apple-system, "Segoe UI", "Roboto", "Noto Sans", "Helvetica Neue", Arial, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"',
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
};

export default KMark;

