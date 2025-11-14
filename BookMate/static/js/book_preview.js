// static/js/book_preview.js

// Import notification system
import { showSuccess, showError } from "./utils/notifications.js";

// ✅ Function to get the CSRF token from cookies
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

// Current tags array
let currentTags = [];

// Get OLID from page
function getBookOlid() {
  const addButton = document.querySelector(".add-button");
  return addButton ? addButton.getAttribute("data-olid") : null;
}

// Load existing tags from the page
function loadExistingTags() {
  const tagElements = document.querySelectorAll(".tag");
  currentTags = Array.from(tagElements).map(tag => tag.getAttribute("data-tag"));
}

// Update tags on server
async function updateTagsOnServer(tags) {
  const olid = getBookOlid();
  if (!olid) return;

  try {
    const res = await fetch("/api/update_tags/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken"),
      },
      body: JSON.stringify({ olid, tags }),
    });

    if (!res.ok) throw new Error("Failed to update tags");
    const data = await res.json();
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// Render tags in the UI
function renderTags() {
  const tagsContainer = document.getElementById("tagsContainer");
  if (!tagsContainer) return;

  if (currentTags.length === 0) {
    tagsContainer.innerHTML = '<p class="no-tags-message">No tags yet. Add tags like "School," "Romance," or "Adventure" to get better recommendations!</p>';
    return;
  }

  tagsContainer.innerHTML = currentTags
    .map(
      (tag) => `
    <span class="tag" data-tag="${tag}">
      ${tag}
      <button class="remove-tag-btn" data-tag="${tag}">×</button>
    </span>
  `
    )
    .join("");

  // Attach remove handlers
  document.querySelectorAll(".remove-tag-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const tagToRemove = btn.getAttribute("data-tag");
      currentTags = currentTags.filter((t) => t !== tagToRemove);
      renderTags();
      
      try {
        await updateTagsOnServer(currentTags);
        showSuccess(`Tag "${tagToRemove}" removed!`);
      } catch (error) {
        showError("Failed to remove tag. Please try again.");
      }
    });
  });
}

// Add a new tag
async function addTag(tagText) {
  const trimmedTag = tagText.trim();
  
  if (!trimmedTag) {
    showError("Please enter a tag name.");
    return;
  }

  if (currentTags.includes(trimmedTag)) {
    showError("This tag already exists!");
    return;
  }

  if (currentTags.length >= 10) {
    showError("Maximum 10 tags allowed per book.");
    return;
  }

  currentTags.push(trimmedTag);
  renderTags();

  try {
    await updateTagsOnServer(currentTags);
    showSuccess(`Tag "${trimmedTag}" added!`);
    document.getElementById("tagInput").value = "";
  } catch (error) {
    currentTags = currentTags.filter((t) => t !== trimmedTag);
    renderTags();
    showError("Failed to add tag. Please try again.");
  }
}

// Fetch user's existing tags for autocomplete
async function fetchUserTags() {
  try {
    const res = await fetch("/api/get_user_tags/");
    if (!res.ok) throw new Error("Failed to fetch tags");
    const data = await res.json();
    return data.tags || [];
  } catch (error) {
    console.error("Error fetching user tags:", error);
    return [];
  }
}

// Show tag suggestions
function showTagSuggestions(suggestions, inputValue) {
  const suggestionsContainer = document.getElementById("tagSuggestions");
  if (!suggestionsContainer) return;

  if (suggestions.length === 0 || !inputValue) {
    suggestionsContainer.classList.remove("show");
    return;
  }

  const filtered = suggestions.filter(
    (tag) =>
      tag.toLowerCase().includes(inputValue.toLowerCase()) &&
      !currentTags.includes(tag)
  );

  if (filtered.length === 0) {
    suggestionsContainer.classList.remove("show");
    return;
  }

  suggestionsContainer.innerHTML = filtered
    .slice(0, 5)
    .map((tag) => `<div class="tag-suggestion" data-tag="${tag}">${tag}</div>`)
    .join("");

  suggestionsContainer.classList.add("show");

  // Attach click handlers
  document.querySelectorAll(".tag-suggestion").forEach((suggestion) => {
    suggestion.addEventListener("click", () => {
      const tag = suggestion.getAttribute("data-tag");
      addTag(tag);
      suggestionsContainer.classList.remove("show");
    });
  });
}

// ✅ Add event listener for Add Book button
document.addEventListener("DOMContentLoaded", () => {
  // Load existing tags
  loadExistingTags();

  const addButton = document.querySelector(".add-button");
  if (addButton) {
    addButton.addEventListener("click", async () => {
      const olid = addButton.getAttribute("data-olid");
      const title = document.querySelector("h2")?.textContent || "";
      const author = document.querySelector("h3")?.textContent || "Unknown Author";
      const cover_url = document.querySelector(".main-book")?.src || "";

      try {
        const res = await fetch("/api/add_book/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken"), // ✅ CSRF token included
          },
          body: JSON.stringify({
            olid,
            title,
            author,
            cover_url,
          }),
        });

        if (!res.ok) throw new Error("Failed to add book");
        const data = await res.json();
        showSuccess("Book added to your list!", { title: "Success" });
      } catch (error) {
        console.error(error);
        showError("Failed to add book. Please try again.", { title: "Error" });
      }
    });
  }

  // Tag Management
  const addTagBtn = document.getElementById("addTagBtn");
  const tagInput = document.getElementById("tagInput");

  if (addTagBtn && tagInput) {
    // Add tag on button click
    addTagBtn.addEventListener("click", () => {
      addTag(tagInput.value);
    });

    // Add tag on Enter key
    tagInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addTag(tagInput.value);
      }
    });

    // Autocomplete suggestions
    let userTags = [];
    fetchUserTags().then((tags) => {
      userTags = tags;
    });

    tagInput.addEventListener("input", (e) => {
      showTagSuggestions(userTags, e.target.value);
    });

    // Hide suggestions when clicking outside
    document.addEventListener("click", (e) => {
      if (!tagInput.contains(e.target)) {
        document.getElementById("tagSuggestions")?.classList.remove("show");
      }
    });
  }

  // Hamburger Menu Toggle
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const dropdownMenu = document.getElementById("dropdownMenu");

  if (hamburgerBtn && dropdownMenu) {
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
  }
});
