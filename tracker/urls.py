from django.urls import path
from . import views

urlpatterns = [
    path('entries/', views.DexEntryListCreateView.as_view()),
    path('entries/<int:pk>/', views.DexEntryDetailView.as_view()),
]
