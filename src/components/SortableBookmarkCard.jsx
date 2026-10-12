import { useCallback, useEffect, useRef, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import BookmarkCard from './BookmarkCard.jsx';
import { DragDotsIcon } from './icons.jsx';

export const SORT_TRANSITION = { duration: 200, easing: 'cubic-bezier(0.25, 1, 0.5, 1)' };

export const DragHandle = ({ handleRef, ...props }) => (
  <div ref={handleRef} className="bc-drag-handle" title="Drag to reorder" aria-label="Drag to reorder" {...props}>
    <DragDotsIcon />
  </div>
);

const SortableBookmarkCard = ({
  bookmark,
  position,
  total,
  animateOnMount,
  reducedMotion,
  highlighted,
  onMove,
  onEdit,
  onDelete,
}) => {
  // The entry animation's fill-mode would override dnd-kit's inline transform, so the class is dropped
  // once it ends, or as soon as any drag starts.
  const [entering, setEntering] = useState(animateOnMount);
  const nodeRef = useRef(null);
  const { active, attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({
      id: bookmark.id,
      transition: reducedMotion ? null : SORT_TRANSITION,
    });

  const setRefs = useCallback(
    (node) => {
      nodeRef.current = node;
      setNodeRef(node);
    },
    [setNodeRef]
  );

  useEffect(() => {
    if (active) setEntering(false);
  }, [active]);

  useEffect(() => {
    if (highlighted) nodeRef.current?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'nearest' });
  }, [highlighted, reducedMotion]);

  const className = [
    'bookmark-card-wrapper',
    entering && !active && 'animate-entry',
    isDragging && 'sortable-ghost',
    highlighted && 'is-moved',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={setRefs}
      className={className}
      data-id={bookmark.id}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget && e.animationName === 'fadeSlideUp') setEntering(false);
      }}
    >
      <DragHandle
        handleRef={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${bookmark.title}`}
      />
      <BookmarkCard
        bookmark={bookmark}
        position={position}
        total={total}
        onMove={onMove}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
};

export default SortableBookmarkCard;
