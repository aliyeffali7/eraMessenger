# E2EE silinir: mesajlar artıq düz mətn kimi saxlanılır. Köhnə şifrəli 1:1
# mesajları server deşifrə edə bilmir, ona görə onlar qeyd mətni ilə əvəz
# olunur, şifrəli qoşma blob-ları isə (açarsız yararsızdır) silinir.
from django.db import migrations

LEGACY_TEXT = "🔒 Köhnə şifrəli mesaj — artıq göstərilə bilməz"


def replace_encrypted_messages(apps, schema_editor):
    Message = apps.get_model("chat", "Message")
    for message in Message.objects.exclude(ciphertext="").iterator():
        if message.attachment:
            try:
                message.attachment.storage.delete(message.attachment.name)
            except Exception:
                pass
            message.attachment = ""
        message.text = LEGACY_TEXT
        message.save(update_fields=["text", "attachment"])


class Migration(migrations.Migration):

    dependencies = [
        ("chat", "0007_message_attachment"),
    ]

    operations = [
        migrations.RunPython(replace_encrypted_messages, migrations.RunPython.noop),
        migrations.RemoveField(model_name="message", name="ciphertext"),
        migrations.RemoveField(model_name="message", name="nonce"),
    ]
