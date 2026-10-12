import { useEffect, useRef, useState } from 'react';

/** "#N" button that turns into a number field; Enter moves the bookmark, Escape or blur cancels. */
const PositionControl = ({ title, position, total, onMove }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef(null);
  const buttonRef = useRef(null);
  // Enter/Escape hand focus back to the button; a blur means the user already moved focus elsewhere.
  const refocusRef = useRef(false);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    } else if (refocusRef.current) {
      refocusRef.current = false;
      buttonRef.current?.focus();
    }
  }, [editing]);

  const start = () => {
    setDraft(String(position));
    setEditing(true);
  };

  const finish = () => {
    refocusRef.current = true;
    setEditing(false);
  };

  const commit = () => {
    finish();
    const target = Number(draft);
    if (Number.isFinite(target) && draft.trim() !== '') onMove(target);
  };

  if (!editing) {
    return (
      <button
        ref={buttonRef}
        type="button"
        className="bc-position"
        aria-label={`${title} is at position ${position} of ${total}. Change position`}
        title="Move to position…"
        disabled={total < 2}
        onClick={start}
      >
        #{position}
      </button>
    );
  }

  return (
    <input
      ref={inputRef}
      type="number"
      inputMode="numeric"
      className="bc-position-input"
      min={1}
      max={total}
      step={1}
      aria-label={`New position for ${title}, 1 to ${total}`}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          commit();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          finish();
        }
      }}
      onBlur={() => {
        if (!refocusRef.current) setEditing(false);
      }}
    />
  );
};

export default PositionControl;
