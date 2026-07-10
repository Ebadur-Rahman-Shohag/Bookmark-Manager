// HTML escape function for security
const escapeHtml = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

// ── Collapsible sections ─────────────────────────────────────
const createCollapsible = ({
  section,
  body,
  inner,
  toggle,
  header,
  storageKey,
  datasetKey,
  labels,
}) => {
  let animating = false;

  const finishAnimation = (collapsed) => {
    animating = false;
    body.classList.remove('is-animating');
    if (!collapsed) {
      body.style.height = 'auto';
      body.style.overflow = '';
    }
  };

  const animateBody = (collapsed) => {
    animating = true;
    body.classList.add('is-animating');
    body.style.overflow = 'hidden';

    if (collapsed) {
      body.style.height = `${body.scrollHeight}px`;
      body.offsetHeight;
      body.style.height = '0px';
      body.addEventListener('transitionend', function onEnd(e) {
        if (e.target !== body || e.propertyName !== 'height') return;
        body.removeEventListener('transitionend', onEnd);
        finishAnimation(collapsed);
      });
      return;
    }

    body.style.height = '0px';
    body.offsetHeight;
    body.style.height = `${inner.scrollHeight}px`;
    body.addEventListener('transitionend', function onEnd(e) {
      if (e.target !== body || e.propertyName !== 'height') return;
      body.removeEventListener('transitionend', onEnd);
      finishAnimation(collapsed);
    });
  };

  const setCollapsed = (collapsed, { animate = true } = {}) => {
    if (!section || !toggle || !body || !inner) return;

    const wasCollapsed = section.classList.contains('is-collapsed');
    if (wasCollapsed === collapsed && !document.documentElement.dataset[datasetKey]) return;

    section.classList.toggle('is-collapsed', collapsed);
    toggle.setAttribute('aria-expanded', String(!collapsed));
    toggle.setAttribute('aria-label', collapsed ? labels.expand : labels.collapse);
    toggle.setAttribute('title', collapsed ? 'Expand' : 'Collapse');
    localStorage.setItem(storageKey, collapsed ? 'true' : 'false');
    delete document.documentElement.dataset[datasetKey];

    if (!animate) {
      body.style.height = collapsed ? '0px' : 'auto';
      body.style.overflow = collapsed ? 'hidden' : '';
      return;
    }

    requestAnimationFrame(() => animateBody(collapsed));
  };

  const init = () => {
    if (!section || !toggle) return;

    setCollapsed(localStorage.getItem(storageKey) === 'true', { animate: false });

    const toggleSection = () => {
      if (animating) return;
      setCollapsed(!section.classList.contains('is-collapsed'));
    };

    toggle.addEventListener('click', toggleSection);
    header?.addEventListener('click', toggleSection);
    header?.setAttribute('role', 'button');
    header?.setAttribute('tabindex', '0');
    header?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleSection();
      }
    });
  };

  return { setCollapsed, init };
};

const initFormCollapse = () => {
  createCollapsible({
    section: document.getElementById('form-section'),
    body: document.getElementById('form-body'),
    inner: document.getElementById('form-body-inner'),
    toggle: document.getElementById('form-collapse-toggle'),
    header: document.querySelector('#form-section .form-header-toggle'),
    storageKey: 'bm-form-collapsed',
    datasetKey: 'formCollapsed',
    labels: {
      expand: 'Expand add bookmark form',
      collapse: 'Collapse add bookmark form',
    },
  }).init();
};

const initCategoryCollapse = () => {
  createCollapsible({
    section: document.getElementById('category-panel'),
    body: document.getElementById('category-tabs-body'),
    inner: document.getElementById('category-tabs-body-inner'),
    toggle: document.getElementById('category-collapse-toggle'),
    header: document.querySelector('.category-header-toggle'),
    storageKey: 'bm-categories-collapsed',
    datasetKey: 'categoriesCollapsed',
    labels: {
      expand: 'Expand category filters',
      collapse: 'Collapse category filters',
    },
  }).init();
};

// ── SweetAlert2 helpers ────────────────────────────────────
const swalTheme = () => ({
  background: '#161B22',
  color: '#F0F6FC',
});

