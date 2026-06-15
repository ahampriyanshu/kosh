export const siteConfig = {
  url: 'https://kosh.ahampriyanshu.com',
  title: 'Kosh',
  description: 'Actionable market reports without the noise',
  author: {
    name: 'Priyanshu Tiwari',
    url: 'https://ahampriyanshu.com',
    twitter: '@ahampriyanshu',
  },
} as const;

export function absoluteUrl(path: string): string {
  return new URL(path, siteConfig.url).toString();
}
