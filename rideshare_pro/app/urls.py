from django.urls import path
from . import views_auth, views_rides, views_bookings, views_admin, views_chat

urlpatterns = [
    # Auth & Profile
    path('csrf/', views_auth.get_csrf, name='get_csrf'),
    path('auth/register/', views_auth.register_user, name='register_user'),
    path('auth/login/', views_auth.login_user, name='login_user'),
    path('auth/logout/', views_auth.logout_user, name='logout_user'),
    path('auth/profile/', views_auth.get_profile, name='get_profile'),

    # Rides & Cars
    path('driver/add-car/', views_rides.add_driver_car, name='add_car'),
    path('driver/cars/', views_rides.list_driver_cars, name='list_cars'),
    path('driver/passengers/', views_bookings.get_driver_passengers, name='driver_passengers'),
    path('rides/create/', views_rides.create_ride, name='create_ride'),
    path('rides/match/', views_rides.match_rides, name='match_rides'),

    # Bookings & Payments
    path('bookings/create/', views_bookings.create_booking, name='create_booking'),
    path('bookings/my/', views_bookings.get_my_bookings, name='my_bookings'),
    path('bookings/<int:booking_id>/accept/', views_bookings.accept_passenger, name='accept_passenger'),
    path('payments/create/', views_bookings.simulate_payment, name='simulate_payment'),
    
    # Chat
    path('chat/<int:booking_id>/', views_chat.get_chat_messages, name='get_chat'),
    path('chat/<int:booking_id>/send/', views_chat.send_chat_message, name='send_chat'),
    
    # Admin
    path('admin-overview/', views_admin.admin_overview, name='admin_overview'),
]
