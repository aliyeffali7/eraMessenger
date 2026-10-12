from django.urls import path

from .views import FileDetailView, FileDownloadView, FileListCreateView

urlpatterns = [
    path("", FileListCreateView.as_view(), name="file-list"),
    path("<int:file_id>/", FileDetailView.as_view(), name="file-detail"),
    path("<int:file_id>/download/", FileDownloadView.as_view(), name="file-download"),
]
