const NAME_MAP: Record<string, string[]> = {
  AAPL: ['apple', 'iphone', 'macbook', 'ios'],
  MSFT: ['microsoft', 'windows', 'office', 'azure', 'teams'],
  GOOGL: ['google', 'alphabet', 'android', 'youtube'],
  AMZN: ['amazon', 'aws', 'prime video'],
  META: ['meta', 'facebook', 'instagram', 'whatsapp'],
  NVDA: ['nvidia', 'geforce', 'cuda'],
  AMD: ['amd', 'radeon', 'epyc'],
  TSLA: ['tesla', 'elon musk', 'model 3', 'model y'],
};

export function extractSymbolsFromText(text: string): string[] {
  const t = text.toLowerCase();
  const out = new Set<string>();
  for (const [sym, keywords] of Object.entries(NAME_MAP)) {
    for (const k of keywords) {
      if (t.includes(k)) {
        out.add(sym);
        break;
      }
    }
  }
  return Array.from(out);
}

