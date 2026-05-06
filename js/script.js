// HTML escape function for security
const escapeHtml = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

// Configure SweetAlert2 for modern light theme
Swal.mixin({
  background: '#ffffff',
  color: '#1e293b',
  confirmButtonColor: '#2563eb',
  confirmButtonText: 'OK',
});

// when add button is clicked
document.getElementById("btn-add").addEventListener("click", function (event) {
  event.preventDefault();
  const title = document.getElementById("title").value.trim();
  const link = document.getElementById("link").value.trim();
  const category = document.getElementById("category").value.trim();
  
  if (!title || !link) {
    Swal.fire({
      icon: 'warning',
      title: 'Missing Fields',
      text: 'Please fill in Title and URL to add a bookmark',
      background: '#ffffff',
      color: '#1e293b',
    });
    return;
  }

  // Simple URL validation
  try {
    new URL(link);
  } catch (e) {
    Swal.fire({
      icon: 'error',
      title: 'Invalid URL',
      text: 'Please enter a valid URL',
      background: '#ffffff',
      color: '#1e293b',
    });
    return;
  }

  addToLocalStorage(title, link, category);
  
  // Clear inputs
  document.getElementById("title").value = "";
  document.getElementById("link").value = "";
  document.getElementById("category").value = "";
  
  // Show success message
  Swal.fire({
    icon: 'success',
    title: 'Bookmark Added!',
    text: 'Your bookmark has been saved successfully',
    timer: 2000,
    showConfirmButton: false,
    background: '#ffffff',
    color: '#1e293b',
  });
});

// add items to the localStorage
import { nanoid } from "https://cdn.jsdelivr.net/npm/nanoid@4.0.0/nanoid.js";
const addToLocalStorage = (title, link, category) => {
  console.log(title, link, category);
  const data = {
    id: nanoid(),
    title,
    link,
    category,
  };
  // console.log(data);
  const existingData = JSON.parse(localStorage.getItem("bookmarksData")) || [];

  existingData.push(data);
  localStorage.setItem("bookmarksData", JSON.stringify(existingData));

  displayBookmarks();
};

// display bookmarks data in a card
const displayBookmarks = () => {
  const bookmarksContainer = document.getElementById("bookmarks-container");

  // Clear previous bookmarks before rendering new ones
  bookmarksContainer.innerHTML = "";

  const data = JSON.parse(localStorage.getItem("bookmarksData"));
  for (let bookmark of data) {
    const bookmarkCard = document.createElement("div");
    bookmarkCard.className = "group animate-fade-in";
    bookmarkCard.innerHTML = `
      <div class="h-full flex flex-col bg-bg-primary border border-border-color rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:border-accent-primary/50">
        <!-- Header -->
        <div class="flex items-start justify-between mb-3 gap-3">
          <div class="flex-1 min-w-0">
            <h3 class="text-base font-semibold text-text-primary break-words group-hover:text-accent-primary transition-colors duration-200">
              ${escapeHtml(bookmark.title)}
            </h3>
          </div>
          ${bookmark.category ? `<span class="flex-shrink-0 inline-block px-3 py-1 bg-accent-light border border-accent-primary/30 rounded-full text-xs font-medium text-accent-primary whitespace-nowrap">
            ${escapeHtml(bookmark.category)}
          </span>` : ''}
        </div>

        <!-- Link -->
        <a
          href="${bookmark.link}"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 text-accent-primary hover:text-accent-hover font-medium text-sm mb-4 transition-colors duration-200 break-all"
        >
          <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          <span class="truncate text-xs">Visit</span>
        </a>

        <!-- Spacer -->
        <div class="flex-1"></div>

        <!-- Delete Button -->
        <button
          onclick="deleteBookmarks('${bookmark.id}')"
          class="w-full px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-red-600 hover:text-red-700 font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete
        </button>
      </div>
    `;
    bookmarksContainer.appendChild(bookmarkCard);
  }
};

//search functionality
const searchBookmarks = () => {
  const searchInput = document.getElementById("search").value.toLowerCase();

  // Always get the original data from localStorage
  const allData = JSON.parse(localStorage.getItem("bookmarksData")) || [];

  // If the search bar is empty, show all data
  const filteredData = searchInput
    ? allData.filter((item) => item.title.toLowerCase().includes(searchInput))
    : allData;

  displayFilteredBookmarks(filteredData);
};

// Function to update the UI without modifying localStorage
const displayFilteredBookmarks = (data) => {
  const bookmarksContainer = document.getElementById("bookmarks-container");
  bookmarksContainer.innerHTML = "";

  if (data.length === 0) {
    document.getElementById("not-found").style.display = "block";
    return;
  }

  document.getElementById("not-found").style.display = "none";
  for (let bookmark of data) {
    const bookmarkCard = document.createElement("div");
    bookmarkCard.className = "group animate-fade-in";
    bookmarkCard.innerHTML = `
      <div class="h-full flex flex-col bg-bg-primary border border-border-color rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:border-accent-primary/50">
        <!-- Header -->
        <div class="flex items-start justify-between mb-3 gap-3">
          <div class="flex-1 min-w-0">
            <h3 class="text-base font-semibold text-text-primary break-words group-hover:text-accent-primary transition-colors duration-200">
              ${escapeHtml(bookmark.title)}
            </h3>
          </div>
          ${bookmark.category ? `<span class="flex-shrink-0 inline-block px-3 py-1 bg-accent-light border border-accent-primary/30 rounded-full text-xs font-medium text-accent-primary whitespace-nowrap">
            ${escapeHtml(bookmark.category)}
          </span>` : ''}
        </div>

        <!-- Link -->
        <a
          href="${bookmark.link}"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 text-accent-primary hover:text-accent-hover font-medium text-sm mb-4 transition-colors duration-200 break-all"
        >
          <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          <span class="truncate text-xs">Visit</span>
        </a>

        <!-- Spacer -->
        <div class="flex-1"></div>

        <!-- Delete Button -->
        <button
          onclick="deleteBookmarks('${bookmark.id}')"
          class="w-full px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-red-600 hover:text-red-700 font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete
        </button>
      </div>
    `;
    bookmarksContainer.appendChild(bookmarkCard);
  }
};

// Call searchBookmarks on every input change
document.getElementById("search").addEventListener("input", searchBookmarks);

// delete bookmark card when delete button is clicked
const deleteBookmarks = (id) => {
  Swal.fire({
    title: 'Delete Bookmark?',
    text: 'This action cannot be undone',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#94a3b8',
    confirmButtonText: 'Yes, delete it',
    cancelButtonText: 'Cancel',
    background: '#ffffff',
    color: '#1e293b',
  }).then((result) => {
    if (result.isConfirmed) {
      const data = JSON.parse(localStorage.getItem("bookmarksData")) || [];
      const updatedData = data.filter((item) => item.id !== id);
      localStorage.setItem("bookmarksData", JSON.stringify(updatedData));
      displayBookmarks();
      
      Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: 'Your bookmark has been removed',
        timer: 1500,
        showConfirmButton: false,
        background: '#ffffff',
        color: '#1e293b',
      });
    }
  });
};

// Make deleteBookmarks accessible globally
window.deleteBookmarks = deleteBookmarks;
window.searchBookmarks = searchBookmarks;

// Call displayBookmarks when the page loads
document.addEventListener("DOMContentLoaded", displayBookmarks);
