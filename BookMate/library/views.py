from django.shortcuts import render, redirect
from django.contrib.auth import login
from django.contrib import messages
from .forms import RegisterForm, LoginForm
from django.contrib.auth.models import User


def register_view(request):
    if request.method == "POST":
        form = RegisterForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            user.set_password(form.cleaned_data["password1"])
            user.save()
            messages.success(request, "✅ Registration successful! You can now log in.")
            #return redirect("login")
            return render(request, "register.html", {"form": form})
        else:
            print(form.errors)  # 👈 this will show why validation failed
            messages.error(request, "⚠️ Please fix the errors below.")
    else:
        form = RegisterForm()

    return render(request, "register.html", {"form": form})


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
    return render(request, 'dashboard.html')