from django.urls import path
from . import views

urlpatterns = [
    path('', views.landing_view, name='landing'),
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('logout/', views.logout_view, name='logout'),
    path('genres/', views.genre_setup_view, name='genre_setup'),
    path('dashboard/', views.dashboard_view, name='dashboard'),  
    path('book/<str:olid>/', views.book_preview, name='book_preview'),
    path('profile/', views.profile_view, name='profile'),
    path('edit_profile/', views.edit_profile_view, name='edit_profile'),

    # --- API routes for Open Library ---
    path('api/search/', views.search_books, name='search_books'),
    path('api/add_book/', views.add_book, name='add_book'),
    path('api/remove_book/', views.remove_book, name='remove_book'),
    path("api/update_progress/", views.update_progress, name="update_progress"),
    path('api/toggle_favorite/', views.toggle_favorite, name='toggle_favorite'),
]