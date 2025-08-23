const linkPattern = /\{@link\s+(?<class>[a-zA-Z.]+)?#?(?<member>[a-zA-Z]*)?(?:\|(?<label>[^}]+))?\}/g;

function _buildLinkText(cls = '', mem = '', lbl) {
  if (lbl) return lbl;
  if (cls && mem) return `${cls}#${mem}`;
  return cls || mem || '';
}

export function replaceLinkWithReference(html) {
  return html.replaceAll(linkPattern, (_, cls, mem, lbl) => {
    const text = _buildLinkText(cls, mem, lbl);
    return `<a href="#" class="jsdoc-ref" data-ref="${mem || cls}">${text}</a>`;
  });
}