// ── Add Bookmark ───────────────────────────────────────────
const handleAdd = (event) => {
  if (event && event.type === 'keydown' && event.key !== 'Enter') return;
  if (event) event.preventDefault();

  const title    = document.getElementById('title').value.trim();
  const link     = document.getElementById('link').value.trim();
  const category = document.getElementById('category').value.trim();

  if (!title || !link) {
    Swal.fire({
      icon: 'warning',
      title: 'Missing Fields',
      text: 'Please fill in Title and URL to add a bookmark',
      ...swalTheme(),
    });
    return;
  }

  try { new URL(link); } catch {
    Swal.fire({
      icon: 'error',
      title: 'Invalid URL',
      text: 'Please enter a valid URL starting with https://',
      ...swalTheme(),
    });
    return;
  }

  addToLocalStorage(title, link, category);

  document.getElementById('title').value    = '';
  document.getElementById('link').value     = '';
  document.getElementById('category').value = '';

  Swal.fire({
    icon: 'success',
    title: 'Bookmark Added!',
    text: 'Your bookmark has been saved successfully',
    timer: 2000,
    showConfirmButton: false,
    ...swalTheme(),
  });
};

document.getElementById('btn-add').addEventListener('click', handleAdd);

// Trigger add on Enter from any form input
['title', 'link', 'category'].forEach((id) => {
  document.getElementById(id).addEventListener('keydown', handleAdd);
});

// ── LocalStorage helpers ───────────────────────────────────
import { nanoid } from 'https://cdn.jsdelivr.net/npm/nanoid@4.0.0/nanoid.js';
import Sortable from 'https://cdn.jsdelivr.net/npm/sortablejs@1.15.2/+esm';

const getAllBookmarks = () => JSON.parse(localStorage.getItem('bookmarksData')) || [];

const getSearchQuery = () => document.getElementById('search').value.toLowerCase().trim();

let activeCategory = 'all';

const getCategoryValue = (bookmark) => (bookmark.category || '').trim();

const getCategories = () => {
  const cats = new Set();
  getAllBookmarks().forEach((b) => {
    const cat = getCategoryValue(b);
    if (cat) cats.add(cat);
  });
  return [...cats].sort((a, b) => a.localeCompare(b));
};

const getCategorySuggestions = (query) => {
  const q = query.trim().toLowerCase();
  return getCategories().filter((cat) => !q || cat.toLowerCase().includes(q));
};

const initCategoryAutocomplete = () => {
  const input = document.getElementById('category');
  const list = document.getElementById('category-autocomplete-list');
  if (!input || !list) return;

  let activeIndex = -1;
  let wheelLocked = false;

  const onWheelWhileOpen = (e) => {
    if (list.classList.contains('hidden')) return;
    e.preventDefault();
    if (list.scrollHeight > list.clientHeight) {
      list.scrollTop += e.deltaY;
    }
  };

  const attachWheelLock = () => {
    if (wheelLocked) return;
    window.addEventListener('wheel', onWheelWhileOpen, { passive: false });
    wheelLocked = true;
  };

  const detachWheelLock = () => {
    if (!wheelLocked) return;
    window.removeEventListener('wheel', onWheelWhileOpen);
    wheelLocked = false;
  };

  const hideList = () => {
    list.classList.add('hidden');
    list.innerHTML = '';
    activeIndex = -1;
    input.setAttribute('aria-expanded', 'false');
    detachWheelLock();
  };

  const selectSuggestion = (value) => {
    input.value = value;
    hideList();
  };

  const updateActiveItem = (items) => {
    items.forEach((item, i) => {
      item.classList.toggle('is-active', i === activeIndex);
      if (i === activeIndex) item.scrollIntoView({ block: 'nearest' });
    });
  };

  const renderSuggestions = () => {
    const suggestions = getCategorySuggestions(input.value);
    list.innerHTML = '';
    activeIndex = -1;

    if (!suggestions.length) {
      hideList();
      return;
    }

    suggestions.forEach((cat) => {
      const item = document.createElement('li');
      item.className = 'category-autocomplete-item';
      item.setAttribute('role', 'option');
      item.textContent = cat;
      item.addEventListener('mousedown', (e) => {
        e.preventDefault();
        selectSuggestion(cat);
      });
      list.appendChild(item);
    });

    list.classList.remove('hidden');
    input.setAttribute('aria-expanded', 'true');
    attachWheelLock();
  };

  input.addEventListener('focus', renderSuggestions);
  input.addEventListener('input', renderSuggestions);

  input.addEventListener(
    'keydown',
    (e) => {
      const items = list.querySelectorAll('.category-autocomplete-item');
      if (list.classList.contains('hidden') || !items.length) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeIndex = Math.min(activeIndex + 1, items.length - 1);
        updateActiveItem(items);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeIndex = Math.max(activeIndex - 1, 0);
        updateActiveItem(items);
      } else if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault();
        e.stopImmediatePropagation();
        selectSuggestion(items[activeIndex].textContent);
      } else if (e.key === 'Escape') {
        hideList();
      }
    },
    true
  );

  input.addEventListener('blur', () => {
    window.setTimeout(hideList, 150);
  });
};

