from rest_framework import serializers

from apps.accounts.serializers import UserSerializer

from .models import SharedFile

MAX_FILE_BYTES = 15 * 1024 * 1024


class SharedFileSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)

    class Meta:
        model = SharedFile
        fields = ["id", "name", "size", "mime", "uploaded_by", "created_at"]


class UploadFileSerializer(serializers.Serializer):
    file = serializers.FileField()
    name = serializers.CharField(max_length=255, required=False, allow_blank=True)

    def validate_file(self, value):
        if value.size > MAX_FILE_BYTES:
            raise serializers.ValidationError("Fayl 15 MB-dan böyük ola bilməz.")
        return value
