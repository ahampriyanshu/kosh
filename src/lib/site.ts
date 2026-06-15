export const siteConfig = {
  url: 'https://kosh.ahampriyanshu.com',
  title: 'Kosh',
  description:
    'A personal Indian equity dashboard for daily market briefs, watchlists, alerts, research, and recaps.',
  author: {
    name: 'Priyanshu Tiwari',
    url: 'https://ahampriyanshu.com',
    twitter: '@ahampriyanshu',
  },
} as const;

export function absoluteUrl(path: string): string {
  return new URL(path, siteConfig.url).toString();
}
