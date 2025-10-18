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

// ✅ Add event listener for Add Book button
document.addEventListener("DOMContentLoaded", () => {
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
