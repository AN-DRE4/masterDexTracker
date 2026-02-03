from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('api/choice/', views.save_choice, name='save_choice'),
]
