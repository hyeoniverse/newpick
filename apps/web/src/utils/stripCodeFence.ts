export function stripCodeFence(content: string = '', language: string = 'html'): string {
  const codeFenceStart = `\`\`\`${language}`;
  const codeFenceEnd = '```';

  if (content.startsWith(codeFenceStart) && content.endsWith(codeFenceEnd)) {
    return content.slice(codeFenceStart.length, -codeFenceEnd.length).trim();
  }

  return content;
}