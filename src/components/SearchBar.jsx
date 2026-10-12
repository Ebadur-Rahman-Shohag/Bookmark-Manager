import { SearchIcon } from './icons.jsx';

const SearchBar = ({ value, onChange }) => (
  <section className="search-section" aria-label="Search bookmarks">
    <div className="search-wrapper">
      <span className="search-icon" aria-hidden="true">
        <SearchIcon />
      </span>
      <input
        type="search"
        placeholder="Search by title, URL or category..."
        className="search-input"
        aria-label="Search bookmarks"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  </section>
);

export default SearchBar;
