/** The publication's identity and palette, shared by the site and email editions. */
export const publication = {
  name: 'Kosh Daily',
  tagline: 'A considered view of Indian markets',
  url: 'https://kosh.ahampriyanshu.com',
  authorUrl: 'https://ahampriyanshu.com',
  colors: {
    paper: '#f7f4ec',
    inset: '#f1ede2',
    ink: '#232822',
    secondary: '#5e645d',
    tertiary: '#72776e',
    rule: '#e2dbcd',
    strongRule: '#aaa48f',
    link: '#245b61',
    positive: '#246747',
    negative: '#a73529',
  },
} as const;

export const publicationTheme = {
  '--color-background-primary': publication.colors.paper,
  '--color-surface-primary': publication.colors.paper,
  '--color-surface-secondary': publication.colors.inset,
  '--color-text-primary': publication.colors.ink,
  '--color-text-secondary': publication.colors.secondary,
  '--color-text-tertiary': publication.colors.tertiary,
  '--color-border-primary': publication.colors.rule,
  '--color-border-emphasis': publication.colors.strongRule,
  '--color-link': publication.colors.link,
  '--color-link-hover': publication.colors.ink,
  '--color-bullish': publication.colors.positive,
  '--color-bearish': publication.colors.negative,
};
