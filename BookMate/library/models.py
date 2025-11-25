from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


# User Profile model to store favorite genres
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    favorite_genres = models.CharField(
        max_length=500, 
        blank=True, 
        null=True,
        help_text="Comma-separated favorite genres selected during registration"
    )
    profile_picture_url = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        help_text="URL to profile picture stored in Supabase bucket"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username}'s Profile"
    
    def get_favorite_genres_list(self):
        """Returns favorite genres as a list"""
        if self.favorite_genres:
            return [g.strip() for g in self.favorite_genres.split(',') if g.strip()]
        return []


#User book list model
class UserBookList(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='book_list')
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255, blank=True, null=True)
    pages = models.IntegerField(null=True, blank=True)
    cover_url = models.URLField(blank=True, null=True)
    olid = models.CharField(max_length=50, db_index=True)
    description = models.TextField(blank=True, null=True)
    is_favorite = models.BooleanField(default=False)
    current_page = models.IntegerField(default=0)
    tags = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        help_text="Comma-separated custom tags (e.g., 'School, Romance, Adventure')"
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'olid'], name='unique_user_book')
        ]
        ordering = ['title']  # optional but makes admin panel neater

    def __str__(self):
        return f"{self.title} by {self.author or 'Unknown'}"
    
    def get_tags_list(self):
        """Returns tags as a list"""
        if self.tags:
            return [tag.strip() for tag in self.tags.split(',') if tag.strip()]
        return []
    
    def set_tags_list(self, tags_list):
        """Sets tags from a list"""
        self.tags = ", ".join(tags_list) if tags_list else ""


# Purchase model to track book purchases
class Purchase(models.Model):
    PAYMENT_METHODS = [
        ('credit_card', 'Credit Card'),
        ('debit_card', 'Debit Card'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='purchases')
    book_title = models.CharField(max_length=255)
    book_author = models.CharField(max_length=255, blank=True, null=True)
    book_cover_url = models.URLField(blank=True, null=True)
    olid = models.CharField(max_length=50)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Payment details (mock data)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    card_last_four = models.CharField(max_length=4)  # Last 4 digits of card
    cardholder_name = models.CharField(max_length=255)
    
    # Billing address
    billing_address = models.CharField(max_length=500)
    billing_city = models.CharField(max_length=100)
    billing_state = models.CharField(max_length=100)
    billing_zip = models.CharField(max_length=20)
    billing_country = models.CharField(max_length=100)
    
    # Transaction details
    transaction_id = models.CharField(max_length=50, unique=True)
    purchased_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ['-purchased_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.book_title} (${self.price})"

