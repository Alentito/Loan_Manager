from rest_framework import serializers

class LoanReportSerializer(serializers.Serializer):
    broker_name = serializers.CharField(source="broker__name")
    loan_officer_name = serializers.CharField(source="loan_officer__name")
    team_leader_name = serializers.CharField(source="team_leader__name")
    team_manager_name = serializers.CharField(source="team_manager__name")
    processor_name = serializers.CharField(source="processor__name")
    milestone_name = serializers.CharField(source="milestone")
    funded_count = serializers.IntegerField()
