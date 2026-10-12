from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0004_user_public_key"),
    ]

    operations = [
        migrations.RemoveField(model_name="user", name="degree"),
        migrations.RemoveField(model_name="user", name="public_key"),
        migrations.RemoveField(model_name="user", name="section"),
    ]
