// HTML escape function for security
const escapeHtml = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

// ── Dark Mode ──────────────────────────────────────────────
const applyTheme = (dark) => {
  document.documentElement.classList.toggle('dark', dark);
  localStorage.setItem('bm-theme', dark ? 'dark' : 'light');
};

const savedTheme = localStorage.getItem('bm-theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
applyTheme(savedTheme ? savedTheme === 'dark' : prefersDark);

document.getElementById('theme-toggle').addEventListener('click', () => {
  applyTheme(!document.documentElement.classList.contains('dark'));
});

// ── SweetAlert2 helpers ────────────────────────────────────
const swalTheme = () => ({
  background: document.documentElement.classList.contains('dark') ? '#111827' : '#ffffff',
  color:      document.documentElement.classList.contains('dark') ? '#F8FAFC'  : '#0F172A',
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

const addToLocalStorage = (title, link, category) => {
  const data = { id: nanoid(), title, link, category };
  const existing = JSON.parse(localStorage.getItem('bookmarksData')) || [];
  existing.push(data);
  localStorage.setItem('bookmarksData', JSON.stringify(existing));
  displayBookmarks();
};

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
      <div class="bc-drag-handle" aria-hidden="true">
        <svg width="16" height="8" viewBox="0 0 16 8" fill="currentColor">
          <circle cx="2" cy="2" r="1.5"/><circle cx="8" cy="2" r="1.5"/><circle cx="14" cy="2" r="1.5"/>
          <circle cx="2" cy="6" r="1.5"/><circle cx="8" cy="6" r="1.5"/><circle cx="14" cy="6" r="1.5"/>
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

// ── Drag and Drop ──────────────────────────────────────────
let dragSrcId = null;

const makeDraggable = (wrapper, bookmarkId) => {
  wrapper.setAttribute('draggable', 'true');
  wrapper.dataset.id = bookmarkId;

  wrapper.addEventListener('dragstart', (e) => {
    dragSrcId = bookmarkId;
    wrapper.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', bookmarkId);
  });

  wrapper.addEventListener('dragend', () => {
    wrapper.classList.remove('dragging');
    document.querySelectorAll('.bookmark-card-wrapper').forEach((w) => {
      w.classList.remove('drag-over', 'drop-before', 'drop-after');
    });
  });

  wrapper.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragSrcId === bookmarkId) return;

    document.querySelectorAll('.bookmark-card-wrapper').forEach((w) => {
      w.classList.remove('drag-over');
    });
    wrapper.classList.add('drag-over');
  });

  wrapper.addEventListener('dragleave', (e) => {
    // Only remove if leaving the wrapper entirely
    if (!wrapper.contains(e.relatedTarget)) {
      wrapper.classList.remove('drag-over');
    }
  });

  wrapper.addEventListener('drop', (e) => {
    e.preventDefault();
    if (dragSrcId === bookmarkId) return;

    const data = JSON.parse(localStorage.getItem('bookmarksData')) || [];
    const srcIndex  = data.findIndex((b) => b.id === dragSrcId);
    const destIndex = data.findIndex((b) => b.id === bookmarkId);
    if (srcIndex === -1 || destIndex === -1) return;

    // Reorder: remove src, insert at dest position
    const [moved] = data.splice(srcIndex, 1);
    data.splice(destIndex, 0, moved);

    localStorage.setItem('bookmarksData', JSON.stringify(data));
    displayBookmarks();
  });
};

// ── Display all bookmarks ──────────────────────────────────
const displayBookmarks = () => {
  const container = document.getElementById('bookmarks-container');
  container.innerHTML = '';
  const data = JSON.parse(localStorage.getItem('bookmarksData')) || [];

  if (data.length === 0) {
    document.getElementById('not-found').classList.remove('hidden');
    return;
  }

  document.getElementById('not-found').classList.add('hidden');
  data.forEach((bookmark) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'bookmark-card-wrapper';
    wrapper.innerHTML = buildCardHTML(bookmark);
    makeDraggable(wrapper, bookmark.id);
    container.appendChild(wrapper);
  });
};

// ── Search ─────────────────────────────────────────────────
const searchBookmarks = () => {
  const query = document.getElementById('search').value.toLowerCase();
  const allData = JSON.parse(localStorage.getItem('bookmarksData')) || [];
  const filtered = query
    ? allData.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          (item.category && item.category.toLowerCase().includes(query))
      )
    : allData;
  displayFilteredBookmarks(filtered);
};

const displayFilteredBookmarks = (data) => {
  const container = document.getElementById('bookmarks-container');
  container.innerHTML = '';

  if (data.length === 0) {
    document.getElementById('not-found').classList.remove('hidden');
    return;
  }

  document.getElementById('not-found').classList.add('hidden');
  data.forEach((bookmark) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'bookmark-card-wrapper';
    wrapper.innerHTML = buildCardHTML(bookmark);
    // Don't enable drag during search — order changes would be confusing
    container.appendChild(wrapper);
  });
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
      displayBookmarks();
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

  const isDark = document.documentElement.classList.contains('dark');
  const inputStyle = `
    width:100%; padding:9px 12px; margin-top:6px;
    background:${isDark ? '#1E293B' : '#F8FAFC'};
    border:1.5px solid ${isDark ? '#334155' : '#CBD5E1'};
    border-radius:10px; font-size:.875rem;
    color:${isDark ? '#F8FAFC' : '#0F172A'};
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
          <label style="font-size:.8rem;font-weight:600;color:${isDark ? '#94A3B8' : '#475569'}">Title *</label>
          <input id="swal-title" value="${escapeHtml(bookmark.title)}" placeholder="e.g., GitHub" style="${inputStyle}" />
        </div>
        <div>
          <label style="font-size:.8rem;font-weight:600;color:${isDark ? '#94A3B8' : '#475569'}">URL *</label>
          <input id="swal-link" value="${escapeHtml(bookmark.link)}" placeholder="https://example.com" style="${inputStyle}" />
        </div>
        <div>
          <label style="font-size:.8rem;font-weight:600;color:${isDark ? '#94A3B8' : '#475569'}">Category</label>
          <input id="swal-category" value="${escapeHtml(bookmark.category || '')}" placeholder="e.g., Development" style="${inputStyle}" />
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Save Changes',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#10B981',
    cancelButtonColor: isDark ? '#334155' : '#94A3B8',
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
      displayBookmarks();
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
document.addEventListener('DOMContentLoaded', displayBookmarks);
