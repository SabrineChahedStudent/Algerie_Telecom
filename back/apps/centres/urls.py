from django.urls import path
from .views import (
    CentresView,
    CentreDetailView,
    ParametresCentreView,
    MonCentreView,
)

urlpatterns = [
    # Centres (admin)
    path('',                    CentresView.as_view(),          name='centres-list'),
    path('<int:centre_id>/',    CentreDetailView.as_view(),     name='centre-detail'),

    # Paramètres du centre (admin)
    path('parametres/',         ParametresCentreView.as_view(), name='parametres-centre'),

    # Mon centre (tous les utilisateurs)
    path('mon-centre/',         MonCentreView.as_view(),        name='mon-centre'),
]