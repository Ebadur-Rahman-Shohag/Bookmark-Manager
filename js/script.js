// when add button is clicked
document.getElementById("btn-add").addEventListener("click", function (event) {
    event.preventDefault();
    const title = document.getElementById("title").value;
    const link = document.getElementById("link").value;
    const category = document.getElementById("category").value;
    if (!title || !link || !category) {
        Swal.fire("Please fill all fields");
    }

    if (title && category && category) {
        addToLocalStorage(title, link, category);
    }

    document.getElementById("title").value = "";
    document.getElementById("link").value = "";
    document.getElementById("category").value = "";
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
        bookmarksContainer.innerHTML += `<div
            class="flex flex-col justify-center px-6 gap-4 border-2 border-black rounded-2xl py-4"
          >
            <div class="flex justify-between">
              <h3 class="text-black font-semibold text-2xl">
                ${bookmark.title}
              </h3>

              <span
                class="badge border-2 border-black px-3 py-3 text-lg font-normal"
                >${bookmark.category}</span
              >
            </div>

            <a
              target="_blank"
              class="text-blue-500 font-medium text-xl"
              href="${bookmark.link}"
              >Go to the website</a
            >
            <div   class="w-full text-right px-6">
              <button
                onclick=deleteBookmarks('${bookmark.id}')
                id="btn-delete-${bookmark.id}"
                class="border-2 border-black rounded-md px-8 py-2 font-medium text-xl"
              >
                Delete
              </button>
            </div>
          </div>`;
    }
};

// delete bookmark card when delete button is clicked
const deleteBookmarks = (id) => {
    const data = JSON.parse(localStorage.getItem("bookmarksData")) || [];
    const updatedData = data.filter((item) => item.id !== id);
    localStorage.setItem("bookmarksData", JSON.stringify(updatedData));
    displayBookmarks();
};

// Make deleteBookmarks accessible globally
window.deleteBookmarks = deleteBookmarks;

// Call displayBookmarks when the page loads
document.addEventListener("DOMContentLoaded", displayBookmarks);
