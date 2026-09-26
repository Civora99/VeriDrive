/**
 * Text and Markdown requirement parser and sanitizer
 */
export function parseRequirementText(rawInput: string): {
  title?: string;
  cleanedText: string;
  wordCount: number;
  detectedHeaders: string[];
} {
  const lines = rawInput.split(/\r?\n/).map((l) => l.trim());
  const detectedHeaders: string[] = [];
  let title = '';

  for (const line of lines) {
    if (line.startsWith('#') || /^REQ-[A-Z]+-\d+/i.test(line) || /^[A-Z0-9_]+ SPEC/i.test(line)) {
      if (!title) {
        title = line.replace(/^[#\s]+/, '').trim();
      }
      detectedHeaders.push(line);
    }
  }

  const cleanedText = rawInput.replace(/\r\n/g, '\n').trim();
  const wordCount = cleanedText.split(/\s+/).filter(Boolean).length;

  return {
    title: title || undefined,
    cleanedText,
    wordCount,
    detectedHeaders
  };
}
