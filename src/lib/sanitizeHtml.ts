const ALLOWED_TAGS = new Set([
  "P",
  "BR",
  "STRONG",
  "B",
  "EM",
  "I",
  "U",
  "H1",
  "H2",
  "H3",
  "H4",
  "UL",
  "OL",
  "LI",
  "A",
  "BLOCKQUOTE",
  "SPAN",
  "DIV",
]);

function sanitizeNode(node: Node, doc: Document) {
  if (node.nodeType === Node.TEXT_NODE) return;
  if (node.nodeType !== Node.ELEMENT_NODE) {
    node.parentNode?.removeChild(node);
    return;
  }
  const el = node as HTMLElement;
  if (!ALLOWED_TAGS.has(el.tagName)) {
    const parent = el.parentNode;
    const kids = [...el.childNodes];
    kids.forEach((child) => parent?.insertBefore(child, el));
    parent?.removeChild(el);
    kids.forEach((child) => sanitizeNode(child, doc));
    return;
  }
  [...el.attributes].forEach((attr) => {
    const name = attr.name.toLowerCase();
    if (el.tagName === "A" && (name === "href" || name === "target" || name === "rel")) return;
    el.removeAttribute(attr.name);
  });
  if (el.tagName === "A") {
    const href = el.getAttribute("href") || "";
    if (!/^(https?:|mailto:|\/|#)/i.test(href)) el.removeAttribute("href");
    el.setAttribute("rel", "noopener noreferrer");
    if (href.startsWith("http")) el.setAttribute("target", "_blank");
  }
  [...el.childNodes].forEach((child) => sanitizeNode(child, doc));
}

export function looksLikeHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

export function sanitizeHtml(html: string) {
  if (typeof window === "undefined" || !html.trim()) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  [...doc.body.childNodes].forEach((node) => sanitizeNode(node, doc));
  return doc.body.innerHTML;
}

export function isEmptyHtml(html: string) {
  return !html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}
