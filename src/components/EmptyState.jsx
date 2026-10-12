import { BookmarkOutlineIcon } from './icons.jsx';

const getSubtitle = (hasBookmarks, hasQuery, hasCategory) => {
  if (!hasBookmarks) return 'Add your first bookmark using the form above.';
  if (hasQuery && hasCategory) {
    return 'No bookmarks match your search in this category. Try another tab or clear the search.';
  }
  if (!hasQuery && hasCategory) {
    return 'No bookmarks in this category yet. Add one or pick another tab.';
  }
  return 'Try adjusting your search or add a new bookmark to get started.';
};

const EmptyState = ({ hasBookmarks, hasQuery, hasCategory }) => (
  <div className="empty-state" role="status" aria-live="polite">
    <div className="empty-icon" aria-hidden="true">
      <BookmarkOutlineIcon size={40} />
    </div>
    <h3 className="empty-title">{hasBookmarks ? 'No bookmarks found' : 'No bookmarks yet'}</h3>
    <p className="empty-subtitle">{getSubtitle(hasBookmarks, hasQuery, hasCategory)}</p>
  </div>
);

export default EmptyState;
