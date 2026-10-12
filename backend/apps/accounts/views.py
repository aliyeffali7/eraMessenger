from rest_framework import generics, permissions

from .serializers import CreateUserSerializer, UserSerializer
from .services import create_user, list_all_users, search_users


class CreateUserView(generics.CreateAPIView):
    permission_classes = [permissions.IsAdminUser]
    serializer_class = CreateUserSerializer

    def perform_create(self, serializer):
        user = create_user(**serializer.validated_data)
        serializer.instance = user


class MeView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class UserListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer

    def get_queryset(self):
        return search_users(query=self.request.query_params.get("search", ""), exclude=self.request.user)


class AdminUserListView(generics.ListAPIView):
    permission_classes = [permissions.IsAdminUser]
    serializer_class = UserSerializer

    def get_queryset(self):
        return list_all_users()
