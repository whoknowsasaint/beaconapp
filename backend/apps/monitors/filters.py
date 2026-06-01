# Beacon -- Monitor Filters
# Defines supported query parameters for the monitors endpoint.
#
# Supported filters:
#   ?status=operational|degraded|outage|paused|pending
#   ?monitor_type=http|tcp|ping
#   ?is_active=true|false
#   ?search=<string>        searches name field
#   ?ordering=created_at|-created_at|name|-name

import django_filters
from .models import Monitor


class MonitorFilter(django_filters.FilterSet):

    status = django_filters.ChoiceFilter(
        choices=Monitor.MonitorStatus.choices,
        help_text="Filter by current status.",
    )

    monitor_type = django_filters.ChoiceFilter(
        choices=Monitor.MonitorType.choices,
        help_text="Filter by monitor type.",
    )

    is_active = django_filters.BooleanFilter(
        help_text="Filter by active state. true or false.",
    )

    class Meta:
        model  = Monitor
        fields = ["status", "monitor_type", "is_active"]