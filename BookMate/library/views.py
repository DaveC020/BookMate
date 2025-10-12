from django.shortcuts import render, redirect
from django.contrib.auth import login
from django.contrib import messages
from .forms import RegisterForm, LoginForm
from django.contrib.auth.models import User
from .models import UserBookList
from django.shortcuts import render, get_object_or_404
from django.core.cache import cache

#register function
def register_view(request):
    if request.method == "POST":
        form = RegisterForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            user.set_password(form.cleaned_data["password1"])
            user.save()
            messages.success(request, "✅ Registration successful! You can now log in.")
            return redirect("login")
            
        else:
            print(form.errors)  # 👈 this will show why validation failed
            messages.error(request, "⚠️ Please fix the errors below.")
    else:
        form = RegisterForm()

    return render(request, "register.html", {"form": form})

#login function
def login_view(request):
    if request.method == "POST":
        form = LoginForm(request, data=request.POST)
        username = request.POST.get("username")
        password = request.POST.get("password")

        # Check if username exists before validating the form
        if not User.objects.filter(username=username).exists():
            messages.error(request, "⚠️ User does not exist.")
        elif form.is_valid():
            user = form.get_user()
            login(request, user)
            return redirect("dashboard")
        else:
            messages.error(request, "⚠️ Incorrect credentials.")
    else:
        form = LoginForm()

    return render(request, "login.html", {"form": form})

def landing_view(request):
    return render(request, 'landing.html')

def genre_setup_view(request):
    if request.method == "POST":
        selected_genres = request.POST.getlist("genres")
        # TODO: Save genres to user profile (later)
        return redirect('dashboard')
    return render(request, 'genre_setup.html')

def dashboard_view(request):
    if not request.user.is_authenticated:
        return redirect('login')

    # Fetch this user's saved books
    user_books = UserBookList.objects.filter(user=request.user).order_by('title')

    return render(request, "dashboard.html", {
        "user_books": user_books
    })



def profile_view(request):
    if not request.user.is_authenticated:
        return redirect('login')
    return render(request, 'profile.html', {'user': request.user})


def edit_profile_view(request):
    if not request.user.is_authenticated:
        return redirect('login')

    user = request.user

    if request.method == "POST":
        username = request.POST.get("username")
        email = request.POST.get("email")
        password1 = request.POST.get("password1")
        password2 = request.POST.get("password2")

        # Update basic info
        user.username = username
        user.email = email

        # Handle password update (optional)
        if password1 and password1 == password2:
            user.set_password(password1)
            messages.success(request, "✅ Password updated successfully!")
        elif password1 or password2:
            messages.error(request, "⚠️ Passwords do not match!")

        user.save()
        messages.success(request, "✅ Profile updated successfully!")
        return redirect('profile')

    return render(request, 'edit_profile.html', {"user": user})



#api functionalities
import requests
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from .models import UserBookList

# --- SEARCH BOOKS via Open Library API ---
def search_books(request):
    query = request.GET.get("q", "")
    if not query:
        return JsonResponse({"results": []})

    url = f"https://openlibrary.org/search.json?q={query}"
    response = requests.get(url)
    data = response.json()

    results = []
    for book in data.get("docs", [])[:10]:
        olid = book.get("cover_edition_key") or (book.get("edition_key")[0] if book.get("edition_key") else None)
        cover_url = f"https://covers.openlibrary.org/b/olid/{olid}-M.jpg" if olid else None

        results.append({
            "title": book.get("title"),
            "author": ", ".join(book.get("author_name", [])) if book.get("author_name") else "Unknown",
            "cover_url": cover_url,
            "olid": olid,
        })

    return JsonResponse({"results": results})


# --- ADD BOOK TO USER LIST ---
@csrf_exempt
def add_book(request):
    if request.method == "POST":
        if not request.user.is_authenticated:
            return JsonResponse({"message": "You must be logged in to add books."}, status=403)

        data = json.loads(request.body)
        title = data.get("title")
        author = data.get("author")
        cover_url = data.get("cover_url")
        olid = data.get("olid")

        if not olid:
            return JsonResponse({"message": "Missing book ID (OLID)."}, status=400)

        book, created = UserBookList.objects.get_or_create(
            user=request.user,
            olid=olid,
            defaults={"title": title, "author": author, "cover_url": cover_url},
        )

        if not created:
            return JsonResponse({"message": "Book already in your list!"})
        return JsonResponse({"message": "Book added successfully!"})

