from django.apps import AppConfig


# Loja (Unit/Section) sistemi silinib. Bu app yalnız miqrasiya tarixçəsi üçün
# qalır: 0002 köhnə cədvəlləri silir. Bütün serverlərdə tətbiq olunandan sonra
# (migrate) app tamamilə qaldırıla bilər.
class OrgConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.org"
    label = "org"
