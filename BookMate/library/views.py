from django.shortcuts import render, redirect
from django.contrib.auth import login, logout
from django.contrib import messages
from .forms import RegisterForm, LoginForm
from django.contrib.auth.models import User
from .models import UserBookList
from django.shortcuts import render, get_object_or_404
from django.core.cache import cache
from django.http import HttpResponseRedirect
from django.urls import reverse
from django.db import IntegrityError

#register function
def register_view(request):
    if request.method == "POST":
        form = RegisterForm(request.POST)
        if form.is_valid():
            try:
                user = form.save(commit=False)
                user.set_password(form.cleaned_data["password1"])
                user.save()
                messages.success(request, "Registration successful! Please sign in to continue.")
                return redirect(f"{reverse('landing')}?modal=login")
            except IntegrityError:
                # Username or email already exists
                print("IntegrityError: Username already exists")
                request.session['register_errors'] = {
                    'username': ['This username is already taken. Please choose another one.']
                }
                return redirect(f"{reverse('landing')}?modal=register")
            
        else:
            print("=== FORM VALIDATION FAILED ===")
            print(f"Form errors: {form.errors}")
            
            # Store errors in session to display on landing page
            errors_dict = {}
            
            # Handle field-specific errors
            for field, error_list in form.errors.items():
                if field == '__all__':
                    # Non-field errors (like password mismatch) - assign to password2
                    errors_dict['password2'] = [str(e) for e in error_list]
                else:
                    errors_dict[field] = [str(e) for e in error_list]
            
            request.session['register_errors'] = errors_dict
            
            print(f"Redirecting to landing with modal=register")
            print(f"Errors to display: {errors_dict}")
            # Use redirect with query string
            return redirect(f"{reverse('landing')}?modal=register")
    else:
        # Redirect GET requests to landing page
        return redirect("landing")

#login function
def login_view(request):
    if request.method == "POST":
        form = LoginForm(request, data=request.POST)
        username = request.POST.get("username")
        password = request.POST.get("password")

        # Check if username exists before validating the form
        if not User.objects.filter(username=username).exists():
            request.session['login_errors'] = {'username': ['User does not exist.']}
            return redirect(f"{reverse('landing')}?modal=login")
        elif form.is_valid():
            user = form.get_user()
            login(request, user)
            return redirect("dashboard")
        else:
            request.session['login_errors'] = {'password': ['Incorrect password.']}
            return redirect(f"{reverse('landing')}?modal=login")
    else:
        # Redirect GET requests to landing page
        return redirect("landing")

def logout_view(request):
    logout(request)
    # Removed notification - landing page already shows logout message
    return redirect("landing")

