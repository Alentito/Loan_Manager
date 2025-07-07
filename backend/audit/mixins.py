# apps/audit/mixins.py
from audit.services import calc_diff, persist_event

class AuditableViewSetMixin:
    tracked_fields = "__all__"

    # CREATE
    def perform_create(self, serializer):
        super().perform_create(serializer)
        persist_event(
            instance=serializer.instance,
            diff={f: {"old": None, "new": getattr(serializer.instance, f)}
                  for f in serializer.instance._meta.fields
                  if self.tracked_fields == "__all__" or f.name in self.tracked_fields},
            op="CREATE",
        )

    # UPDATE / PATCH
    def perform_update(self, serializer):
        print("AuditMixin: performing update")  # ← TEMP LOG

        instance = self.get_object()
        diff = calc_diff(instance, serializer.validated_data, self.tracked_fields)
        super().perform_update(serializer)
        persist_event(instance=instance, diff=diff, op="UPDATE")

    # DELETE
    def perform_destroy(self, instance):
        diff = {f.name: {"old": getattr(instance, f.name), "new": None}
                for f in instance._meta.fields
                if self.tracked_fields == "__all__" or f.name in self.tracked_fields}
        persist_event(instance=instance, diff=diff, op="DELETE")
        super().perform_destroy(instance)
