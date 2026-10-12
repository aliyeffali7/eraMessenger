from rest_framework.exceptions import PermissionDenied

from apps.accounts.models import User

from .models import SharedFile


def list_files(*, query: str = ""):
    qs = SharedFile.objects.select_related("uploaded_by")
    if query:
        qs = qs.filter(name__icontains=query)
    return qs


def upload_file(*, file, name: str, uploaded_by: User) -> SharedFile:
    return SharedFile.objects.create(
        name=(name or file.name or "fayl").strip()[:255],
        file=file,
        size=file.size or 0,
        mime=(getattr(file, "content_type", "") or "")[:150],
        uploaded_by=uploaded_by,
    )


def delete_file(*, shared_file: SharedFile, actor: User) -> None:
    if shared_file.uploaded_by_id != actor.id and not actor.is_staff:
        raise PermissionDenied("Yalnız öz faylınızı silə bilərsiniz.")
    shared_file.delete()