def landing_view(request):
    # Get form errors from session if they exist
    register_errors = request.session.pop('register_errors', {})
    login_errors = request.session.pop('login_errors', {})
    open_modal = request.GET.get('modal', '')
    
    # DEBUG: Test if messages work
    if request.GET.get('test'):
        messages.info(request, "🔔 This is a test notification!")
        messages.error(request, "⚠️ This is a test error!")
        messages.success(request, "✅ This is a test success!")
    
    if request.GET.get('modal'):
        print(f"Modal parameter detected: {request.GET.get('modal')}")
    
    return render(request, 'landing.html', {
        'register_errors': register_errors,
        'login_errors': login_errors,
        'open_modal': open_modal,
    })

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
        olid = book.get("cover_edition_key") or (
            book.get("edition_key")[0] if book.get("edition_key") else None
        )
        cover_url = f"https://covers.openlibrary.org/b/olid/{olid}-M.jpg" if olid else None

        number_of_pages = None

        if olid:
            # ✅ 1) Try Books API jscmd=data (best source)
            try:
                api_url = f"https://openlibrary.org/api/books?bibkeys=OLID:{olid}&jscmd=data&format=json"
                api_resp = requests.get(api_url)
                api_data = api_resp.json().get(f"OLID:{olid}", {})

                number_of_pages = api_data.get("number_of_pages")
            except Exception:
                pass

            # ✅ 2) Edition fallback if still none
            if not number_of_pages:
                try:
                    edition_url = f"https://openlibrary.org/books/{olid}.json"
                    edition_resp = requests.get(edition_url)
                    edition_data = edition_resp.json()

                    number_of_pages = edition_data.get("number_of_pages")

                    # Fallback: parse from pagination text
                    if not number_of_pages and edition_data.get("pagination"):
                        import re
                        digits = re.findall(r"\d+", edition_data["pagination"])
                        if digits:
                            number_of_pages = int(digits[-1])
                except Exception:
                    number_of_pages = None

        results.append({
            "title": book.get("title"),
            "author": ", ".join(book.get("author_name", [])) if book.get("author_name") else "Unknown",
            "cover_url": cover_url,
            "olid": olid,
            "pages": number_of_pages or 0,  # ✅ always return a number
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

        pages = data.get("pages")  # may be None from frontend

        # ✅ If pages not provided by search API, fetch from Open Library
        if not pages:
            pages = None

            # 1) Try jscmd=data API
            try:
                api_url = f"https://openlibrary.org/api/books?bibkeys=OLID:{olid}&jscmd=data&format=json"
                api_resp = requests.get(api_url)
                api_data = api_resp.json().get(f"OLID:{olid}", {})

                pages = api_data.get("number_of_pages")
            except Exception:
                pass

            # 2) Try edition JSON fallback
            if not pages:
                try:
                    edition_url = f"https://openlibrary.org/books/{olid}.json"
                    edition_resp = requests.get(edition_url)
                    edition_data = edition_resp.json()

                    pages = edition_data.get("number_of_pages")

                    # parse pagination if needed
                    if not pages and edition_data.get("pagination"):
                        import re
                        digits = re.findall(r"\d+", edition_data["pagination"])
                        if digits:
                            pages = int(digits[-1])
                except Exception:
                    pages = None

        # ✅ Create or get book
        book, created = UserBookList.objects.get_or_create(
            user=request.user,
            olid=olid,
            defaults={
                "title": title,
                "author": author,
                "cover_url": cover_url,
                "pages": pages or 0,  # always store something
            },
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


# --- EDIT BOOK DETAILS ---
@csrf_exempt
def update_progress(request):
    if request.method == "POST":
        data = json.loads(request.body)
        olid = data.get("olid")
        progress = data.get("progress")

        if not request.user.is_authenticated:
            return JsonResponse({"success": False, "message": "Not logged in"}, status=403)

        try:
            book = UserBookList.objects.get(user=request.user, olid=olid)
            book.current_page = int(progress)
            book.save()
            return JsonResponse({"success": True, "progress": book.current_page})
        except UserBookList.DoesNotExist:
            return JsonResponse({"success": False, "message": "Book not found"}, status=404)

    return JsonResponse({"success": False, "message": "Invalid request"}, status=400)

#Toggle
@csrf_exempt
def toggle_favorite(request):
    if request.method == "POST":
        data = json.loads(request.body)
        olid = data.get("olid")

        if not olid:
            return JsonResponse({"success": False, "message": "No OLID provided"}, status=400)

        try:
            # Toggle favorite status for the book belonging to this user
            book = UserBookList.objects.get(user=request.user, olid=olid)
            book.is_favorite = not book.is_favorite
            book.save()

            return JsonResponse({
                "success": True,
                "message": f"Book {'marked' if book.is_favorite else 'unmarked'} as favorite!",
                "is_favorite": book.is_favorite
            })
        except UserBookList.DoesNotExist:
            return JsonResponse({"success": False, "message": "Book not found"}, status=404)
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)}, status=500)

    return JsonResponse({"success": False, "message": "Invalid request"}, status=400)


#DIRECT TO BOOK PREVIEW
def dashboard(request):
    user_books = UserBookList.objects.filter(user=request.user)
    return render(request, 'dashboard.html', {'user_books': user_books})

# def book_preview(request, olid):
#     book = get_object_or_404(UserBookList, olid=olid, user=request.user)
#     return render(request, 'book_preview.html', {'book': book})


#BOOK PREVIEW API FETCH
def book_preview(request, olid):
    # --- Check cache first ---
    cache_key = f"book_data_{olid}"
    cached_data = cache.get(cache_key)

    if cached_data:
        print(f"📘 Cache hit for {olid}")
        return render(request, "book_preview.html", cached_data)

    print(f"🌐 Cache miss for {olid}, fetching from API...")

    # --- Fetch from Open Library Works ---
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
                "pages": user_book.pages if user_book else 0,
            }
            cache.set(cache_key, data, timeout=3600)
            return render(request, "book_preview.html", data)
    else:
        data = work_response.json()

    # --- Extract fields ---
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

    # ✅ ✅ ✅ PAGES FETCHING

    pages = None

    # 1) Try Books API jscmd=data (most reliable)
    try:
        api_url = f"https://openlibrary.org/api/books?bibkeys=OLID:{olid}&jscmd=data&format=json"
        api_resp = requests.get(api_url)
        if api_resp.status_code == 200:
            api_data = api_resp.json().get(f"OLID:{olid}", {})
            pages = api_data.get("number_of_pages")
    except:
        pass

    # 2) Try edition JSON (fallback)
    if not pages:
        try:
            edition_url = f"https://openlibrary.org/books/{olid}.json"
            edition_resp = requests.get(edition_url)
            if edition_resp.status_code == 200:
                edition_data = edition_resp.json()
                pages = edition_data.get("number_of_pages")

                # Fallback from pagination (e.g. "350 pages")
                if not pages and edition_data.get("pagination"):
                    import re
                    digits = re.findall(r"\d+", edition_data["pagination"])
                    if digits:
                        pages = int(digits[-1])
        except:
            pass

    # 3) DB fallback
    if not pages:
        user_book = UserBookList.objects.filter(user=request.user, olid=olid).first()
        pages = user_book.pages if user_book else 0

    # ✅ Prepare context
    context = {
        "title": title,
        "authors": authors,
        "description": description,
        "cover_url": cover_url,
        "olid": olid,
        "pages": pages or 0,
    }

    cache.set(cache_key, context, timeout=3600)
    return render(request, "book_preview.html", context)
