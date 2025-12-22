from django.contrib.auth.models import Group, Permission
from rest_framework import serializers
from .models import RoleMetadata


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
    sort_order = serializers.IntegerField(required=False, allow_null=True)
    assignable_on_loan = serializers.BooleanField(required=False, allow_null=True)  # <-- Add this

    class Meta:
        model = Group
        fields = ['id', 'name', 'permissions', 'permission_ids', 'sort_order', 'assignable_on_loan']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        metadata = getattr(instance, "metadata", None)
        data["sort_order"] = getattr(metadata, "sort_order", 0)
        data["assignable_on_loan"] = getattr(metadata, "assignable_on_loan", False)  # <-- Add this
        return data

    def _save_metadata(self, group, sort, assignable_on_loan):
        if sort is not None or assignable_on_loan is not None:
            defaults = {}
            if sort is not None:
                defaults["sort_order"] = sort
            if assignable_on_loan is not None:
                defaults["assignable_on_loan"] = assignable_on_loan
            RoleMetadata.objects.update_or_create(group=group, defaults=defaults)

    def create(self, validated_data):
        sort = validated_data.pop("sort_order", None)
        assignable_on_loan = validated_data.pop("assignable_on_loan", None)
        permission_ids = validated_data.pop('permission_ids', [])
        group = Group.objects.create(**validated_data)
        group.permissions.set(permission_ids)
        self._save_metadata(group, sort, assignable_on_loan)
        return group

    def update(self, instance, validated_data):
        sort = validated_data.pop("sort_order", None)
        assignable_on_loan = validated_data.pop("assignable_on_loan", None)
        permission_ids = validated_data.pop('permission_ids', None)
        if permission_ids is not None:
            instance.permissions.set(permission_ids)
        instance.name = validated_data.get('name', instance.name)
        instance.save()
        self._save_metadata(instance, sort, assignable_on_loan)
        return instance