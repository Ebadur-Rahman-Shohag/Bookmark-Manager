import { nanoid } from 'nanoid';

/** Trims a typed link and adds `https://` when no scheme was given ("vitejs.dev"). */
export const normalizeLink = (raw) => {
  const link = String(raw || '').trim();
  if (!link || /^[a-z][a-z\d+.-]*:/i.test(link)) return link;
  return `https://${link}`;
};

/** Only http(s) links with a real host name are accepted, so `javascript:` and "abc" are rejected. */
export const isValidUrl = (value) => {
  try {
    const { protocol, hostname } = new URL(value);
    if (protocol !== 'http:' && protocol !== 'https:') return false;
    return hostname === 'localhost' || hostname.includes('.');
  } catch {
    return false;
  }
};

export const getCategoryValue = (bookmark) => (bookmark.category || '').trim();

export const getCategories = (bookmarks) => {
  const cats = new Set();
  bookmarks.forEach((b) => {
    const cat = getCategoryValue(b);
    if (cat) cats.add(cat);
  });
  return [...cats].sort((a, b) => a.localeCompare(b));
};

/**
 * Cleans up a typed category and reuses an existing one when it differs only by
 * letter case or spacing, so "dev " and "Dev" don't become separate categories.
 */
export const normalizeCategory = (raw, categories) => {
  const cleaned = String(raw || '').trim().replace(/\s+/g, ' ');
  if (!cleaned) return '';
  const lower = cleaned.toLowerCase();
  return categories.find((cat) => cat.toLowerCase() === lower) ?? cleaned;
};

export const clampPosition = (value, total) => {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return null;
  return Math.min(Math.max(n, 1), total);
};

export const hasUncategorized = (bookmarks) => bookmarks.some((b) => !getCategoryValue(b));

export const countByCategory = (bookmarks, categoryId) => {
  if (categoryId === 'all') return bookmarks.length;
  if (categoryId === 'uncategorized') return bookmarks.filter((b) => !getCategoryValue(b)).length;
  return bookmarks.filter((b) => getCategoryValue(b) === categoryId).length;
};

export const filterByCategory = (bookmarks, category) => {
  if (category === 'all') return bookmarks;
  if (category === 'uncategorized') return bookmarks.filter((b) => !getCategoryValue(b));
  return bookmarks.filter((b) => getCategoryValue(b) === category);
};

export const filterBookmarks = (bookmarks, query) =>
  query
    ? bookmarks.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          String(item.link || '').toLowerCase().includes(query) ||
          (item.category && item.category.toLowerCase().includes(query))
      )
    : bookmarks;

export const getFaviconUrl = (link) => {
  try {
    const { hostname } = new URL(link);
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
  } catch {
    return null;
  }
};

const UNSAFE_PROTOCOLS = new Set(['javascript:', 'data:', 'vbscript:']);

export const getSafeHref = (link) => {
  try {
    const { protocol } = new URL(link);
    return UNSAFE_PROTOCOLS.has(protocol) ? undefined : link;
  } catch {
    return undefined;
  }
};

export const getDisplayUrl = (link) => {
  try {
    return new URL(link).hostname.replace(/^www\./, '') || link;
  } catch {
    return link;
  }
};

// ── Export / Import ────────────────────────────────────────
export const normalizeUrl = (url) => {
  try {
    const parsed = new URL(url.trim());
    return `${parsed.hostname.toLowerCase()}${parsed.pathname.replace(/\/$/, '').toLowerCase()}${parsed.search.toLowerCase()}`;
  } catch {
    return url.trim().toLowerCase();
  }
};

export const isValidBookmark = (item) => {
  if (!item || typeof item !== 'object') return false;
  const title = String(item.title || '').trim();
  const link = normalizeLink(item.link);
  if (!title || !link) return false;
  return isValidUrl(link);
};

export const parseImportFile = (raw) => {
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed)) return parsed;
  if (parsed && Array.isArray(parsed.bookmarks)) return parsed.bookmarks;
  throw new Error('File format not recognized.');
};

export const mergeImportedBookmarks = (existing, imported) => {
  const seenUrls = new Set(existing.map((b) => normalizeUrl(b.link)));
  const seenIds = new Set(existing.map((b) => b.id));
  const knownCategories = getCategories(existing);

  let importedCount = 0;
  let skippedDuplicates = 0;
  let skippedInvalid = 0;
  const merged = [...existing];

  imported.forEach((item) => {
    if (!isValidBookmark(item)) {
      skippedInvalid += 1;
      return;
    }

    const link = normalizeLink(item.link);
    const normalized = normalizeUrl(link);
    if (seenUrls.has(normalized)) {
      skippedDuplicates += 1;
      return;
    }

    const id = item.id && !seenIds.has(item.id) ? String(item.id) : nanoid();
    seenUrls.add(normalized);
    seenIds.add(id);
    const category = normalizeCategory(item.category, knownCategories);
    if (category && !knownCategories.includes(category)) knownCategories.push(category);
    merged.push({
      id,
      title: String(item.title).trim(),
      link,
      category,
    });
    importedCount += 1;
  });

  return { merged, importedCount, skippedDuplicates, skippedInvalid };
};

export const downloadBookmarksFile = (bookmarks) => {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    bookmarks,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().slice(0, 10);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `bookmarks-${date}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
};
