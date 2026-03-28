const escapeHtml = (value = "") =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const normalizeText = (value = "") =>
  String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .trim();

const stripBulletMarker = (value = "") =>
  value.replace(/^((?:<[^>]+>\s*)*)-\s*/, "$1");

const isBulletLine = (line = "") => /^\s*-\s*\S*/.test(line.trim());

const isBulletBlock = (lines = []) => {
  const nonEmpty = lines.filter((line) => line.trim() !== "");
  return nonEmpty.length > 0 && nonEmpty.every(isBulletLine);
};

const wrapInlineFormatting = (value = "", font = {}) => {
  const styleParts = [];
  const size = font?.sz;

  if (size) {
    styleParts.push(
      `font-size: ${typeof size === "number" ? `${size}pt` : String(size)}`,
    );
  }

  let html = escapeHtml(value);

  if (font?.italic) {
    html = `<em>${html}</em>`;
  }

  if (font?.bold) {
    html = `<strong>${html}</strong>`;
  }

  if (styleParts.length > 0) {
    return `<span style="${styleParts.join("; ")}">${html}</span>`;
  }

  return html;
};

const renderPlainTextBlocks = (text = "", font = {}) => {
  const lines = normalizeText(text).split("\n");
  const blocks = [];
  let bulletItems = [];

  const flushBullets = () => {
    if (!bulletItems.length) return;
    blocks.push(
      `<ul>${bulletItems
        .map((item) => `<li>${wrapInlineFormatting(item, font)}</li>`)
        .join("")}</ul>`,
    );
    bulletItems = [];
  };

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (trimmed === "") {
      flushBullets();
      blocks.push("<p><br></p>");
      return;
    }

    if (isBulletLine(trimmed)) {
      bulletItems.push(trimmed.replace(/^\s*-\s*/, ""));
      return;
    }

    flushBullets();
    blocks.push(`<p>${wrapInlineFormatting(line, font)}</p>`);
  });

  flushBullets();
  return blocks.join("");
};

const splitHtmlBlocks = (html = "") => {
  const cleaned = String(html)
    .trim()
    .replace(/^<p[^>]*>/i, "")
    .replace(/<\/p>$/i, "");

  return cleaned
    .split(/(?:<br\s*\/?>|<\/p>\s*<p[^>]*>)/i)
    .map((segment) => segment.trim())
    .filter(Boolean);
};

const renderBulletsFromHtml = (html = "", text = "", font = {}) => {
  const plainLines = normalizeText(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const htmlLines = splitHtmlBlocks(html);
  const useHtmlSegments = htmlLines.length >= plainLines.length;

  return `<ul>${plainLines
    .map((line, index) => {
      const fallback = wrapInlineFormatting(line.replace(/^\s*-\s*/, ""), font);
      const segment = useHtmlSegments ? htmlLines[index] : fallback;
      return `<li>${stripBulletMarker(segment || fallback)}</li>`;
    })
    .join("")}</ul>`;
};

export const spreadsheetCellToHtml = (cell) => {
  if (!cell) return "";

  const text = normalizeText(cell.v ?? cell.w ?? "");
  if (!text) return "";

  const html = typeof cell.h === "string" ? cell.h.trim() : "";
  const lines = text.split("\n");
  const font = cell?.s?.font || {};

  if (isBulletBlock(lines)) {
    if (html) {
      return renderBulletsFromHtml(html, text, font);
    }
    return renderPlainTextBlocks(text, font);
  }

  if (html) {
    return html;
  }

  return renderPlainTextBlocks(text, font);
};

