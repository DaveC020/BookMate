// dashboard.js
import { fetchBooks, removeBook } from "./utils/api.js";
import {
  toggleSections,
  renderSearchResults,
  handleBookRemoval,
} from "./utils/ui.js";
import { showWarning, showError, showSuccess, showInfo } from "./utils/notifications.js";
import { confirmBookRemoval } from "./utils/confirm-dialog.js";

console.log("Dashboard loaded ✅");

document.addEventListener("DOMContentLoaded", () => {
  initSearchHandler();
  initRemoveHandler();
  initEditHandler();
  initFavoriteHandler();
  initFilterHandler();
  initSortHandler();
  restoreSearchFromURL();
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
    if (!query) return showWarning("Please type something to search!", { title: "Search Required" });

    toggleSections("search");
    console.log(`🔍 Searching for: ${query}`);

    // Save search query to URL
    const url = new URL(window.location);
    url.searchParams.set('search', query);
    window.history.pushState({}, '', url);

    try {
      const data = await fetchBooks(query);
      renderSearchResults(data.results, query)
    } catch (err) {
      console.error("❌ Error fetching books:", err);
      showError("Something went wrong while searching.", { title: "Search Error" });
    }
  });
}  

// Flag to prevent multiple initializations
let favoriteHandlerInitialized = false;

function initFavoriteHandler() {
  // Prevent multiple event listener attachments
  if (favoriteHandlerInitialized) return;
  favoriteHandlerInitialized = true;

  document.addEventListener("click", async (event) => {
    if (!event.target.closest(".favorite-btn")) return;

    const button = event.target.closest(".favorite-btn");
    const olid = button.dataset.olid;
    
    if (!olid) return showWarning("Missing book ID!", { title: "Error" });
    
    // Prevent double-clicks
    if (button.disabled) return;
    button.disabled = true;

    try {
      const response = await fetch("/api/toggle_favorite/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify({ olid }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Toggle the favorited class and update icon
        const starIcon = button.querySelector(".star-icon");
        
        if (data.is_favorite) {
          button.classList.add("favorited");
          starIcon.textContent = "★";
          button.title = "Remove from favorites";
          showSuccess("Added to favorites! ⭐", { title: "Success" });
        } else {
          button.classList.remove("favorited");
          starIcon.textContent = "☆";
          button.title = "Add to favorites";
          showInfo("Removed from favorites", { title: "Favorite Removed" });
        }
        
        // Re-apply current sort if sorting by favorites
        const sortSelect = document.getElementById("sortSelect");
        if (sortSelect && sortSelect.value === "favorite-first") {
          sortBooks(sortSelect.value);
        }
      } else {
        showError(data.message || "Failed to update favorite status", { title: "Error" });
      }
    } catch (err) {
      console.error("❌ Error toggling favorite:", err);
      showError("Something went wrong while updating.", { title: "Error" });
    } finally {
      // Re-enable button after request completes
      setTimeout(() => {
        button.disabled = false;
      }, 300);
    }
  });
}

// Flag to prevent multiple initializations
let filterHandlerInitialized = false;

function initFilterHandler() {
  // Prevent multiple event listener attachments
  if (filterHandlerInitialized) return;
  filterHandlerInitialized = true;

  const filterButtons = document.querySelectorAll(".filter-btn");
  const bookCards = document.querySelectorAll("#user-books .book-card");

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Update active button
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const filter = btn.dataset.filter;

      // Filter books
      bookCards.forEach((card) => {
        const favoriteBtn = card.querySelector(".favorite-btn");
        const isFavorite = favoriteBtn && favoriteBtn.classList.contains("favorited");

        if (filter === "all") {
          card.style.display = "block";
        } else if (filter === "favorites") {
          card.style.display = isFavorite ? "block" : "none";
        }
      });

      // Show message if no favorites
      if (filter === "favorites") {
        const visibleCards = Array.from(bookCards).filter(
          (card) => card.style.display !== "none"
        );
        
        const userBooksGrid = document.getElementById("user-books");
        let noFavMsg = userBooksGrid.querySelector(".no-favorites-msg");
        
        if (visibleCards.length === 0) {
          if (!noFavMsg) {
            noFavMsg = document.createElement("p");
            noFavMsg.className = "no-favorites-msg";
            noFavMsg.textContent = "No favorite books yet. Click the ⭐ star to mark books as favorites!";
            noFavMsg.style.cssText = "text-align: center; color: #8B5A2B; font-style: italic; margin-top: 1rem;";
            userBooksGrid.appendChild(noFavMsg);
          }
        } else if (noFavMsg) {
          noFavMsg.remove();
        }
      } else {
        const noFavMsg = document.querySelector(".no-favorites-msg");
        if (noFavMsg) noFavMsg.remove();
      }
      
      // Re-apply current sort after filtering
      const sortSelect = document.getElementById("sortSelect");
      if (sortSelect) {
        sortBooks(sortSelect.value);
      }
    });
  });
}

function restoreSearchFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const searchQuery = urlParams.get('search');
  
  if (searchQuery) {
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
      searchInput.value = searchQuery;
      // Trigger the search automatically
      document.getElementById("searchButton").click();
    }
  }
}

// Flag to prevent multiple initializations
let removeHandlerInitialized = false;

function initRemoveHandler() {
  // Prevent multiple event listener attachments
  if (removeHandlerInitialized) return;
  removeHandlerInitialized = true;

  document.addEventListener("click", async (event) => {
    if (!event.target.classList.contains("remove-btn")) return;

    const olid = event.target.dataset.olid;
    if (!olid) return showWarning("Missing book ID!", { title: "Error" });
    
    // Get book title for confirmation dialog
    const bookCard = event.target.closest('.book-card');
    const bookTitle = bookCard?.querySelector('.book-title')?.textContent || 'this book';
    
    // Show custom confirmation dialog
    const confirmed = await confirmBookRemoval(bookTitle);
    if (!confirmed) return;

    try {
      const result = await removeBook(olid);
      
      if (result.success) {
        showSuccess("Book removed from your list!", { title: "Success" });
        handleBookRemoval(event.target);
      } else {
        showError(result.message || "Failed to remove book", { title: "Error" });
      }
    } catch (err) {
      console.error("❌ Error removing book:", err);
      showError("Something went wrong while removing.", { title: "Error" });
    }
  });
}

// Flag to prevent multiple initializations
let editHandlerInitialized = false;

function initEditHandler() {
  if (editHandlerInitialized) return;
  editHandlerInitialized = true;

  const modal = document.getElementById("editBookModal");
  const form = document.getElementById("editBookForm");
  const closeBtn = document.querySelector(".close-modal");

  // Close when clicking X
  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // Close on background click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });

  // Open modal
  document.addEventListener("click", (event) => {
  if (!event.target.classList.contains("edit-btn")) return;

  const olid = event.target.dataset.olid;
  const currentPage = event.target.dataset.page || 0;
  const totalPages = event.target.dataset.pages || 0;
  const percent = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;

  // Fill modal fields
  document.getElementById("editBookOlid").value = olid;
  document.getElementById("editBookProgress").value = currentPage;

  // ✅ Update label to show "Current Page (34 of 300)"
  const label = document.getElementById("currentPageLabel");
  label.textContent = `Current Page (${currentPage} of ${totalPages}) — ${percent}%`;

  modal.style.display = "flex";
});


  // Close modal on background click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });

  // Submit handler
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const olid = document.getElementById("editBookOlid").value;
    const progress = document.getElementById("editBookProgress").value;

    const res = await fetch("/api/update_progress/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken")
      },
      body: JSON.stringify({ olid, progress })
    });

    const data = await res.json();

    if (!data.success) {
      showError("Failed to update progress");
      return;
    }

    // Update UI
    const card = document.querySelector(`.book-card[data-olid="${olid}"]`);
    const btn = card?.querySelector(".edit-btn");
    if (btn) btn.dataset.page = progress;

    showSuccess("Reading progress updated!");
    modal.style.display = "none";
  });

  // Live update progress percentage when typing
  document.getElementById("editBookProgress").addEventListener("input", function() {
    const currentPage = parseInt(this.value) || 0;
    const totalPages = parseInt(document.querySelector(`.edit-btn[data-olid="${document.getElementById("editBookOlid").value}"]`)?.dataset.pages) || 0;
    const percent = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;

    document.getElementById("currentPageLabel").textContent =
      `Current Page (${currentPage} of ${totalPages}) — ${percent}%`;
  });

  // Reset handler
  const resetBtn = document.getElementById("resetProgressBtn");

  resetBtn.addEventListener("click", async () => {
    const olid = document.getElementById("editBookOlid").value;

    const res = await fetch("/api/update_progress/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken")
      },
      body: JSON.stringify({ olid, progress: 0 })
    });

    const data = await res.json();

    if (data.success) {
      // Update UI button attribute
      const card = document.querySelector(`.book-card[data-olid="${olid}"]`);
      const btn = card?.querySelector(".edit-btn");
      const totalPages = parseInt(btn?.dataset.pages) || 0;

      if (btn) btn.dataset.page = 0;

      // Reset modal UI
      document.getElementById("editBookProgress").value = 0;
      document.getElementById("currentPageLabel").textContent =
        `Current Page (0 of ${totalPages}) — 0%`;

      showSuccess("Progress reset to 0");
    } else {
      showError("Failed to reset progress");
    }
  });
}


