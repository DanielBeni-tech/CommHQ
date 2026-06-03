import type { Highlighter } from "shiki";

const LANGS = [
  "javascript",
  "typescript",
  "tsx",
  "jsx",
  "json",
  "python",
  "java",
  "sql",
  "bash",
  "yaml",
  "html",
  "css",
  "markdown",
] as const;

const THEMES = ["github-light", "github-dark"] as const;

let highlighterPromise: Promise<Highlighter> | null = null;

export function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = import("shiki").then((shiki) =>
      shiki.createHighlighter({
        themes: [...THEMES],
        langs: [...LANGS],
      })
    );
  }
  return highlighterPromise;
}

export function isSupportedLang(lang: string): boolean {
  return (LANGS as readonly string[]).includes(lang);
}

export const SHIKI_THEMES = {
  light: "github-light",
  dark: "github-dark",
} as const;
