/**
 * DOCX Requirement text extractor
 */
export async function parseDocxContent(buffer: ArrayBuffer | string): Promise<string> {
  if (typeof buffer === 'string') return buffer;

  const decoder = new TextDecoder('utf-8', { fatal: false });
  const raw = decoder.decode(buffer);

  // Extract <w:t> tags commonly present in OOXML document.xml
  const matches = raw.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
  if (matches && matches.length > 0) {
    const textPieces = matches.map((m) => m.replace(/<[^>]+>/g, ''));
    return textPieces.join(' ');
  }

  // Fallback to printable characters
  const cleanAscii = raw
    .replace(/[^\x20-\x7E\r\n\t]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return cleanAscii.length > 50 ? cleanAscii.slice(0, 15000) : 'Unable to parse DOCX binary. Please paste the requirement text directly.';
}
