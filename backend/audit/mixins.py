# apps/audit/mixins.py
from django.forms.models import model_to_dict

from audit.services import calc_diff, persist_event

class AuditableViewSetMixin:
    tracked_fields = "__all__"

    def _field_val(self, instance, field):
        v = getattr(instance, field.name)
        return getattr(v, "pk", v)

    # CREATE
    def perform_create(self, serializer):
        instance = serializer.save()
        # only log fields that were provided by the client to reduce noise
        diff = {}
        for fname, val in serializer.validated_data.items():
            old = None
            new = getattr(instance, fname, None)
            if hasattr(new, "pk"):
                new = new.pk
            diff[fname] = {"old": old, "new": new}

        persist_event(
            instance=instance,
            diff=diff,
            op="CREATE",
            actor=self.request.user
        )

    # UPDATE / PATCH
    def perform_update(self, serializer):
        # snapshot BEFORE state
        instance = self.get_object()
        pre = {f.name: self._field_val(instance, f) for f in instance._meta.fields
               if self.tracked_fields == "__all__" or f.name in self.tracked_fields}

        super().perform_update(serializer)  # this will save

        # snapshot AFTER state
        instance = self.get_object()  # refresh
        post = {f.name: self._field_val(instance, f) for f in instance._meta.fields
                if self.tracked_fields == "__all__" or f.name in self.tracked_fields}

        # build diff
        diff = {}
        for k in post.keys():
            if pre.get(k) != post.get(k):
                diff[k] = {"old": pre.get(k), "new": post.get(k)}

        persist_event(instance=instance, diff=diff, op="UPDATE", actor=self.request.user)

    # DELETE
    def perform_destroy(self, instance):
        diff = {f.name: {"old": self._field_val(instance, f), "new": None}
                for f in instance._meta.fields
                if self.tracked_fields == "__all__" or f.name in self.tracked_fields}
        persist_event(instance=instance, diff=diff, op="DELETE", actor=self.request.user)
        super().perform_destroy(instance)