const hasUncategorized = () => getAllBookmarks().some((b) => !getCategoryValue(b));

const countByCategory = (categoryId) => {
  const all = getAllBookmarks();
  if (categoryId === 'all') return all.length;
  if (categoryId === 'uncategorized') return all.filter((b) => !getCategoryValue(b)).length;
  return all.filter((b) => getCategoryValue(b) === categoryId).length;
};

const validateActiveCategory = () => {
  if (activeCategory === 'all') return;
  if (activeCategory === 'uncategorized') {
    if (!hasUncategorized()) activeCategory = 'all';
    return;
  }
  if (!getCategories().includes(activeCategory)) activeCategory = 'all';
};

const filterByCategory = (allData, category) => {
  if (category === 'all') return allData;
  if (category === 'uncategorized') return allData.filter((b) => !getCategoryValue(b));
  return allData.filter((b) => getCategoryValue(b) === category);
};

const filterBookmarks = (allData, query) =>
  query
    ? allData.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          (item.category && item.category.toLowerCase().includes(query))
      )
    : allData;

const getCurrentView = () => {
  const query = getSearchQuery();
  const allData = getAllBookmarks();
  let data = filterByCategory(allData, activeCategory);
  data = filterBookmarks(data, query);
  const isFiltered = !!query || activeCategory !== 'all';
  return { data, isFiltered };
};

const addToLocalStorage = (title, link, category) => {
  const data = { id: nanoid(), title, link, category };
  const existing = getAllBookmarks();
  existing.push(data);
  localStorage.setItem('bookmarksData', JSON.stringify(existing));
  refreshView({ animate: true });
};

// ── Export / Import ────────────────────────────────────────
const normalizeUrl = (url) => {
  try {
    const parsed = new URL(url.trim());
    return `${parsed.hostname.toLowerCase()}${parsed.pathname.replace(/\/$/, '').toLowerCase()}${parsed.search.toLowerCase()}`;
  } catch {
    return url.trim().toLowerCase();
  }
};

const isValidBookmark = (item) => {
  if (!item || typeof item !== 'object') return false;
  const title = String(item.title || '').trim();
  const link = String(item.link || '').trim();
  if (!title || !link) return false;
  try { new URL(link); return true; } catch { return false; }
};

const parseImportFile = (raw) => {
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed)) return parsed;
  if (parsed && Array.isArray(parsed.bookmarks)) return parsed.bookmarks;
  throw new Error('File format not recognized.');
};

const exportBookmarks = () => {
  const bookmarks = getAllBookmarks();
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    bookmarks,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().slice(0, 10);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `bookmarks-${date}.json`;
  anchor.click();
  URL.revokeObjectURL(url);

  Swal.fire({
    icon: bookmarks.length ? 'success' : 'info',
    title: bookmarks.length ? 'Export Complete' : 'Empty Export',
    text: bookmarks.length
      ? `${bookmarks.length} bookmark${bookmarks.length === 1 ? '' : 's'} exported successfully`
      : 'No bookmarks to export — empty file downloaded.',
    timer: 2000,
    showConfirmButton: false,
    ...swalTheme(),
  });
};

