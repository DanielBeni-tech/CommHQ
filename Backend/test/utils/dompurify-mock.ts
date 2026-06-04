/**
 * Mock minimal de `isomorphic-dompurify` pour les tests e2e.
 *
 * En production, `isomorphic-dompurify` charge `jsdom` et toute son arborescence
 * de modules ES — coûteux à transformer pour Jest et inutile ici. Notre
 * `sanitize.util.ts` applique de toute façon une **deuxième passe regex**
 * qui retire les balises dangereuses indépendamment de DOMPurify, donc nos
 * tests d'XSS restent valides.
 *
 * Ce mock honore les options minimales utilisées par notre code :
 *   - `ALLOWED_TAGS: []` → on retire toutes les balises HTML
 *   - `KEEP_CONTENT: true` → on garde le texte à l'intérieur
 */
function sanitize(
  input: unknown,
  options: { ALLOWED_TAGS?: string[]; KEEP_CONTENT?: boolean } = {},
): string {
  if (typeof input !== 'string') return '';

  const stripAll = options.ALLOWED_TAGS && options.ALLOWED_TAGS.length === 0;
  const keepContent = options.KEEP_CONTENT ?? true;

  if (!stripAll) {
    return input;
  }

  if (keepContent) {
    // On retire toutes les balises HTML mais on conserve le contenu textuel.
    return input.replace(/<\/?[^>]+>/g, '');
  }
  // Sinon on retire balises ET contenu (cas non utilisé par notre code).
  return input.replace(/<[^>]+>[\s\S]*?<\/[^>]+>/g, '').replace(/<[^/][^>]*>/g, '');
}

const DOMPurifyMock = { sanitize };

export default DOMPurifyMock;
module.exports = DOMPurifyMock;
module.exports.default = DOMPurifyMock;
