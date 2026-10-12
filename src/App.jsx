import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import Navbar from './components/Navbar.jsx';
import Hero from './components/Hero.jsx';
import BookmarkForm from './components/BookmarkForm.jsx';
import SearchBar from './components/SearchBar.jsx';
import CategoryTabs from './components/CategoryTabs.jsx';
import BookmarkGrid from './components/BookmarkGrid.jsx';
import EditBookmarkModal from './components/EditBookmarkModal.jsx';
import EmptyState from './components/EmptyState.jsx';
import Footer from './components/Footer.jsx';
import { useBookmarks } from './hooks/useBookmarks.js';
import {
  clampPosition,
  countByCategory,
  downloadBookmarksFile,
  filterBookmarks,
  filterByCategory,
  getCategories,
  hasUncategorized,
  mergeImportedBookmarks,
  normalizeCategory,
  parseImportFile,
} from './lib/bookmarks.js';
import { confirmDelete, showError, showToast, showUndoToast, showWarning } from './lib/alerts.js';

const plural = (n) => `${n} bookmark${n === 1 ? '' : 's'}`;

const HIGHLIGHT_MS = 1400;

const App = () => {
  const { bookmarks, add, update, remove, reorder, restoreOrder, replaceAll } = useBookmarks();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  // Bumped whenever the grid should replay its entry animation.
  const [entryKey, setEntryKey] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [highlightedId, setHighlightedId] = useState(null);
  const [announcement, setAnnouncement] = useState('');
  const highlightTimerRef = useRef(null);

  useEffect(() => () => clearTimeout(highlightTimerRef.current), []);

  const replayEntryAnimation = () => setEntryKey((k) => k + 1);

  const categories = useMemo(() => getCategories(bookmarks), [bookmarks]);
  const categoryOptions = useMemo(
    () => categories.map((name) => ({ name, count: countByCategory(bookmarks, name) })),
    [bookmarks, categories]
  );
  const showUncategorized = categories.length > 0 && hasUncategorized(bookmarks);

  const activeCategory =
    selectedCategory === 'all' ||
    (selectedCategory === 'uncategorized' ? hasUncategorized(bookmarks) : categories.includes(selectedCategory))
      ? selectedCategory
      : 'all';

  const query = searchQuery.toLowerCase().trim();

  const tabs = useMemo(() => {
    if (categories.length === 0) return [];
    const list = [{ id: 'all', label: 'All' }, ...categories.map((cat) => ({ id: cat, label: cat }))];
    if (showUncategorized) list.push({ id: 'uncategorized', label: 'Uncategorized' });
    // While searching, counts show how many bookmarks in each tab match.
    const counted = filterBookmarks(bookmarks, query);
    return list.map((tab) => ({ ...tab, count: countByCategory(counted, tab.id) }));
  }, [bookmarks, categories, showUncategorized, query]);
  const visibleBookmarks = useMemo(
    () => filterBookmarks(filterByCategory(bookmarks, activeCategory), query),
    [bookmarks, activeCategory, query]
  );

  // Read by stable callbacks so cards (memoized) don't re-render after every reorder.
  const visibleIdsRef = useRef([]);
  visibleIdsRef.current = visibleBookmarks.map((b) => b.id);
  const bookmarksRef = useRef(bookmarks);
  bookmarksRef.current = bookmarks;

  const editingIndex = editingId ? visibleBookmarks.findIndex((b) => b.id === editingId) : -1;
  const editingBookmark = editingIndex >= 0 ? visibleBookmarks[editingIndex] : null;

  const handleAdd = (bookmark) => {
    add({ ...bookmark, category: normalizeCategory(bookmark.category, categories) });
    replayEntryAnimation();
  };

  const handleSelectCategory = (id) => {
    setSelectedCategory(id);
    replayEntryAnimation();
  };

  const flashCard = useCallback((id) => {
    setHighlightedId(id);
    clearTimeout(highlightTimerRef.current);
    highlightTimerRef.current = setTimeout(() => setHighlightedId(null), HIGHLIGHT_MS);
  }, []);

  /**
   * Applies a new order for the visible bookmarks and offers Undo, which restores the full
   * order from just before this move.
   */
  const applyOrder = useCallback(
    async (orderedIds, movedId, { undoable = true } = {}) => {
      const previousIds = bookmarksRef.current.map((b) => b.id);
      const title = bookmarksRef.current.find((b) => b.id === movedId)?.title ?? 'Bookmark';
      const to = orderedIds.indexOf(movedId) + 1;

      reorder(orderedIds);
      if (!undoable) return;

      if (await showUndoToast(`${title} moved to #${to}`)) {
        restoreOrder(previousIds);
        setAnnouncement(`Move undone. ${title} is back in its previous position.`);
        flashCard(movedId);
      }
    },
    [reorder, restoreOrder, flashCard]
  );

  /** Moves a bookmark to a 1-based position within the current view. */
  const handleMove = useCallback(
    (id, target, options) => {
      const ids = visibleIdsRef.current;
      const from = ids.indexOf(id);
      const to = clampPosition(target, ids.length);
      if (from < 0 || to === null || to - 1 === from) return;

      const title = bookmarksRef.current.find((b) => b.id === id)?.title;
      setAnnouncement(`${title} moved to position ${to} of ${ids.length}.`);
      flashCard(id);
      applyOrder(arrayMove(ids, from, to - 1), id, options);
    },
    [applyOrder, flashCard]
  );

  const handleEdit = useCallback((id) => setEditingId(id), []);

  const handleSaveEdit = ({ title, link, category, position }) => {
    const id = editingBookmark.id;
    const currentPosition = editingIndex + 1;
    update(id, { title, link, category: normalizeCategory(category, categories) });
    if (position !== currentPosition) handleMove(id, position, { undoable: false });
    showToast({ title: 'Updated!', text: 'Your bookmark has been updated', timer: 1800 });
  };

  const handleDelete = useCallback(
    async (id) => {
      if (!(await confirmDelete())) return;

      const ids = visibleIdsRef.current;
      const index = ids.indexOf(id);
      const neighborId = ids[index + 1] ?? ids[index - 1];

      remove(id);
      showToast({ title: 'Deleted!', text: 'Your bookmark has been removed', timer: 1500 });

      // Keep keyboard users near where they were instead of dropping focus to the page start.
      requestAnimationFrame(() => {
        const neighborDelete =
          neighborId && document.querySelector(`.bookmark-card-wrapper[data-id="${CSS.escape(neighborId)}"] .bc-btn-delete`);
        const formOpen = document.getElementById('form-body')?.offsetHeight > 0;
        const fallback = formOpen ? document.getElementById('title') : document.querySelector('.search-input');
        (neighborDelete || fallback)?.focus();
      });
    },
    [remove]
  );

  const handleExport = () => {
    downloadBookmarksFile(bookmarks);
    showToast({
      icon: bookmarks.length ? 'success' : 'info',
      title: bookmarks.length ? 'Export Complete' : 'Empty Export',
      text: bookmarks.length
        ? `${plural(bookmarks.length)} exported successfully`
        : 'No bookmarks to export — empty file downloaded.',
    });
  };

  const handleImportFile = async (file) => {
    let result;
    try {
      result = mergeImportedBookmarks(bookmarks, parseImportFile(await file.text()));
    } catch {
      showError('Import Failed', 'Could not read file. Please select a valid JSON export.');
      return;
    }

    const { merged, importedCount, skippedDuplicates, skippedInvalid } = result;
    const invalidNote = skippedInvalid ? `, ${skippedInvalid} invalid` : '';

    if (importedCount === 0) {
      showWarning(
        'Nothing Imported',
        `0 bookmarks imported. ${skippedDuplicates} skipped (duplicate URLs)${invalidNote}.`
      );
      return;
    }

    replaceAll(merged);
    replayEntryAnimation();
    showToast({
      title: 'Import Complete',
      text: `${plural(importedCount)} imported${
        skippedDuplicates ? `, ${skippedDuplicates} skipped (duplicate URLs)` : ''
      }${invalidNote}.`,
      timer: 2500,
    });
  };

  return (
    <>
      <Navbar onExport={handleExport} onImportFile={handleImportFile} />

      <main>
        <Hero />

        <div className="container main-content">
          <BookmarkForm categoryOptions={categoryOptions} onAdd={handleAdd} />
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <CategoryTabs tabs={tabs} activeCategory={activeCategory} onSelect={handleSelectCategory} />

          {visibleBookmarks.length === 0 ? (
            <EmptyState hasBookmarks={bookmarks.length > 0} hasQuery={!!query} hasCategory={activeCategory !== 'all'} />
          ) : (
            <BookmarkGrid
              key={entryKey}
              bookmarks={visibleBookmarks}
              highlightedId={highlightedId}
              onReorder={applyOrder}
              onMove={handleMove}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </div>
      </main>

      <Footer />

      {editingBookmark && (
        <EditBookmarkModal
          key={editingBookmark.id}
          bookmark={editingBookmark}
          position={editingIndex + 1}
          total={visibleBookmarks.length}
          categoryOptions={categoryOptions}
          onSave={handleSaveEdit}
          onClose={() => setEditingId(null)}
        />
      )}

      <div className="sr-only" aria-live="polite" role="status">
        {announcement}
      </div>
    </>
  );
};

export default App;
