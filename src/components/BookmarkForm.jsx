import { useState } from 'react';
import Collapsible from './Collapsible.jsx';
import CategoryAutocomplete from './CategoryAutocomplete.jsx';
import { LinkIcon, PlusIcon, TitleIcon } from './icons.jsx';
import { isValidUrl, normalizeLink } from '../lib/bookmarks.js';
import { showError, showToast, showWarning } from '../lib/alerts.js';

const EMPTY_FORM = { title: '', link: '', category: '' };

const BookmarkForm = ({ categoryOptions, onAdd }) => {
  const [form, setForm] = useState(EMPTY_FORM);

  const setField = (field) => (value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const title = form.title.trim();
    const link = normalizeLink(form.link);
    const category = form.category.trim();

    if (!title || !link) {
      showWarning('Missing Fields', 'Please fill in Title and URL to add a bookmark');
      return;
    }
    if (!isValidUrl(link)) {
      showError('Invalid URL', 'Please enter a valid web address, e.g. example.com');
      return;
    }

    onAdd({ title, link, category });
    setForm(EMPTY_FORM);
    showToast({ title: 'Bookmark Added!', text: 'Your bookmark has been saved successfully' });
  };

  return (
    <Collapsible
      id="form-section"
      className="card form-card"
      ariaLabelledby="form-heading"
      storageKey="bm-form-collapsed"
      datasetKey="formCollapsed"
      headClassName="card-header"
      headerClassName="card-header-left form-header-toggle"
      header={
        <>
          <div className="card-icon" aria-hidden="true">
            <PlusIcon size={18} />
          </div>
          <h2 id="form-heading" className="card-title">
            Add New Bookmark
          </h2>
        </>
      }
      bodyId="form-body"
      bodyClassName="form-body"
      innerClassName="form-body-inner"
      labels={{ expand: 'Expand add bookmark form', collapse: 'Collapse add bookmark form' }}
    >
      <form className="form-grid" noValidate onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title" className="form-label">
            Title <span className="required" aria-label="required">*</span>
          </label>
          <div className="input-wrapper">
            <span className="input-icon" aria-hidden="true">
              <TitleIcon />
            </span>
            <input
              id="title"
              type="text"
              placeholder="e.g., GitHub"
              className="form-input"
              autoComplete="off"
              value={form.title}
              onChange={(e) => setField('title')(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="link" className="form-label">
            URL <span className="required" aria-label="required">*</span>
          </label>
          <div className="input-wrapper">
            <span className="input-icon" aria-hidden="true">
              <LinkIcon />
            </span>
            <input
              id="link"
              type="url"
              placeholder="https://example.com"
              className="form-input"
              autoComplete="off"
              value={form.link}
              onChange={(e) => setField('link')(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="category" className="form-label">
            Category
          </label>
          <CategoryAutocomplete
            id="category"
            value={form.category}
            onChange={setField('category')}
            categories={categoryOptions}
          />
        </div>

        <div className="form-action">
          <button type="submit" className="btn-primary">
            <PlusIcon />
            Add Bookmark
          </button>
        </div>
      </form>
    </Collapsible>
  );
};

export default BookmarkForm;
