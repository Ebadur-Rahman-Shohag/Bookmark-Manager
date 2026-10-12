import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import CategoryAutocomplete from './CategoryAutocomplete.jsx';
import { CloseIcon, EditIcon, HashIcon, LinkIcon, TitleIcon } from './icons.jsx';
import { isValidUrl, normalizeLink } from '../lib/bookmarks.js';

const CLOSE_ANIMATION_MS = 160;

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * `position` / `total` describe the bookmark's place in the current view (All, a category tab,
 * or search results). `onSave` receives `{ title, link, category, position }`.
 */
const EditBookmarkModal = ({ bookmark, position, total, categoryOptions, onSave, onClose }) => {
  const [form, setForm] = useState(() => ({
    title: bookmark.title,
    link: bookmark.link,
    category: bookmark.category || '',
    position: String(position),
  }));
  const [errors, setErrors] = useState({});
  const [closing, setClosing] = useState(false);
  const dialogRef = useRef(null);
  const titleInputRef = useRef(null);

  const setField = (field) => (value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const fieldProps = (field) =>
    errors[field] ? { 'aria-invalid': true, 'aria-describedby': `edit-${field}-error` } : {};

  const renderError = (field) =>
    errors[field] ? (
      <p id={`edit-${field}-error`} className="form-error" role="alert">
        {errors[field]}
      </p>
    ) : null;

  const requestClose = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(onClose, CLOSE_ANIMATION_MS);
  };

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    titleInputRef.current?.focus();
    titleInputRef.current?.select();
    return () => {
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      requestClose();
      return;
    }
    if (e.key !== 'Tab') return;

    const focusable = [...dialogRef.current.querySelectorAll(FOCUSABLE)];
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const title = form.title.trim();
    const link = normalizeLink(form.link);
    const nextPosition = Number(form.position);

    const nextErrors = {};
    if (!title) nextErrors.title = 'Title is required.';
    if (!link) nextErrors.link = 'URL is required.';
    else if (!isValidUrl(link)) nextErrors.link = 'Please enter a valid web address, e.g. example.com';
    if (form.position.trim() === '' || !Number.isInteger(nextPosition) || nextPosition < 1 || nextPosition > total) {
      nextErrors.position = `Position must be a whole number from 1 to ${total}.`;
    }

    const firstInvalid = ['title', 'link', 'position'].find((field) => nextErrors[field]);
    if (firstInvalid) {
      setErrors(nextErrors);
      document.getElementById(`edit-${firstInvalid}`)?.focus();
      return;
    }

    onSave({ title, link, category: form.category, position: nextPosition });
    requestClose();
  };

  return createPortal(
    <div
      className={`modal-backdrop${closing ? ' is-closing' : ''}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
    >
      <div
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-modal-title"
        onKeyDown={handleKeyDown}
      >
        <div className="modal-header">
          <div className="card-header-left">
            <div className="card-icon" aria-hidden="true">
              <EditIcon size={16} />
            </div>
            <h2 id="edit-modal-title" className="card-title">
              Edit Bookmark
            </h2>
          </div>
          <button type="button" className="form-collapse-btn" aria-label="Close" title="Close" onClick={requestClose}>
            <CloseIcon size={16} />
          </button>
        </div>

        <form className="modal-body" noValidate onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="edit-title" className="form-label">
              Title <span className="required" aria-label="required">*</span>
            </label>
            <div className="input-wrapper">
              <span className="input-icon" aria-hidden="true">
                <TitleIcon />
              </span>
              <input
                ref={titleInputRef}
                id="edit-title"
                type="text"
                className="form-input"
                placeholder="e.g., GitHub"
                autoComplete="off"
                value={form.title}
                onChange={(e) => setField('title')(e.target.value)}
                {...fieldProps('title')}
              />
            </div>
            {renderError('title')}
          </div>

          <div className="form-group">
            <label htmlFor="edit-link" className="form-label">
              URL <span className="required" aria-label="required">*</span>
            </label>
            <div className="input-wrapper">
              <span className="input-icon" aria-hidden="true">
                <LinkIcon />
              </span>
              <input
                id="edit-link"
                type="url"
                className="form-input"
                placeholder="https://example.com"
                autoComplete="off"
                value={form.link}
                onChange={(e) => setField('link')(e.target.value)}
                {...fieldProps('link')}
              />
            </div>
            {renderError('link')}
          </div>

          <div className="modal-row">
            <div className="form-group">
              <label htmlFor="edit-category" className="form-label">
                Category
              </label>
              <CategoryAutocomplete
                id="edit-category"
                value={form.category}
                onChange={setField('category')}
                categories={categoryOptions}
              />
            </div>

            <div className="form-group modal-position-group">
              <label htmlFor="edit-position" className="form-label">
                Position
              </label>
              <div className="input-wrapper">
                <span className="input-icon" aria-hidden="true">
                  <HashIcon size={15} />
                </span>
                <input
                  id="edit-position"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={total}
                  step={1}
                  className="form-input"
                  value={form.position}
                  onChange={(e) => setField('position')(e.target.value)}
                  aria-invalid={errors.position ? true : undefined}
                  aria-describedby={errors.position ? 'edit-position-hint edit-position-error' : 'edit-position-hint'}
                />
              </div>
              <span id="edit-position-hint" className="form-hint">
                of {total}
              </span>
            </div>
          </div>
          {renderError('position')}

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={requestClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default EditBookmarkModal;
