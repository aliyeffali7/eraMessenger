from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import AdminUserListView, CreateUserView, MeView, UserListView

urlpatterns = [
    path("login/", TokenObtainPairView.as_view(), name="login"),
    path("login/refresh/", TokenRefreshView.as_view(), name="login-refresh"),
    path("me/", MeView.as_view(), name="me"),
    path("users/", UserListView.as_view(), name="user-list"),
    path("admin/users/", AdminUserListView.as_view(), name="admin-user-list"),
    path("admin/users/create/", CreateUserView.as_view(), name="admin-user-create"),
]
