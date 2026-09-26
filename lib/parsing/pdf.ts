/**
 * PDF Requirement text extractor (supports plain text representations or byte stream extraction)
 */
export async function parsePdfContent(buffer: ArrayBuffer | string): Promise<string> {
  if (typeof buffer === 'string') {
    return buffer;
  }

  // Convert buffer to string and extract standard text streams / ASCII markers
  const decoder = new TextDecoder('utf-8', { fatal: false });
  const raw = decoder.decode(buffer);

  // Extract visible ASCII characters and text streams commonly found in PDF streams (BT...ET blocks)
  const streamMatches = raw.match(/BT[\s\S]*?ET/g);
  if (streamMatches && streamMatches.length > 0) {
    const textLines = streamMatches
      .map((block) => {
        const textParts = block.match(/\((.*?)\)\s*Tj/g) || [];
        return textParts.map((t) => t.replace(/^\(|\)\s*Tj$/g, '')).join(' ');
      })
      .filter((t) => t.trim().length > 0);

    if (textLines.length > 0) {
      return textLines.join('\n');
    }
  }

  // Fallback: extract continuous readable printable characters
  const cleanAscii = raw
    .replace(/[^\x20-\x7E\r\n\t]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return cleanAscii.length > 50 ? cleanAscii.slice(0, 15000) : 'Unable to parse PDF binary. Please paste the requirement text directly.';
}
