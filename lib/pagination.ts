export type CursorPage<T> = {
  items: T[];
  nextCursor: string | null;
  previousCursor: string | null;
};

export function paginateByCursor<T>(
  items: T[],
  options: {
    cursor: string | null | undefined;
    size: number;
    getCursor: (item: T) => string;
  },
): CursorPage<T> {
  const { cursor, size, getCursor } = options;
  const cursorIndex = cursor ? items.findIndex((item) => getCursor(item) === cursor) : -1;
  const startIndex = cursorIndex >= 0 ? cursorIndex + 1 : 0;
  const pageItems = items.slice(startIndex, startIndex + size);
  const hasNextPage = startIndex + size < items.length;
  const previousStartIndex = startIndex - size;

  return {
    items: pageItems,
    nextCursor: hasNextPage && pageItems.length > 0 ? getCursor(pageItems[pageItems.length - 1]!) : null,
    previousCursor: previousStartIndex > 0 ? getCursor(items[previousStartIndex - 1]!) : null,
  };
}
