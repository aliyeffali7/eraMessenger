# Loja (Unit/Section) sistemi silinir. Onlara bağlı qrup söhbətləri adi qrup
# kimi qalır — yalnız Unit/Section cədvəlləri silinir.
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0005_remove_degree_section_public_key"),
        ("org", "0001_initial"),
    ]

    operations = [
        migrations.DeleteModel(name="Section"),
        migrations.DeleteModel(name="Unit"),
    ]
