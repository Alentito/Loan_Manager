from django.contrib.auth.models import Group, Permission
from rest_framework import serializers


class PermissionSerializer(serializers.ModelSerializer):
    app_label = serializers.CharField(source="content_type.app_label")
    model = serializers.CharField(source="content_type.model")

    class Meta:
        model = Permission
        fields = ["id", "codename", "name", "app_label", "model"]

class GroupSerializer(serializers.ModelSerializer):
    permissions = PermissionSerializer(many=True, read_only=True)
    permission_ids = serializers.PrimaryKeyRelatedField(
        queryset=Permission.objects.all(), write_only=True, many=True, required=False
    )

    class Meta:
        model = Group
        fields = ['id', 'name', 'permissions', 'permission_ids']

    def create(self, validated_data):
        permission_ids = validated_data.pop('permission_ids', [])
        group = Group.objects.create(**validated_data)
        group.permissions.set(permission_ids)
        return group

    def update(self, instance, validated_data):
        permission_ids = validated_data.pop('permission_ids', None)
        if permission_ids is not None:
            instance.permissions.set(permission_ids)
        instance.name = validated_data.get('name', instance.name)
        instance.save()
        return instance