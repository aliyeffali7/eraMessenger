from .models import User


def create_user(
    *, username: str, password: str, first_name: str = "", last_name: str = ""
) -> User:
    user = User(username=username, first_name=first_name, last_name=last_name)
    user.set_password(password)
    user.save()
    return user


def search_users(*, query: str, exclude: User):
    qs = User.objects.exclude(id=exclude.id)
    if query:
        qs = qs.filter(username__icontains=query)
    return qs.order_by("username")[:30]


def list_all_users():
    return User.objects.order_by("username")
