import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckIcon, ChevronDownIcon, CloseIcon, PlusIcon, TagIcon } from './icons.jsx';

const HighlightedMatch = ({ text, query }) => {
  const index = query ? text.toLowerCase().indexOf(query) : -1;
  if (index < 0) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark className="category-autocomplete-match">{text.slice(index, index + query.length)}</mark>
      {text.slice(index + query.length)}
    </>
  );
};

/**
 * `categories` is a list of `{ name, count }`. Typing a name that doesn't exist yet offers a
 * "Create" row; an exact (case-insensitive) match is not repeated in the list.
 * Opening by click, chevron or arrow keys "browses" every category instead, marking the current one.
 */
const CategoryAutocomplete = ({ id, value, onChange, categories, placeholder = 'e.g., Development' }) => {
  const [open, setOpen] = useState(false);
  const [browsing, setBrowsing] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const listId = `${id}-listbox`;

  const typed = value.trim().replace(/\s+/g, ' ');
  const query = typed.toLowerCase();

  const allCategories = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name)).map((cat) => ({ type: 'existing', ...cat })),
    [categories]
  );
  const selectedIndex = allCategories.findIndex(({ name }) => name.toLowerCase() === query);

  const options = useMemo(() => {
    if (browsing) return allCategories;
    const matches = categories
      .filter(({ name }) => name.toLowerCase().includes(query) && name.toLowerCase() !== query)
      .sort((a, b) => {
        const aPrefix = a.name.toLowerCase().startsWith(query);
        const bPrefix = b.name.toLowerCase().startsWith(query);
        return aPrefix === bPrefix ? a.name.localeCompare(b.name) : aPrefix ? -1 : 1;
      })
      .map((cat) => ({ type: 'existing', ...cat }));

    const exists = categories.some(({ name }) => name.toLowerCase() === query);
    if (typed && !exists) matches.push({ type: 'create', name: typed });
    return matches;
  }, [browsing, allCategories, categories, query, typed]);

  const isOpen = open && options.length > 0;

  const openList = () => {
    setOpen(true);
    setBrowsing(false);
    setActiveIndex(-1);
  };

  /** `edge` picks where the highlight starts when there's no current category: 'first', 'last' or none. */
  const browse = (edge) => {
    setOpen(true);
    setBrowsing(true);
    if (selectedIndex >= 0) setActiveIndex(selectedIndex);
    else if (edge === 'first') setActiveIndex(0);
    else if (edge === 'last') setActiveIndex(allCategories.length - 1);
    else setActiveIndex(-1);
  };

  const closeList = () => {
    setOpen(false);
    setBrowsing(false);
    setActiveIndex(-1);
  };

  const select = (option) => {
    onChange(option.name);
    closeList();
  };

  useEffect(() => {
    if (!isOpen || activeIndex < 0) return;
    listRef.current?.children[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, isOpen]);

  const moveActive = (step) => {
    setActiveIndex((i) => {
      if (i < 0) return step > 0 ? 0 : options.length - 1;
      return (i + step + options.length) % options.length;
    });
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        browse(e.key === 'ArrowDown' ? 'first' : 'last');
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        moveActive(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        moveActive(-1);
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case 'Enter':
        if (activeIndex >= 0) {
          e.preventDefault();
          select(options[activeIndex]);
        } else {
          closeList();
        }
        break;
      case 'Escape':
        // Only close the list; don't let an enclosing modal close too.
        e.preventDefault();
        e.stopPropagation();
        closeList();
        break;
      case 'Tab':
        closeList();
        break;
      default:
    }
  };

  const clear = () => {
    onChange('');
    inputRef.current?.focus();
    openList();
  };

  return (
    <div className={`input-wrapper category-autocomplete-wrap${isOpen ? ' is-open' : ''}`}>
      <span className="input-icon" aria-hidden="true">
        <TagIcon />
      </span>
      <input
        ref={inputRef}
        id={id}
        type="text"
        placeholder={placeholder}
        className="form-input has-trailing-actions"
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-activedescendant={isOpen && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          openList();
        }}
        onClick={() => (isOpen ? closeList() : browse())}
        onBlur={closeList}
        onKeyDown={handleKeyDown}
      />

      <div className="category-autocomplete-actions">
        {value && (
          <button
            type="button"
            className="category-autocomplete-action"
            aria-label="Clear category"
            title="Clear"
            tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}
            onClick={clear}
          >
            <CloseIcon size={13} />
          </button>
        )}
        <button
          type="button"
          className="category-autocomplete-action category-autocomplete-chevron"
          aria-label={isOpen ? 'Hide category suggestions' : 'Show category suggestions'}
          tabIndex={-1}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            inputRef.current?.focus();
            if (isOpen) closeList();
            else browse();
          }}
        >
          <ChevronDownIcon size={15} />
        </button>
      </div>

      <ul
        id={listId}
        ref={listRef}
        className={`category-autocomplete-list${isOpen ? ' is-open' : ''}`}
        role="listbox"
        aria-label="Category suggestions"
      >
        {options.map((option, i) => {
          const isCurrent = browsing && i === selectedIndex;
          return (
            <li
              key={`${option.type}-${option.name}`}
              id={`${listId}-${i}`}
              className={`category-autocomplete-item${option.type === 'create' ? ' is-create' : ''}${
                i === activeIndex ? ' is-active' : ''
              }${isCurrent ? ' is-selected' : ''}`}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={(e) => {
                e.preventDefault();
                select(option);
              }}
              onMouseMove={() => {
                if (activeIndex !== i) setActiveIndex(i);
              }}
            >
              {option.type === 'create' ? (
                <>
                  <span className="category-autocomplete-icon" aria-hidden="true">
                    <PlusIcon size={13} />
                  </span>
                  <span className="category-autocomplete-label">
                    Create &ldquo;{option.name}&rdquo;
                  </span>
                </>
              ) : (
                <>
                  <span className="category-autocomplete-icon" aria-hidden="true">
                    {isCurrent ? <CheckIcon size={13} /> : <TagIcon size={13} />}
                  </span>
                  <span className="category-autocomplete-label">
                    {browsing ? option.name : <HighlightedMatch text={option.name} query={query} />}
                    {isCurrent && <span className="sr-only">, current category</span>}
                  </span>
                  <span className="category-autocomplete-count" aria-label={`${option.count} bookmarks`}>
                    {option.count}
                  </span>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default CategoryAutocomplete;
