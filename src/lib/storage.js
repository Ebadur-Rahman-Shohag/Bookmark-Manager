const BOOKMARKS_KEY = 'bookmarksData';

export const loadBookmarks = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(BOOKMARKS_KEY));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveBookmarks = (bookmarks) => {
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
};