const mergeImportedBookmarks = (imported) => {
  const existing = getAllBookmarks();
  const seenUrls = new Set(existing.map((b) => normalizeUrl(b.link)));

  let importedCount = 0;
  let skippedDuplicates = 0;
  let skippedInvalid = 0;
  const merged = [...existing];

  imported.forEach((item) => {
    if (!isValidBookmark(item)) {
      skippedInvalid += 1;
      return;
    }

    const link = String(item.link).trim();
    const normalized = normalizeUrl(link);
    if (seenUrls.has(normalized)) {
      skippedDuplicates += 1;
      return;
    }

    seenUrls.add(normalized);
    merged.push({
      id: item.id || nanoid(),
      title: String(item.title).trim(),
      link,
      category: String(item.category || '').trim(),
    });
    importedCount += 1;
  });

  return { merged, importedCount, skippedDuplicates, skippedInvalid };
};

const handleImportFileChange = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    try {
      const imported = parseImportFile(reader.result);
      const { merged, importedCount, skippedDuplicates, skippedInvalid } = mergeImportedBookmarks(imported);

      if (importedCount === 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Nothing Imported',
          text: `0 bookmarks imported. ${skippedDuplicates} skipped (duplicate URLs)${skippedInvalid ? `, ${skippedInvalid} invalid` : ''}.`,
          ...swalTheme(),
        });
        return;
      }

      localStorage.setItem('bookmarksData', JSON.stringify(merged));
      refreshView({ animate: true });

      Swal.fire({
        icon: 'success',
        title: 'Import Complete',
        text: `${importedCount} bookmark${importedCount === 1 ? '' : 's'} imported${skippedDuplicates ? `, ${skippedDuplicates} skipped (duplicate URLs)` : ''}${skippedInvalid ? `, ${skippedInvalid} invalid` : ''}.`,
        timer: 2500,
        showConfirmButton: false,
        ...swalTheme(),
      });
    } catch {
      Swal.fire({
        icon: 'error',
        title: 'Import Failed',
        text: 'Could not read file. Please select a valid JSON export.',
        ...swalTheme(),
      });
    } finally {
      event.target.value = '';
    }
  };

  reader.onerror = () => {
    Swal.fire({
      icon: 'error',
      title: 'Import Failed',
      text: 'Could not read file. Please select a valid JSON export.',
      ...swalTheme(),
    });
    event.target.value = '';
  };

  reader.readAsText(file);
};

document.getElementById('btn-export').addEventListener('click', exportBookmarks);
document.getElementById('btn-import').addEventListener('click', () => {
  document.getElementById('import-file').click();
});
document.getElementById('import-file').addEventListener('change', handleImportFileChange);

// ── Favicon helper ─────────────────────────────────────────
const getFaviconUrl = (link) => {
  try {
    const { hostname } = new URL(link);
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
  } catch { return null; }
};

