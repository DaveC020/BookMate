from django.db import models
from django.contrib.auth.models import User


#User book list model
class UserBookList(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='book_list')
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255, blank=True, null=True)
    cover_url = models.URLField(blank=True, null=True)
    olid = models.CharField(max_length=50, db_index=True)
    description = models.TextField(blank=True, null=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'olid'], name='unique_user_book')
        ]
        ordering = ['title']  # optional but makes admin panel neater

    def __str__(self):
        return f"{self.title} by {self.author or 'Unknown'}"
