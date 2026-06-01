import django_filters
from .models import Incident


class IncidentFilter(django_filters.FilterSet):

    status = django_filters.ChoiceFilter(
        choices=Incident.IncidentStatus.choices,
    )
    severity = django_filters.ChoiceFilter(
        choices=Incident.Severity.choices,
    )
    is_public = django_filters.BooleanFilter()

    class Meta:
        model  = Incident
        fields = ["status", "severity", "is_public"]