// ── Build card HTML ────────────────────────────────────────
const buildCardHTML = (bookmark) => {
  const faviconUrl = getFaviconUrl(bookmark.link);
  const faviconHTML = faviconUrl
    ? `<img src="${faviconUrl}" alt="" loading="lazy" onerror="this.parentElement.innerHTML='<span class=\\'bc-favicon-fallback\\'><svg width=\\'16\\' height=\\'16\\' fill=\\'currentColor\\' viewBox=\\'0 0 20 20\\'><path d=\\'M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z\\'/></svg></span>'" />`
    : `<span class="bc-favicon-fallback"><svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"/></svg></span>`;

  const categoryHTML = bookmark.category
    ? `<span class="bc-category">${escapeHtml(bookmark.category)}</span>`
    : '';

  let displayUrl = bookmark.link;
  try { displayUrl = new URL(bookmark.link).hostname.replace(/^www\./, ''); } catch {}

  return `
    <article class="bookmark-card" role="listitem" aria-label="${escapeHtml(bookmark.title)}">
      <div class="bc-drag-handle" title="Drag to reorder" aria-label="Drag to reorder">
        <svg width="20" height="10" viewBox="0 0 20 10" fill="currentColor" aria-hidden="true">
          <circle cx="2.5" cy="2.5" r="1.5"/><circle cx="10" cy="2.5" r="1.5"/><circle cx="17.5" cy="2.5" r="1.5"/>
          <circle cx="2.5" cy="7.5" r="1.5"/><circle cx="10" cy="7.5" r="1.5"/><circle cx="17.5" cy="7.5" r="1.5"/>
        </svg>
      </div>
      <div class="bc-top">
        <div class="bc-favicon" aria-hidden="true">${faviconHTML}</div>
        <div class="bc-meta">
          <h3 class="bc-title">${escapeHtml(bookmark.title)}</h3>
        </div>
        ${categoryHTML}
      </div>

      <div class="bc-url-row">
        <a href="${bookmark.link}" target="_blank" rel="noopener noreferrer" class="bc-link" title="${escapeHtml(bookmark.link)}">
          <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
          </svg>
          <span class="bc-link-text">${escapeHtml(displayUrl)}</span>
        </a>
      </div>

      <div class="bc-spacer"></div>

      <div class="bc-actions">
        <a href="${bookmark.link}" target="_blank" rel="noopener noreferrer" class="bc-btn-visit" title="Visit">
          <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
          </svg>
          Visit
        </a>
        <button onclick="editBookmark('${bookmark.id}')" class="bc-btn-edit bc-btn-icon" aria-label="Edit ${escapeHtml(bookmark.title)}" title="Edit">
          <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
        </button>
        <button onclick="deleteBookmarks('${bookmark.id}')" class="bc-btn-delete bc-btn-icon" aria-label="Delete ${escapeHtml(bookmark.title)}" title="Delete">
          <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>
      </div>
    </article>`;
};

// ── Drag and Drop (SortableJS) ─────────────────────────────
let sortableInstance = null;

const getSortDirection = () =>
  window.matchMedia('(max-width: 768px)').matches ? 'vertical' : 'horizontal';

const preventSelect = (e) => e.preventDefault();

const clearTextSelection = () => window.getSelection()?.removeAllRanges();

const startSorting = (container) => {
  container.classList.add('is-sorting');
  document.body.classList.add('is-sorting');
  clearTextSelection();
  document.addEventListener('selectstart', preventSelect);
};

const endSorting = (container, evt) => {
  container.classList.remove('is-sorting');
  document.body.classList.remove('is-sorting');
  document.removeEventListener('selectstart', preventSelect);
  clearTextSelection();
  persistOrderFromDOM(evt);
};

const persistOrderFromDOM = (evt) => {
  if (evt.oldIndex === evt.newIndex) return;

  const container = document.getElementById('bookmarks-container');
  const ids = [...container.children].map((el) => el.dataset.id);
  const allData = getAllBookmarks();
  const byId = new Map(allData.map((b) => [b.id, b]));
  const reordered = ids.map((id) => byId.get(id)).filter(Boolean);

  const reorderedIds = new Set(reordered.map((b) => b.id));
  const remaining = allData.filter((b) => !reorderedIds.has(b.id));

  localStorage.setItem('bookmarksData', JSON.stringify([...reordered, ...remaining]));
};

const initSortable = () => {
  const container = document.getElementById('bookmarks-container');
  sortableInstance = Sortable.create(container, {
    animation: 200,
    easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    direction: getSortDirection(),
    forceFallback: true,
    fallbackOnBody: true,
    fallbackTolerance: 3,
    swapThreshold: 0.5,
    scroll: true,
    scrollSensitivity: 60,
    bubbleScroll: true,
    draggable: '.bookmark-card-wrapper',
    handle: '.bc-drag-handle',
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    dragClass: 'sortable-drag',
    filter: '.bc-btn-edit, .bc-btn-delete, a',
    preventOnFilter: false,
    onStart: () => startSorting(container),
    onEnd: (evt) => endSorting(container, evt),
  });

  window.addEventListener('resize', () => {
    sortableInstance?.option('direction', getSortDirection());
  });
};

