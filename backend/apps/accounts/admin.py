from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class MessengerUserAdmin(UserAdmin):
    list_display = ["username", "first_name", "last_name", "is_staff"]
    list_filter = ["is_staff"]
