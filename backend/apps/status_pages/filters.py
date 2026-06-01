import django_filters
from .models import StatusPage


class StatusPageFilter(django_filters.FilterSet):

    is_public = django_filters.BooleanFilter()

    class Meta:
        model  = StatusPage
        fields = ["is_public"]