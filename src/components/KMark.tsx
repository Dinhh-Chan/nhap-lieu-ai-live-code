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
  
  // Remove standalone "kmark" line if present
  s = s.replace(/^kmark\s*$/gm, "").trim();

  // Storage for HTML elements to avoid double-escaping
  const htmlElements: string[] = [];

  // Extract fenced code blocks
  s = s.replace(/```([\s\S]*?)```/g, (_m, p1) => {
    htmlElements.push(`<pre class="kmark-pre"><code class="kmark-code">${escapeHtml(p1.trim())}</code></pre>`);
    return `\n{{HTML-${htmlElements.length - 1}}}\n`;
  });

  // Extract inline code
  s = s.replace(/`([^`]+)`/g, (_, p1) => {
    htmlElements.push(`<code class="kmark-code-inline">${escapeHtml(p1)}</code>`);
    return `{{HTML-${htmlElements.length - 1}}}`;
  });

  // Process headings
  s = s.replace(/^######\s+(.+)$/gm, (_, text) => {
    htmlElements.push(`<h6>${escapeHtml(text)}</h6>`);
    return `{{HTML-${htmlElements.length - 1}}}`;
  });
  s = s.replace(/^#####\s+(.+)$/gm, (_, text) => {
    htmlElements.push(`<h5>${escapeHtml(text)}</h5>`);
    return `{{HTML-${htmlElements.length - 1}}}`;
  });
  s = s.replace(/^####\s+(.+)$/gm, (_, text) => {
    htmlElements.push(`<h4>${escapeHtml(text)}</h4>`);
    return `{{HTML-${htmlElements.length - 1}}}`;
  });
  s = s.replace(/^###\s+(.+)$/gm, (_, text) => {
    htmlElements.push(`<h3>${escapeHtml(text)}</h3>`);
    return `{{HTML-${htmlElements.length - 1}}}`;
  });
  s = s.replace(/^##\s+(.+)$/gm, (_, text) => {
    htmlElements.push(`<h2>${escapeHtml(text)}</h2>`);
    return `{{HTML-${htmlElements.length - 1}}}`;
  });
  s = s.replace(/^#\s+(.+)$/gm, (_, text) => {
    htmlElements.push(`<h1>${escapeHtml(text)}</h1>`);
    return `{{HTML-${htmlElements.length - 1}}}`;
  });

  // Escape HTML
  s = escapeHtml(s);

  // Process bold
  s = s.replace(/\*\*(.+?)\*\*/g, (_, text) => {
    htmlElements.push(`<strong>${text}</strong>`);
    return `{{HTML-${htmlElements.length - 1}}}`;
  });
  s = s.replace(/__(.+?)__/g, (_, text) => {
    htmlElements.push(`<strong>${text}</strong>`);
    return `{{HTML-${htmlElements.length - 1}}}`;
  });

  // Process italic
  s = s.replace(/\*(.+?)\*/g, (_, text) => {
    htmlElements.push(`<em>${text}</em>`);
    return `{{HTML-${htmlElements.length - 1}}}`;
  });
  s = s.replace(/_(.+?)_/g, (_, text) => {
    htmlElements.push(`<em>${text}</em>`);
    return `{{HTML-${htmlElements.length - 1}}}`;
  });

  // Strikethrough
  s = s.replace(/~~(.+?)~~/g, (_, text) => {
    htmlElements.push(`<del>${text}</del>`);
    return `{{HTML-${htmlElements.length - 1}}}`;
  });

  // Process ordered lists
  s = s.replace(/(?:^|\n)((?:\d+\.\s+.+(?:\n|$))+)/gm, (_, block) => {
    const lines = block.split(/\n/).filter(l => l.trim());
    if (!lines.some(l => /^\d+\./.test(l))) return block;
    const items = lines
      .map(line => {
        const content = line.replace(/^\d+\.\s+/, "");
        return `<li>${content}</li>`;
      })
      .join("");
    htmlElements.push(`<ol>${items}</ol>`);
    return `\n{{HTML-${htmlElements.length - 1}}}\n`;
  });

  // Process unordered lists
  s = s.replace(/(?:^|\n)((?:[*\-+]\s+.+(?:\n|$))+)/gm, (_, block) => {
    const lines = block.split(/\n/).filter(l => l.trim());
    if (!lines.some(l => /^[*\-+]\s+/.test(l))) return block;
    const items = lines
      .map(line => {
        const content = line.replace(/^[*\-+]\s+/, "");
        return `<li>${content}</li>`;
      })
      .join("");
    htmlElements.push(`<ul>${items}</ul>`);
    return `\n{{HTML-${htmlElements.length - 1}}}\n`;
  });

  // Blockquotes
  s = s.replace(/^&gt;\s+(.*)$/gm, (_, text) => {
    htmlElements.push(`<blockquote>${text}</blockquote>`);
    return `{{HTML-${htmlElements.length - 1}}}`;
  });

  // Links
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
    htmlElements.push(`<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`);
    return `{{HTML-${htmlElements.length - 1}}}`;
  });

  // Images
  s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, url) => {
    htmlElements.push(`<img src="${url}" alt="${alt}" style="max-width: 100%; height: auto;"/>`);
    return `{{HTML-${htmlElements.length - 1}}}`;
  });

  // Horizontal rule
  s = s.replace(/^(?:-{3,}|\*{3,}|_{3,})$/gm, () => {
    htmlElements.push(`<hr/>`);
    return `{{HTML-${htmlElements.length - 1}}}`;
  });

  // Em dash
  s = s.replace(/\s--\s/g, " — ");

  // Paragraphs (split by double newline)
  s = s
    .split(/\n{2,}/)
    .map(para => {
      para = para.trim();
      if (!para) return "";
      // Skip if already contains HTML placeholder
      if (/\{\{HTML-\d+\}\}/.test(para)) return para;
      // Skip if is HTML element
      if (/^{{HTML-/.test(para)) return para;
      // Wrap in paragraph
      return `<p>${para.replace(/\n/g, "<br/>")}</p>`;
    })
    .filter(p => p)
    .join("\n");

  // Restore all HTML elements (may need multiple passes for nested placeholders)
  let maxIterations = 10;
  while (/\{\{HTML-\d+\}\}/.test(s) && maxIterations > 0) {
    s = s.replace(/\{\{HTML-(\d+)\}\}/g, (_, idx) => {
      return htmlElements[Number(idx)] || "";
    });
    maxIterations--;
  }

  return s;
};

const KMark: React.FC<KMarkProps> = ({ content, className }) => {
  const html = React.useMemo(() => renderMarkdown(content || ""), [content]);
  return (
    <div className={className}>
      <style>{`
        .kmark {
          font-family: Inter, system-ui, -apple-system, "Segoe UI", "Roboto", "Noto Sans", "Helvetica Neue", Arial, sans-serif;
          color: #1e293b;
          line-height: 1.75;
        }
        .kmark h1 { 
          font-size: 2.25rem; 
          font-weight: 800; 
          margin: 1.5rem 0 1rem 0; 
          line-height: 1.2;
          color: #0f172a;
        }
        .kmark h2 { 
          font-size: 1.875rem; 
          font-weight: 700; 
          margin: 2rem 0 0.75rem 0; 
          line-height: 1.3;
          color: #1e293b;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #e2e8f0;
        }
        .kmark h3 { 
          font-size: 1.5rem; 
          font-weight: 600; 
          margin: 1.5rem 0 0.5rem 0; 
          line-height: 1.4;
          color: #334155;
        }
        .kmark h4 { 
          font-size: 1.25rem; 
          font-weight: 600; 
          margin: 1.25rem 0 0.5rem 0; 
          color: #475569;
        }
        .kmark h5 { 
          font-size: 1.125rem; 
          font-weight: 600; 
          margin: 1rem 0 0.5rem 0; 
          color: #64748b;
        }
        .kmark h6 { 
          font-size: 1rem; 
          font-weight: 600; 
          margin: 1rem 0 0.5rem 0; 
          color: #64748b;
        }
        .kmark p { 
          margin: 1rem 0; 
          line-height: 1.75; 
          color: #334155;
        }
        .kmark ul, .kmark ol { 
          margin: 1rem 0; 
          padding-left: 2rem; 
        }
        .kmark ul { 
          list-style-type: disc; 
        }
        .kmark ol { 
          list-style-type: decimal; 
        }
        .kmark li { 
          margin: 0.5rem 0; 
          line-height: 1.75;
          color: #334155;
        }
        .kmark li::marker {
          color: #64748b;
        }
        .kmark strong { 
          font-weight: 600; 
          color: #0f172a;
        }
        .kmark em { 
          font-style: italic; 
        }
        .kmark del { 
          text-decoration: line-through; 
          opacity: 0.7;
        }
        .kmark code.kmark-code-inline { 
          background: #f1f5f9; 
          padding: 0.2em 0.4em; 
          border-radius: 4px; 
          font-family: 'Courier New', 'Monaco', 'Menlo', monospace;
          font-size: 0.875em;
          color: #e11d48;
          border: 1px solid #e2e8f0;
        }
        .kmark pre.kmark-pre { 
          background: #1e293b; 
          color: #e2e8f0;
          padding: 1.25rem; 
          border-radius: 8px; 
          overflow-x: auto;
          margin: 1.5rem 0;
          white-space: pre-wrap;
          border: 1px solid #334155;
        }
        .kmark code.kmark-code { 
          font-family: 'Courier New', 'Monaco', 'Menlo', monospace;
          font-size: 0.875em;
          color: #e2e8f0;
        }
        .kmark blockquote {
          border-left: 4px solid #3b82f6;
          padding: 0.75rem 1rem;
          margin: 1.5rem 0;
          color: #64748b;
          font-style: italic;
          background: #f8fafc;
          border-radius: 0 6px 6px 0;
        }
        .kmark hr {
          border: none;
          border-top: 2px solid #e2e8f0;
          margin: 2rem 0;
        }
        .kmark a {
          color: #3b82f6;
          text-decoration: none;
          font-weight: 500;
        }
        .kmark a:hover {
          color: #2563eb;
          text-decoration: underline;
        }
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .kmark {
            color: #e2e8f0;
          }
          .kmark h1 {
            color: #f1f5f9;
          }
          .kmark h2 {
            color: #e2e8f0;
            border-bottom-color: #475569;
          }
          .kmark h3 {
            color: #cbd5e1;
          }
          .kmark p, .kmark li {
            color: #cbd5e1;
          }
          .kmark strong {
            color: #f1f5f9;
          }
          .kmark code.kmark-code-inline {
            background: #1e293b;
            color: #fbbf24;
            border-color: #334155;
          }
          .kmark blockquote {
            background: #1e293b;
            color: #94a3b8;
            border-left-color: #60a5fa;
          }
        }
      `}</style>
      <div
        className="kmark"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
};

export default KMark;
