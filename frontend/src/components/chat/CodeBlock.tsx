import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getHighlighter, isSupportedLang, SHIKI_THEMES } from "@/lib/highlighter";
import { useUiStore } from "@/stores/uiStore";

interface CodeBlockProps {
  code: string;
  lang: string;
}

export function CodeBlock({ code, lang }: CodeBlockProps) {
  const theme = useUiStore((s) => s.theme);
  const [html, setHtml] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    const language = isSupportedLang(lang) ? lang : "text";
    getHighlighter()
      .then((hl) =>
        hl.codeToHtml(code, {
          lang: language === "text" ? "text" : language,
          theme: SHIKI_THEMES[theme],
        })
      )
      .then((result) => {
        if (active) setHtml(result);
      })
      .catch(() => {
        if (active) setHtml(null);
      });
    return () => {
      active = false;
    };
  }, [code, lang, theme]);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="group relative my-2 overflow-hidden rounded-lg border">
      <div className="flex items-center justify-between border-b bg-muted/50 px-3 py-1">
        <span className="font-mono text-xs text-muted-foreground">{lang || "code"}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={copy}
          aria-label="Copier le code"
        >
          {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
        </Button>
      </div>
      {html ? (
        <div
          className="overflow-x-auto p-3 text-sm [&_pre]:!bg-transparent [&_pre]:!m-0 [&_code]:font-mono"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="overflow-x-auto p-3 text-sm">
          <code className="font-mono">{code}</code>
        </pre>
      )}
    </div>
  );
}
