import { useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  defaultDropAnimationSideEffects,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import SortableBookmarkCard, { DragHandle, SORT_TRANSITION } from './SortableBookmarkCard.jsx';
import BookmarkCard from './BookmarkCard.jsx';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion.js';

const noop = () => {};

const DROP_ANIMATION = {
  ...SORT_TRANSITION,
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: '0' } },
    className: { dragOverlay: 'is-dropping' },
  }),
};

// Keeps hover styles off the dragged copy; the pointer is always over it.
const OVERLAY_STYLE = { pointerEvents: 'none' };

const SCREEN_READER_INSTRUCTIONS = {
  draggable:
    'To pick up a bookmark, press Space or Enter. Use the arrow keys to move it, ' +
    'then press Space or Enter to drop it, or Escape to cancel.',
};

/**
 * Pointer: swap as soon as the pointer enters a card; in the gaps between cards (the dragged card still
 * overlaps one) use the nearest card; released clear of every card means "no target", so the drop cancels.
 * Keyboard (no pointer): always the nearest card.
 */
const collisionDetection = (args) => {
  if (!args.pointerCoordinates) return closestCenter(args);
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) return pointerCollisions;
  return rectIntersection(args).length > 0 ? closestCenter(args) : [];
};

const setBodySorting = (sorting) => {
  document.body.classList.toggle('is-sorting', sorting);
  // Smooth scrolling turns each auto-scroll step into a short animation, which makes it stutter.
  document.documentElement.classList.toggle('is-sorting', sorting);
  window.getSelection()?.removeAllRanges();
};

/**
 * Remount (via `key`) to replay the entry animation: only cards rendered in the
 * grid's first render animate, cards that appear later (e.g. from search) do not.
 */
const BookmarkGrid = ({ bookmarks, highlightedId, onReorder, onMove, onEdit, onDelete }) => {
  const [activeId, setActiveId] = useState(null);
  const reducedMotion = usePrefersReducedMotion();
  const firstRenderRef = useRef(true);
  // dnd-kit reports the card's own slot right after pickup; skipping that keeps "Picked up…" audible.
  const movedSincePickupRef = useRef(false);

  useEffect(() => {
    firstRenderRef.current = false;
    return () => setBodySorting(false);
  }, []);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 3 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const ids = bookmarks.map((b) => b.id);
  const activeBookmark = activeId ? bookmarks.find((b) => b.id === activeId) : null;

  const announcements = useMemo(() => {
    const total = bookmarks.length;
    const titleOf = (id) => bookmarks.find((b) => b.id === id)?.title ?? 'Bookmark';
    const positionOf = (id) => bookmarks.findIndex((b) => b.id === id) + 1;

    return {
      onDragStart: ({ active }) => {
        movedSincePickupRef.current = false;
        return `Picked up ${titleOf(active.id)}. Position ${positionOf(active.id)} of ${total}.`;
      },
      onDragOver: ({ active, over }) => {
        if (over && over.id === active.id && !movedSincePickupRef.current) return undefined;
        movedSincePickupRef.current = true;
        return over
          ? `${titleOf(active.id)} moved to position ${positionOf(over.id)} of ${total}.`
          : `${titleOf(active.id)} is no longer over a bookmark. Release to cancel.`;
      },
      onDragEnd: ({ active, over }) =>
        over
          ? `${titleOf(active.id)} dropped at position ${positionOf(over.id)} of ${total}.`
          : `${titleOf(active.id)} dropped. Order unchanged.`,
      onDragCancel: ({ active }) =>
        `Reordering cancelled. ${titleOf(active.id)} returned to position ${positionOf(active.id)} of ${total}.`,
    };
  }, [bookmarks]);

  const handleDragStart = ({ active }) => {
    setActiveId(active.id);
    setBodySorting(true);
  };

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null);
    setBodySorting(false);
    if (!over || active.id === over.id) return;
    onReorder(arrayMove(ids, ids.indexOf(active.id), ids.indexOf(over.id)), active.id);
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setBodySorting(false);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      accessibility={{ announcements, screenReaderInstructions: SCREEN_READER_INSTRUCTIONS }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <div className={`bookmarks-grid${activeId ? ' is-sorting' : ''}`} role="list" aria-label="Bookmarks">
          {bookmarks.map((bookmark, index) => (
            <SortableBookmarkCard
              key={bookmark.id}
              bookmark={bookmark}
              position={index + 1}
              total={bookmarks.length}
              animateOnMount={firstRenderRef.current}
              reducedMotion={reducedMotion}
              highlighted={bookmark.id === highlightedId}
              onMove={onMove}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay dropAnimation={reducedMotion ? null : DROP_ANIMATION} style={OVERLAY_STYLE}>
        {activeBookmark && (
          <div className="bookmark-card-wrapper sortable-drag">
            <DragHandle />
            <BookmarkCard
              bookmark={activeBookmark}
              position={ids.indexOf(activeBookmark.id) + 1}
              total={bookmarks.length}
              onMove={noop}
              onEdit={noop}
              onDelete={noop}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};

export default BookmarkGrid;
