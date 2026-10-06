// Text handling for renderers. PDF standard fonts (Helvetica) cover the
// Windows-1252 character set: every Finnish letter (ä ö å Ä Ö Å), the euro sign
// and typographic quotes are fine, but anything else would print as garbage.
// pdfSafe() keeps what the font can draw, strips accents from other Latin
// letters where that gives a readable result, and marks the rest with "?".

const WIN_1252_EXTRA = "€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ";

const drawable = (ch) => {
  const cp = ch.codePointAt(0);
  return (cp >= 0x20 && cp <= 0x7e) || (cp >= 0xa0 && cp <= 0xff) || WIN_1252_EXTRA.includes(ch);
};

/** @returns {{text: string, replaced: boolean}} */
export function pdfSafe(input) {
  let replaced = false;
  const out = [];
  for (const ch of String(input ?? "").normalize("NFC")) {
    const cp = ch.codePointAt(0);
    if (cp < 0x20 || cp === 0x7f) {
      out.push(" ");
    } else if (drawable(ch)) {
      out.push(ch);
    } else {
      const plain = ch.normalize("NFD").replace(/[̀-ͯ]/g, "");
      if (plain && [...plain].every(drawable)) out.push(plain);
      else {
        out.push("?");
        replaced = true;
      }
    }
  }
  return { text: out.join("").replace(/\s+/g, " ").trim(), replaced };
}

const ELLIPSIS = "…";

/** Shrink toward `minSize`, then cut with an ellipsis, so text never leaves its box. */
export function fitText(doc, text, maxWidth, { font = "Helvetica", size, minSize = size } = {}) {
  doc.font(font);
  let s = size;
  doc.fontSize(s);
  while (s > minSize && doc.widthOfString(text) > maxWidth) {
    s = Math.max(minSize, s - 0.5);
    doc.fontSize(s);
  }
  if (doc.widthOfString(text) <= maxWidth) return { text, size: s };
  let cut = text;
  while (cut.length > 1 && doc.widthOfString(cut + ELLIPSIS) > maxWidth) cut = cut.slice(0, -1);
  return { text: cut.trimEnd() + ELLIPSIS, size: s };
}

/** Word-wrap into at most `maxLines` lines; the last line ends in an ellipsis if text remains. */
export function wrapText(doc, text, maxWidth, maxLines, { font = "Helvetica", size }) {
  doc.font(font).fontSize(size);
  const words = text.split(" ").filter(Boolean);
  const lines = [];
  let line = "";
  const push = (value) => lines.push(value);
  for (const word of words) {
    let rest = word;
    while (doc.widthOfString(rest) > maxWidth) {
      // A single word wider than the box: break it by characters.
      let n = rest.length;
      while (n > 1 && doc.widthOfString(rest.slice(0, n)) > maxWidth) n -= 1;
      if (line) {
        push(line);
        line = "";
      }
      push(rest.slice(0, n));
      rest = rest.slice(n);
    }
    const next = line ? `${line} ${rest}` : rest;
    if (doc.widthOfString(next) <= maxWidth) line = next;
    else {
      push(line);
      line = rest;
    }
  }
  if (line) push(line);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  kept[maxLines - 1] = fitText(doc, `${kept[maxLines - 1]}${ELLIPSIS}`, maxWidth, { font, size }).text;
  return kept;
}
