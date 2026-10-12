from django.apps import AppConfig


class FilesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.files"
    # Köhnə "Kitabxana" app-inin label-i saxlanılır ki, miqrasiya tarixçəsi və
    # mövcud sənədlər (indi ortaq fayllar) itməsin.
    label = "library"
    verbose_name = "Fayllar"
