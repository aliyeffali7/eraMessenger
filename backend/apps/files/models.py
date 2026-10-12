import uuid

from django.conf import settings
from django.db import models
from django.db.models.signals import post_delete
from django.dispatch import receiver


def shared_file_path(instance, filename):
    # Random name on disk; the original name is kept in `name`.
    return f"files/{uuid.uuid4().hex}"


class SharedFile(models.Model):
    name = models.CharField(max_length=255)
    file = models.FileField(upload_to=shared_file_path)
    size = models.PositiveBigIntegerField(default=0)
    mime = models.CharField(max_length=150, blank=True, default="")
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="shared_files",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


@receiver(post_delete, sender=SharedFile)
def delete_shared_file(sender, instance, **kwargs):
    if instance.file:
        instance.file.delete(save=False)
