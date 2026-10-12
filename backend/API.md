# Messenger API — frontend inteqrasiyası üçün

Base URL: `http://13.140.176.82/api` (prod, hələ HTTP — tezliklə HTTPS olacaq)
Auth: JWT (SimpleJWT). Hər sorğuya `Authorization: Bearer <access>` başlığı.

## Auth

| Metod | Endpoint | Body | Cavab |
|---|---|---|---|
| POST | `/accounts/login/` | `{username, password}` | `{access, refresh}` |
| POST | `/accounts/login/refresh/` | `{refresh}` | `{access}` |
| GET | `/accounts/me/` | — | user obyekti (`id, username, first_name, last_name, is_staff, joined_at`) |
| GET | `/accounts/users/?search=<q>` | — | user siyahısı (yeni çat üçün) |

## Çat

| Metod | Endpoint | Qeyd |
|---|---|---|
| GET | `/chat/conversations/` | istifadəçinin bütün söhbətləri, son aktivliyə görə sıralı, `unread_count` ilə |
| POST | `/chat/conversations/direct/` | `{user_id}` → 1:1 söhbət yarat/tap |
| POST | `/chat/conversations/group/` | `{name, member_ids}` (yalnız admin) |
| GET | `/chat/conversations/<id>/` | söhbət detalı + üzvlər |
| GET | `/chat/conversations/<id>/messages/?after=<msgId>` | mesajlar (artımlı çəkmə üçün `after`) |
| POST | `/chat/conversations/<id>/messages/` | mesaj göndər — aşağıya bax |
| POST | `/chat/conversations/<id>/read/` | oxundu işarələ |
| PATCH | `/chat/conversations/<id>/rename/` | `{name}` (qrup admini) |
| POST/DELETE | `/chat/conversations/<id>/members/...` | üzv idarəsi (qrup admini) |
| POST | `/chat/conversations/<id>/leave/` | qrupdan çıx |

### Mesaj formatı

- Bütün mesajlar (1:1 və qrup) düz mətn kimi göndərilir və saxlanılır: `{text}`.
- Redaktə: `PATCH /chat/conversations/<id>/messages/<msgId>/` → `{text}`.

### Qoşmalar (səs mesajı / fayl)

- Göndərmə: `POST /chat/conversations/<id>/messages/` **multipart/form-data**, əlavə sahə `attachment` (fayl, maks. 15 MB).
  Fayl olduğu kimi yüklənir, `text` = `"\u0001ATT:" + JSON`: `{kind:"voice"|"file", name, mime, size, dur?}`.
- Mesaj cavabında `has_attachment: true` olur (URL verilmir).
- Yükləmə: `GET /chat/conversations/<id>/messages/<msgId>/attachment/` (JWT, yalnız söhbət üzvləri) → xam bayt.
- Qoşması olan mesaj redaktə oluna bilməz. Mesaj silinəndə fayl da silinir.
- Serverdə nginx: `client_max_body_size 20m;` olmalıdır.

## Ortaq fayllar

Hər daxil olmuş istifadəçi faylları görür, yükləyir və endirir. Faylı yalnız
yükləyən şəxs və ya admin silə bilər.

| Metod | Endpoint | Qeyd |
|---|---|---|
| GET | `/files/?search=<q>` | fayl siyahısı (`id, name, size, mime, uploaded_by, created_at`), ən yenisi əvvəl |
| POST | `/files/` | multipart: `file` (maks. 15 MB), istəyə bağlı `name` |
| GET | `/files/<id>/download/` | faylın özü (JWT tələb olunur) |
| DELETE | `/files/<id>/` | yalnız yükləyən və ya admin |

## Digər

| Metod | Endpoint | Qeyd |
|---|---|---|
| POST | `/notifications/register-token/` | `{token}` push bildiriş üçün (bildirişdə mesajın önizləməsi göstərilir) |
| GET | `/meetings/` | iclaslar; yaratma (`/meetings/create/`, admin): `user_ids` və ya `all_users` |

## Lokal işə salma (Next.js developer üçün)

Öz localhost origin-ini backend-ə əlavə etməlisən: prod-da
`CORS_ALLOWED_ORIGINS` env dəyişəni (məs. `http://localhost:3000`).
Aliyə de ki serverdə `.env`-ə əlavə etsin.

Backend-i lokal qaldırmaq: `DJANGO_SETTINGS_MODULE=config.settings.dev`,
`pip install -r requirements.txt`, `python manage.py migrate`, `runserver`.
`secrets/firebase-adminsdk.json` repoda yoxdur — push bildirişsiz lokal işləyir.
