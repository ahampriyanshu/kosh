const YAHOO_TICKER_ALIASES: Record<string, string> = {
  'TATAMOTORS.NS': 'TMPV.NS',
};

export function resolveYahooTicker(ticker: string): string {
  return YAHOO_TICKER_ALIASES[ticker.toUpperCase()] ?? ticker;
}
