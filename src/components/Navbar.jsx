import { useRef } from 'react';
import { BookmarkIcon, ExportIcon, ImportIcon } from './icons.jsx';

const Navbar = ({ onExport, onImportFile }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) onImportFile(file);
  };

  return (
    <nav className="navbar" role="banner">
      <div className="navbar-inner">
        <a href="#" className="navbar-brand" aria-label="Bookmark Manager home">
          <div className="brand-icon" aria-hidden="true">
            <BookmarkIcon size={20} />
          </div>
          <span className="brand-name">
            Bookmark<span className="brand-accent">Manager</span>
          </span>
        </a>

        <div className="navbar-actions">
          <button className="nav-btn" type="button" aria-label="Export bookmarks" title="Export bookmarks" onClick={onExport}>
            <ExportIcon />
            <span className="nav-btn-label">Export</span>
          </button>
          <button
            className="nav-btn"
            type="button"
            aria-label="Import bookmarks"
            title="Import bookmarks"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImportIcon />
            <span className="nav-btn-label">Import</span>
          </button>
          <input ref={fileInputRef} type="file" accept=".json,application/json" hidden onChange={handleFileChange} />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