// Helper function to get CSRF token
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
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
      // Get current search query from URL
      const urlParams = new URLSearchParams(window.location.search);
      const searchQuery = urlParams.get('search');
      
      // Build URL with search parameter if it exists
      let bookUrl = `/book/${olid}/`;
      if (searchQuery) {
        bookUrl += `?search=${encodeURIComponent(searchQuery)}`;
      }
      
      window.location.href = bookUrl;
    }
  }
});

// === HAMBURGER MENU TOGGLE ===
document.addEventListener("DOMContentLoaded", () => {
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const dropdownMenu = document.getElementById("dropdownMenu");

  if (hamburgerBtn && dropdownMenu) {
    // Toggle dropdown on button click
    hamburgerBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      hamburgerBtn.classList.toggle("active");
      dropdownMenu.classList.toggle("show");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!hamburgerBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
        hamburgerBtn.classList.remove("active");
        dropdownMenu.classList.remove("show");
      }
    });

    // Close dropdown when clicking a link
    dropdownMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        hamburgerBtn.classList.remove("active");
        dropdownMenu.classList.remove("show");
      });
    });
  }
});

// Flag to prevent multiple initializations
let sortHandlerInitialized = false;

function initSortHandler() {
  // Prevent multiple event listener attachments
  if (sortHandlerInitialized) return;
  sortHandlerInitialized = true;

  const sortSelect = document.getElementById("sortSelect");
  
  if (!sortSelect) {
    console.error("Sort select not found!");
    return;
  }

  sortSelect.addEventListener("change", () => {
    const sortValue = sortSelect.value;
    sortBooks(sortValue);
  });
}

function sortBooks(sortBy) {
  const bookGrid = document.getElementById("user-books");
  const bookCards = Array.from(bookGrid.querySelectorAll(".book-card"));
  
  // Remove the "no favorites" message if it exists during sorting
  const noFavMsg = bookGrid.querySelector(".no-favorites-msg");
  if (noFavMsg) {
    noFavMsg.remove();
  }

  bookCards.sort((a, b) => {
    let compareValue = 0;

    switch (sortBy) {
      case "title-asc":
        const titleA = (a.dataset.title || "").toLowerCase();
        const titleB = (b.dataset.title || "").toLowerCase();
        compareValue = titleA.localeCompare(titleB);
        break;

      case "title-desc":
        const titleDescA = (a.dataset.title || "").toLowerCase();
        const titleDescB = (b.dataset.title || "").toLowerCase();
        compareValue = titleDescB.localeCompare(titleDescA);
        break;

      case "author-asc":
        const authorA = (a.dataset.author || "Unknown").toLowerCase();
        const authorB = (b.dataset.author || "Unknown").toLowerCase();
        compareValue = authorA.localeCompare(authorB);
        break;

      case "author-desc":
        const authorDescA = (a.dataset.author || "Unknown").toLowerCase();
        const authorDescB = (b.dataset.author || "Unknown").toLowerCase();
        compareValue = authorDescB.localeCompare(authorDescA);
        break;

      case "favorite-first":
        const isFavA = a.querySelector(".favorite-btn")?.classList.contains("favorited") ? 1 : 0;
        const isFavB = b.querySelector(".favorite-btn")?.classList.contains("favorited") ? 1 : 0;
        compareValue = isFavB - isFavA; // Favorites first
        
        // Secondary sort by title if same favorite status
        if (compareValue === 0) {
          const titleFavA = (a.dataset.title || "").toLowerCase();
          const titleFavB = (b.dataset.title || "").toLowerCase();
          compareValue = titleFavA.localeCompare(titleFavB);
        }
        break;
    }

    return compareValue;
  });

  // Re-append cards in sorted order
  bookCards.forEach((card) => {
    bookGrid.appendChild(card);
  });

  // Show animation
  bookCards.forEach((card, index) => {
    card.style.animation = "none";
    setTimeout(() => {
      card.style.animation = `fadeIn 0.4s ease-out ${index * 0.05}s both`;
    }, 10);
  });

  // Re-check if we need to show "no favorites" message
  const activeFilter = document.querySelector(".filter-btn.active");
  if (activeFilter && activeFilter.dataset.filter === "favorites") {
    const visibleCards = bookCards.filter((card) => card.style.display !== "none");
    if (visibleCards.length === 0) {
      const newNoFavMsg = document.createElement("p");
      newNoFavMsg.className = "no-favorites-msg";
      newNoFavMsg.textContent = "No favorite books yet. Click the ⭐ star to mark books as favorites!";
      newNoFavMsg.style.cssText = "text-align: center; color: #8B5A2B; font-style: italic; margin-top: 1rem;";
      bookGrid.appendChild(newNoFavMsg);
    }
  }
}
