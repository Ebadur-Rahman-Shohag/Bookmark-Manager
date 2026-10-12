import { useCallback, useEffect, useState } from 'react';
import { nanoid } from 'nanoid';
import { loadBookmarks, saveBookmarks } from '../lib/storage.js';

export const useBookmarks = () => {
  const [bookmarks, setBookmarks] = useState(loadBookmarks);

  useEffect(() => {
    saveBookmarks(bookmarks);
  }, [bookmarks]);

  const add = useCallback(({ title, link, category }) => {
    setBookmarks((prev) => [...prev, { id: nanoid(), title, link, category }]);
  }, []);

  const update = useCallback((id, changes) => {
    setBookmarks((prev) => prev.map((b) => (b.id === id ? { ...b, ...changes } : b)));
  }, []);

  const remove = useCallback((id) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  /**
   * Applies a new order to a subset of bookmarks (e.g. one category tab). The subset is
   * rearranged only within the slots it already occupies, so every other bookmark keeps its position.
   */
  const reorder = useCallback((orderedIds) => {
    setBookmarks((prev) => {
      const byId = new Map(prev.map((b) => [b.id, b]));
      const queue = orderedIds.filter((id) => byId.has(id));
      const slotIds = new Set(queue);
      let next = 0;
      return prev.map((b) => (slotIds.has(b.id) ? byId.get(queue[next++]) : b));
    });
  }, []);

  /**
   * Puts bookmarks back in a previously saved id order (used by Undo). Edits made since are kept;
   * bookmarks deleted since are skipped and ones added since stay at the end.
   */
  const restoreOrder = useCallback((previousIds) => {
    setBookmarks((prev) => {
      const rank = new Map(previousIds.map((id, i) => [id, i]));
      const known = prev.filter((b) => rank.has(b.id)).sort((a, b) => rank.get(a.id) - rank.get(b.id));
      return [...known, ...prev.filter((b) => !rank.has(b.id))];
    });
  }, []);

  const replaceAll = useCallback((next) => {
    setBookmarks(next);
  }, []);

  return { bookmarks, add, update, remove, reorder, restoreOrder, replaceAll };
};
