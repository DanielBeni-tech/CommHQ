import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

import { CodeBlock } from "@/components/chat/CodeBlock";

// Schéma de sanitisation : on autorise la classe de langage sur <code>
// et les cases à cocher des listes de tâches GFM. Tout le reste est nettoyé
// pour empêcher toute injection XSS (exigence NF-1 du cahier des charges).
const schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), "className"],
    input: [
      ...(defaultSchema.attributes?.input ?? []),
      "type",
      "checked",
      "disabled",
    ],
  },
  tagNames: [...(defaultSchema.tagNames ?? []), "input"],
};

export const MarkdownRenderer = memo(function MarkdownRenderer({
  content,
}: {
  content: string;
}) {
  return (
    <div className="syntra-markdown text-sm leading-relaxed break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, schema]]}
        components={{
          code({ className, children }) {
            const match = /language-(\w+)/.exec(className ?? "");
            const text = String(children ?? "").replace(/\n$/, "");
            const isBlock = Boolean(match) || text.includes("\n");
            if (isBlock) {
              return <CodeBlock code={text} lang={match?.[1] ?? "text"} />;
            }
            return (
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">
                {children}
              </code>
            );
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline-offset-2 hover:underline"
              >
                {children}
              </a>
            );
          },
          ul: ({ children }) => <ul className="my-1 list-disc pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="my-1 list-decimal pl-5">{children}</ol>,
          li: ({ children }) => <li className="my-0.5">{children}</li>,
          h1: ({ children }) => <h1 className="mt-2 mb-1 text-lg font-semibold">{children}</h1>,
          h2: ({ children }) => <h2 className="mt-2 mb-1 text-base font-semibold">{children}</h2>,
          h3: ({ children }) => <h3 className="mt-2 mb-1 text-sm font-semibold">{children}</h3>,
          p: ({ children }) => <p className="my-1">{children}</p>,
          blockquote: ({ children }) => (
            <blockquote className="my-1 border-l-2 border-primary/50 pl-3 text-muted-foreground">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="my-2 overflow-x-auto">
              <table className="w-full border-collapse text-xs">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border px-2 py-1 text-left font-semibold">{children}</th>
          ),
          td: ({ children }) => <td className="border px-2 py-1">{children}</td>,
          input: ({ ...props }) => (
            <input
              {...props}
              disabled
              className="mr-1 translate-y-[1px] accent-primary"
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});
