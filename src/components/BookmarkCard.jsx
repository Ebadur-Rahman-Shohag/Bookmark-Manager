import { memo } from 'react';
import Favicon from './Favicon.jsx';
import PositionControl from './PositionControl.jsx';
import { EditIcon, ExternalIcon, LinkIcon, TrashIcon } from './icons.jsx';
import { getDisplayUrl, getSafeHref } from '../lib/bookmarks.js';

const BookmarkCard = ({ bookmark, position, total, onMove, onEdit, onDelete }) => {
  const { title, link, category } = bookmark;
  const href = getSafeHref(link);

  return (
    <article className="bookmark-card" role="listitem" aria-label={title}>
      <div className="bc-top">
        <Favicon key={link} link={link} />
        <div className="bc-meta">
          <h3 className="bc-title">{title}</h3>
        </div>
        {category && <span className="bc-category">{category}</span>}
      </div>

      <div className="bc-url-row">
        <a href={href} target="_blank" rel="noopener noreferrer" className="bc-link" title={link}>
          <LinkIcon size={13} />
          <span className="bc-link-text">{getDisplayUrl(link)}</span>
        </a>
      </div>

      <div className="bc-spacer"></div>

      <div className="bc-actions">
        <PositionControl
          title={title}
          position={position}
          total={total}
          onMove={(target) => onMove(bookmark.id, target)}
        />
        <a href={href} target="_blank" rel="noopener noreferrer" className="bc-btn-visit" title="Visit">
          <ExternalIcon />
          Visit
        </a>
        <button
          type="button"
          className="bc-btn-edit bc-btn-icon"
          aria-label={`Edit ${title}`}
          title="Edit"
          onClick={() => onEdit(bookmark.id)}
        >
          <EditIcon />
        </button>
        <button
          type="button"
          className="bc-btn-delete bc-btn-icon"
          aria-label={`Delete ${title}`}
          title="Delete"
          onClick={() => onDelete(bookmark.id)}
        >
          <TrashIcon />
        </button>
      </div>
    </article>
  );
};

export default memo(BookmarkCard);
