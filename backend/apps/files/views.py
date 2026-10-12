from django.http import FileResponse
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import SharedFile
from .serializers import SharedFileSerializer, UploadFileSerializer
from .services import delete_file, list_files, upload_file


class FileListCreateView(generics.ListAPIView):
    """Hamı üçün ortaq fayllar: hər istifadəçi siyahını görür və fayl yükləyə bilər."""

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SharedFileSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return list_files(query=self.request.query_params.get("search", "").strip())

    def post(self, request):
        serializer = UploadFileSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        shared_file = upload_file(
            file=serializer.validated_data["file"],
            name=serializer.validated_data.get("name", ""),
            uploaded_by=request.user,
        )
        return Response(SharedFileSerializer(shared_file).data, status=status.HTTP_201_CREATED)


class FileDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, file_id):
        shared_file = get_object_or_404(SharedFile, pk=file_id)
        delete_file(shared_file=shared_file, actor=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


class FileDownloadView(APIView):
    """Faylı yalnız daxil olmuş istifadəçilərə ötürür (ictimai /media linki yoxdur)."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, file_id):
        shared_file = get_object_or_404(SharedFile, pk=file_id)
        if not shared_file.file:
            return Response({"detail": "Fayl tapılmadı."}, status=404)
        return FileResponse(
            shared_file.file.open("rb"),
            as_attachment=True,
            filename=shared_file.name,
            content_type=shared_file.mime or "application/octet-stream",
        )
