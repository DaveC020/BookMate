// utils/api.js

// 🔍 Fetch books from the API
export async function fetchBooks(query) {
  const response = await fetch(`/api/search/?q=${encodeURIComponent(query)}`);
  return response.json();
}

// ➕ Add a book to the user’s list
export async function addBook(payload) {
  const res = await fetch("/api/add_book/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

// ❌ Remove a book from the user’s list
export async function removeBook(olid) {
  const res = await fetch("/api/remove_book/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ olid }),
  });
  const data = await res.json();
  return { ...data, success: res.ok };
}