// ── Display bookmarks ──────────────────────────────────────
const renderBookmarks = (data, { isFiltered = false, animate = false } = {}) => {
  const container = document.getElementById('bookmarks-container');
  container.innerHTML = '';
  container.classList.toggle('search-active', isFiltered);

  if (data.length === 0) {
    document.getElementById('not-found').classList.remove('hidden');
    const subtitle = document.querySelector('#not-found .empty-subtitle');
    if (subtitle) {
      const query = getSearchQuery();
      if (query && activeCategory !== 'all') {
        subtitle.textContent = 'No bookmarks match your search in this category. Try another tab or clear the search.';
      } else if (query) {
        subtitle.textContent = 'Try adjusting your search or add a new bookmark to get started.';
      } else if (activeCategory !== 'all') {
        subtitle.textContent = 'No bookmarks in this category yet. Add one or pick another tab.';
      } else {
        subtitle.textContent = 'Try adjusting your search or add a new bookmark to get started.';
      }
    }
    sortableInstance?.option('disabled', true);
    return;
  }

  document.getElementById('not-found').classList.add('hidden');
  data.forEach((bookmark) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'bookmark-card-wrapper';
    if (animate) wrapper.classList.add('animate-entry');
    wrapper.dataset.id = bookmark.id;
    wrapper.innerHTML = buildCardHTML(bookmark);
    container.appendChild(wrapper);
  });

  sortableInstance?.option('disabled', isFiltered);
};

const renderCategoryTabs = () => {
  validateActiveCategory();

  const section = document.getElementById('category-tabs-section');
  const container = document.getElementById('category-tabs');
  const categories = getCategories();
  const showUncategorized = hasUncategorized() && categories.length > 0;

  if (categories.length === 0) {
    section.classList.add('hidden');
    container.innerHTML = '';
    return;
  }

  section.classList.remove('hidden');
  container.innerHTML = '';

  const tabs = [{ id: 'all', label: 'All' }];
  categories.forEach((cat) => tabs.push({ id: cat, label: cat }));
  if (showUncategorized) tabs.push({ id: 'uncategorized', label: 'Uncategorized' });

  tabs.forEach((tab) => {
    const isActive = activeCategory === tab.id;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `category-tab${isActive ? ' is-active' : ''}`;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', String(isActive));
    btn.dataset.category = tab.id;

    const label = document.createElement('span');
    label.className = 'category-tab-label';
    label.textContent = tab.label;

    const count = document.createElement('span');
    count.className = 'category-tab-count';
    count.textContent = countByCategory(tab.id);
    count.setAttribute('aria-label', `${countByCategory(tab.id)} bookmarks`);

    btn.append(label, count);
    btn.addEventListener('click', () => {
      if (activeCategory === tab.id) return;
      activeCategory = tab.id;
      refreshView();
      requestAnimationFrame(() => {
        container.querySelector('.category-tab.is-active')?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      });
    });
    container.appendChild(btn);
  });

  updateCategoryTabsScrollState();
};

const updateCategoryTabsScrollState = () => {
  const wrap = document.querySelector('.category-tabs-scroll-wrap');
  const tabs = document.getElementById('category-tabs');
  if (!wrap || !tabs) return;

  const checkOverflow = () => {
    wrap.classList.toggle('is-scrollable', tabs.scrollWidth > tabs.clientWidth + 2);
  };

  checkOverflow();
  if (!tabs.dataset.scrollBound) {
    tabs.dataset.scrollBound = 'true';
    tabs.addEventListener('scroll', checkOverflow, { passive: true });
    window.addEventListener('resize', checkOverflow);
  }
};

const refreshView = ({ animate = false } = {}) => {
  renderCategoryTabs();
  const { data, isFiltered } = getCurrentView();
  renderBookmarks(data, { isFiltered, animate });
};

// ── Search ─────────────────────────────────────────────────
const searchBookmarks = () => {
  const { data, isFiltered } = getCurrentView();
  renderBookmarks(data, { isFiltered, animate: false });
};

document.getElementById('search').addEventListener('input', searchBookmarks);

