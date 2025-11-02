import { parseOfficeAsync } from 'officeparser';

export async function parseOdp(filePath: string) {
  if (!filePath) return { text: '' };
  const text = await parseOfficeAsync(filePath, { outputErrorToConsole: true });
  return { text };
}

