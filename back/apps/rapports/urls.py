from django.urls import path
from .views import StatsGeneralesView, PerformancesAgentsView, ExportPDFView, ExportExcelView

urlpatterns = [
    path('stats/',        StatsGeneralesView.as_view(),    name='stats-generales'),
    path('performances/', PerformancesAgentsView.as_view(), name='performances-agents'),
    path('export/pdf/',   ExportPDFView.as_view(),         name='export-pdf'),
    path('export/excel/', ExportExcelView.as_view(),        name='export-excel'),
]