# --- REMOVE BOOK FROM USER LIST ---
@csrf_exempt
def remove_book(request):
    if request.method == "POST":
        data = json.loads(request.body)
        olid = data.get("olid")

        if not olid:
            return JsonResponse({"error": "No OLID provided"}, status=400)

        # Delete the book belonging to this user
        deleted_count, _ = UserBookList.objects.filter(user=request.user, olid=olid).delete()

        if deleted_count > 0:
            return JsonResponse({"message": "Book removed successfully!"})
        else:
            return JsonResponse({"message": "Book not found or already removed."}, status=404)

    return JsonResponse({"error": "Invalid request"}, status=400)

#DIRECT TO BOOK PREVIEW
def dashboard(request):
    user_books = UserBookList.objects.filter(user=request.user)
    return render(request, 'dashboard.html', {'user_books': user_books})

def book_preview(request, olid):
    book = get_object_or_404(UserBookList, olid=olid, user=request.user)
    return render(request, 'book_preview.html', {'book': book})


#BOOK PREVIEW API FETCH
def book_preview(request, olid):
    # --- ✅ Check cache first ---
    cache_key = f"book_data_{olid}"
    cached_data = cache.get(cache_key)

    if cached_data:
        print(f"📘 Cache hit for {olid}")
        return render(request, "book_preview.html", cached_data)

    print(f"🌐 Cache miss for {olid}, fetching from API...")

    # --- Fetch from Open Library ---
    work_url = f"https://openlibrary.org/works/{olid}.json"
    work_response = requests.get(work_url)

    if work_response.status_code != 200:
        edition_url = f"https://openlibrary.org/books/{olid}.json"
        edition_response = requests.get(edition_url)
        if edition_response.status_code == 200:
            data = edition_response.json()
        else:
            user_book = UserBookList.objects.filter(user=request.user, olid=olid).first()
            data = {
                "title": user_book.title if user_book else "Book not found",
                "authors": [user_book.author] if user_book else [],
                "description": "No data available.",
                "cover_url": user_book.cover_url if user_book else None,
                "olid": olid,
            }
            cache.set(cache_key, data, timeout=3600)
            return render(request, "book_preview.html", data)
    else:
        data = work_response.json()

    # --- Process data ---
    title = data.get("title", "Unknown Title")

    # ✅ Description
    if "description" in data:
        description = data["description"]["value"] if isinstance(data["description"], dict) else data["description"]
    elif "excerpts" in data and data["excerpts"]:
        description = data["excerpts"][0].get("excerpt", "")
    elif "first_sentence" in data:
        description = data["first_sentence"].get("value", "") if isinstance(data["first_sentence"], dict) else data["first_sentence"]
    elif "notes" in data:
        description = data["notes"]
    else:
        description = "No description available."

    # ✅ Authors
    authors = []
    if "authors" in data:
        for author_obj in data["authors"]:
            key = author_obj.get("author", {}).get("key") or author_obj.get("key")
            if key:
                author_url = f"https://openlibrary.org{key}.json"
                author_res = requests.get(author_url)
                if author_res.status_code == 200:
                    author_data = author_res.json()
                    authors.append(author_data.get("name"))
    elif "by_statement" in data:
        authors.append(data["by_statement"])
    elif "author_name" in data:
        authors.append(", ".join(data["author_name"]))

    if not authors:
        user_book = UserBookList.objects.filter(user=request.user, olid=olid).first()
        authors = [user_book.author] if user_book and user_book.author else ["Unknown Author"]

    # ✅ Cover
    cover_id = data.get("covers", [None])[0]
    cover_url = f"https://covers.openlibrary.org/b/id/{cover_id}-L.jpg" if cover_id else None

    if not cover_url:
        user_book = UserBookList.objects.filter(user=request.user, olid=olid).first()
        if user_book and user_book.cover_url:
            cover_url = user_book.cover_url

    # ✅ Context (for rendering + caching)
    context = {
        "title": title,
        "authors": authors,
        "description": description,
        "cover_url": cover_url,
        "olid": olid,
    }

    # --- ✅ Save to cache for 1 hour (3600s) ---
    cache.set(cache_key, context, timeout=3600)

    return render(request, "book_preview.html", context)