from django.shortcuts import render, redirect

def landing_view(request):
    return render(request, 'landing.html')

def login_view(request):
    if request.method == "POST":
        # TODO: Authenticate user here
        return redirect('genre_setup')  # after login
    return render(request, 'login.html')

def register_view(request):
    if request.method == "POST":
        # TODO: Create user here
        return redirect('login')  # after registration
    return render(request, 'register.html')

def genre_setup_view(request):
    if request.method == "POST":
        selected_genres = request.POST.getlist("genres")
        # TODO: Save genres to user profile (later)
        return redirect('dashboard')
    return render(request, 'genre_setup.html')

def dashboard_view(request):
    return render(request, 'dashboard.html')
