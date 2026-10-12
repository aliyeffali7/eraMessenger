# Kitabxana → ortaq fayllar. Mövcud sənədlər silinmir, ortaq fayla çevrilir;
# dərəcə məhdudiyyəti (min_degree) götürülür.
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

import apps.files.models


def fill_legacy_metadata(apps, schema_editor):
    SharedFile = apps.get_model("library", "SharedFile")
    for shared_file in SharedFile.objects.iterator():
        # Kitabxanada yalnız PDF var idi; yükləyəndə ad uzantılı olsun.
        if not shared_file.name.lower().endswith(".pdf"):
            shared_file.name = f"{shared_file.name[:250]}.pdf"
        shared_file.mime = "application/pdf"
        try:
            shared_file.size = shared_file.file.size
        except Exception:
            shared_file.size = 0
        shared_file.save(update_fields=["name", "mime", "size"])


class Migration(migrations.Migration):

    dependencies = [
        ("library", "0002_alter_document_options_alter_document_file_and_more"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RenameModel(old_name="Document", new_name="SharedFile"),
        migrations.RenameField(model_name="sharedfile", old_name="title", new_name="name"),
        migrations.RemoveField(model_name="sharedfile", name="min_degree"),
        migrations.AlterField(
            model_name="sharedfile",
            name="name",
            field=models.CharField(max_length=255),
        ),
        migrations.AlterField(
            model_name="sharedfile",
            name="file",
            field=models.FileField(upload_to=apps.files.models.shared_file_path),
        ),
        migrations.AlterField(
            model_name="sharedfile",
            name="uploaded_by",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="shared_files",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="sharedfile",
            name="size",
            field=models.PositiveBigIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="sharedfile",
            name="mime",
            field=models.CharField(blank=True, default="", max_length=150),
        ),
        migrations.AlterModelOptions(name="sharedfile", options={"ordering": ["-created_at"]}),
        migrations.RunPython(fill_legacy_metadata, migrations.RunPython.noop),
    ]
