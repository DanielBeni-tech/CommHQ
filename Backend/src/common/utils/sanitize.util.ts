import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitisation XSS du contenu utilisateur.
 *
 * IMPORTANT — Principe :
 *   - Les messages sont stockés en **Markdown brut**.
 *   - Le rendu HTML (côté client) est sanitisé avec rehype-sanitize.
 *   - Côté serveur, on supprime malgré tout toute balise HTML potentiellement
 *     dangereuse injectée DANS le Markdown brut (ex. <script>alert(1)</script>).
 *
 * Cette double barrière garantit que même si le frontend oubliait de sanitiser,
 * aucun script malveillant ne pourrait être stocké en base.
 *
 * On conserve les caractères Markdown classiques (`#`, `*`, `_`, backticks…) intacts.
 */

const DANGEROUS_TAGS = [
  'script',
  'iframe',
  'object',
  'embed',
  'style',
  'link',
  'meta',
  'base',
  'form',
  'input',
  'button',
];

const DANGEROUS_ATTRS = [
  'onerror',
  'onclick',
  'onload',
  'onmouseover',
  'onfocus',
  'onblur',
  'onchange',
  'onsubmit',
];

/**
 * Nettoie un contenu Markdown brut destiné à être stocké en base.
 *
 * - Supprime les balises HTML dangereuses (script, iframe, etc.) et leur contenu.
 * - Supprime les gestionnaires d'événements inline (onerror=, onclick=, …).
 * - Préserve la syntaxe Markdown.
 *
 * @param rawContent Contenu brut envoyé par l'utilisateur.
 * @returns Contenu nettoyé, sûr à stocker.
 */
export function sanitizeMarkdownContent(rawContent: string): string {
  if (typeof rawContent !== 'string') {
    return '';
  }

  // 1) Première passe : DOMPurify supprime le HTML dangereux mais conserve le texte.
  //    On garde le mode "texte" : tout le HTML inclus dans le Markdown est strippé.
  const sanitized = DOMPurify.sanitize(rawContent, {
    ALLOWED_TAGS: [], // pas de HTML dans nos messages (le rendu se fait via Markdown)
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true, // on garde le texte à l'intérieur des balises retirées
  });

  // 2) Deuxième passe défensive : si DOMPurify a laissé passer une balise via
  //    une syntaxe exotique, on supprime manuellement les patterns connus.
  let cleaned = sanitized;
  for (const tag of DANGEROUS_TAGS) {
    const tagPattern = new RegExp(`<\\s*\\/?\\s*${tag}\\b[^>]*>`, 'gi');
    cleaned = cleaned.replace(tagPattern, '');
  }
  for (const attr of DANGEROUS_ATTRS) {
    const attrPattern = new RegExp(`${attr}\\s*=\\s*("[^"]*"|'[^']*'|[^\\s>]+)`, 'gi');
    cleaned = cleaned.replace(attrPattern, '');
  }

  // 3) Suppression des javascript:URL dans les liens Markdown [texte](javascript:...).
  cleaned = cleaned.replace(/\]\(\s*javascript:[^)]*\)/gi, '](#)');

  return cleaned.trim();
}

/**
 * Sanitisation d'un texte simple (nom d'utilisateur, nom de canal, etc.).
 * Aucune balise HTML n'est tolérée.
 */
export function sanitizePlainText(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim();
}
