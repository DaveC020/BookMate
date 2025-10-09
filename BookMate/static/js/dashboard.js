// dashboard.js
import { fetchBooks, removeBook } from "./utils/api.js";
import {
  toggleSections,
  renderSearchResults,
  handleBookRemoval,
} from "./utils/ui.js";

console.log("Dashboard loaded ✅");

document.addEventListener("DOMContentLoaded", () => {
  initSearchHandler();
  initRemoveHandler();
});

function initSearchHandler() {
  const searchBtn = document.getElementById("searchButton");
  const searchInput = document.getElementById("searchInput");

  if (!searchBtn || !searchInput) {
    console.error("Search input or button not found!");
    return;
  }

  searchBtn.addEventListener("click", async () => {
    const query = searchInput.value.trim();
    if (!query) return alert("Please type something to search!");

    toggleSections("search");
    console.log(`🔍 Searching for: ${query}`);

    try {
      const data = await fetchBooks(query);
      renderSearchResults(data.results, query)
    } catch (err) {
      console.error("❌ Error fetching books:", err);
      alert("Something went wrong while searching.");
    }
  });
}

function initRemoveHandler() {
  document.addEventListener("click", async (event) => {
    if (!event.target.classList.contains("remove-btn")) return;

    const olid = event.target.dataset.olid;
    if (!olid) return alert("Missing book ID!");
    if (!confirm("Remove this book from your list?")) return;

    try {
      const result = await removeBook(olid);
      alert(result.message);

      if (result.success) handleBookRemoval(event.target);
    } catch (err) {
      console.error("❌ Error removing book:", err);
      alert("Something went wrong while removing.");
    }
  });
}

// funtion to direct search grid to book preview
// Delegate click event for search results
document.addEventListener("click", function (e) {
  // 🛑 Skip redirect if clicking on Add or Remove buttons
  if (e.target.closest(".add-btn") || e.target.closest(".remove-btn")) return;

  const card = e.target.closest(".search-book-card");
  if (card) {
    const olid = card.dataset.olid;
    if (olid) {
      window.location.href = `/book/${olid}/`; // same pattern as your Django URL
    }
  }
});

