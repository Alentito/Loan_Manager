# backend/report/serializers.py
from rest_framework import serializers

class LoanReportSerializer(serializers.Serializer):

    milestone_name = serializers.CharField(source="milestone__name", read_only=True)
    count = serializers.IntegerField(read_only=True)