// ── Delete ─────────────────────────────────────────────────
const deleteBookmarks = (id) => {
  Swal.fire({
    title: 'Delete Bookmark?',
    text: 'This action cannot be undone',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#EF4444',
    cancelButtonColor: '#94A3B8',
    confirmButtonText: 'Yes, delete it',
    cancelButtonText: 'Cancel',
    ...swalTheme(),
  }).then((result) => {
    if (result.isConfirmed) {
      const data = JSON.parse(localStorage.getItem('bookmarksData')) || [];
      localStorage.setItem('bookmarksData', JSON.stringify(data.filter((item) => item.id !== id)));
      refreshView();
      Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: 'Your bookmark has been removed',
        timer: 1500,
        showConfirmButton: false,
        ...swalTheme(),
      });
    }
  });
};

// ── Edit ───────────────────────────────────────────────────
const editBookmark = (id) => {
  const data = JSON.parse(localStorage.getItem('bookmarksData')) || [];
  const bookmark = data.find((item) => item.id === id);
  if (!bookmark) return;

  const inputStyle = `
    width:100%; padding:9px 12px; margin-top:6px;
    background:#1C2128;
    border:1px solid #30363D;
    border-radius:10px; font-size:.875rem;
    color:#F0F6FC;
    outline:none; font-family:inherit;
    text-align:left; direction:ltr;
    transition:border-color .2s;
  `;

  Swal.fire({
    title: 'Edit Bookmark',
    ...swalTheme(),
    html: `
      <div style="text-align:left; display:flex; flex-direction:column; gap:14px;">
        <div>
          <label style="font-size:.8rem;font-weight:600;color:#8B949E">Title *</label>
          <input id="swal-title" value="${escapeHtml(bookmark.title)}" placeholder="e.g., GitHub" style="${inputStyle}" />
        </div>
        <div>
          <label style="font-size:.8rem;font-weight:600;color:#8B949E">URL *</label>
          <input id="swal-link" value="${escapeHtml(bookmark.link)}" placeholder="https://example.com" style="${inputStyle}" />
        </div>
        <div>
          <label style="font-size:.8rem;font-weight:600;color:#8B949E">Category</label>
          <input id="swal-category" value="${escapeHtml(bookmark.category || '')}" placeholder="e.g., Development" style="${inputStyle}" />
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Save Changes',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#3B82F6',
    cancelButtonColor: '#21262D',
    focusConfirm: false,
    didOpen: () => {
      // Allow Enter key to confirm from any input in the modal
      ['swal-title', 'swal-link', 'swal-category'].forEach((id) => {
        document.getElementById(id).addEventListener('keydown', (e) => {
          if (e.key === 'Enter') Swal.clickConfirm();
        });
      });
    },
    preConfirm: () => {
      const title    = document.getElementById('swal-title').value.trim();
      const link     = document.getElementById('swal-link').value.trim();
      const category = document.getElementById('swal-category').value.trim();

      if (!title || !link) {
        Swal.showValidationMessage('Title and URL are required');
        return false;
      }
      try { new URL(link); } catch {
        Swal.showValidationMessage('Please enter a valid URL');
        return false;
      }
      return { title, link, category };
    },
  }).then((result) => {
    if (result.isConfirmed && result.value) {
      const { title, link, category } = result.value;
      const updated = data.map((item) =>
        item.id === id ? { ...item, title, link, category } : item
      );
      localStorage.setItem('bookmarksData', JSON.stringify(updated));
      refreshView();
      Swal.fire({
        icon: 'success',
        title: 'Updated!',
        text: 'Your bookmark has been updated',
        timer: 1800,
        showConfirmButton: false,
        ...swalTheme(),
      });
    }
  });
};

// Expose globals
window.deleteBookmarks = deleteBookmarks;
window.editBookmark    = editBookmark;
window.searchBookmarks = searchBookmarks;

// Init
document.addEventListener('DOMContentLoaded', () => {
  initFormCollapse();
  initCategoryCollapse();
  initCategoryAutocomplete();
  initSortable();
  renderCategoryTabs();
  renderBookmarks(getAllBookmarks(), { isFiltered: false, animate: true });
});
