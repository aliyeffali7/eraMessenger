from django.contrib import admin

from .models import SharedFile


@admin.register(SharedFile)
class SharedFileAdmin(admin.ModelAdmin):
    list_display = ["name", "size", "uploaded_by", "created_at"]
    search_fields = ["name"]
