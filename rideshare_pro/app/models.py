from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ('Admin', 'Admin'),
        ('Driver', 'Driver'),
        ('Client', 'Client'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='Client')
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profiles/', blank=True, null=True)
    rating = models.FloatField(default=0.0)
    is_verified = models.BooleanField(default=False)

class DriverCar(models.Model):
    driver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='driver_cars')
    car_model = models.CharField(max_length=100)
    car_number = models.CharField(max_length=20)
    total_seats = models.IntegerField(default=4)
    available_seats = models.IntegerField(default=4)
    seat_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    pickup_location = models.CharField(max_length=255, blank=True, null=True)
    destination = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Ride(models.Model):
    STATUS_CHOICES = (
        ('Scheduled', 'Scheduled'),
        ('In Progress', 'In Progress'),
        ('Completed', 'Completed'),
        ('Cancelled', 'Cancelled'),
    )
    driver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='driver_rides')
    car = models.ForeignKey(DriverCar, on_delete=models.CASCADE, related_name='rides')
    pickup_location = models.CharField(max_length=255)
    destination = models.CharField(max_length=255)
    departure_time = models.DateTimeField()
    available_seats = models.IntegerField()
    price_per_seat = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Scheduled')
    created_at = models.DateTimeField(auto_now_add=True)

class Booking(models.Model):
    STATUS_CHOICES = (
        ('Pending', 'Pending'),
        ('Confirmed', 'Confirmed'),
        ('Cancelled', 'Cancelled'),
    )
    PAYMENT_STATUS_CHOICES = (
        ('Pending', 'Pending'),
        ('Completed', 'Completed'),
        ('Refunded', 'Refunded'),
    )
    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='client_bookings')
    ride = models.ForeignKey(Ride, on_delete=models.CASCADE, related_name='ride_bookings')
    seats_booked = models.IntegerField(default=1)
    booking_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='Pending')
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)

class Payment(models.Model):
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='payment_record')
    transaction_id = models.CharField(max_length=100, unique=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_status = models.CharField(max_length=20, default='Completed')
    payment_method = models.CharField(max_length=50, default='Simulated Gateway')
    created_at = models.DateTimeField(auto_now_add=True)

class Rating(models.Model):
    reviewer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews_given')
    reviewed_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews_received')
    rating = models.FloatField()
    review = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Complaint(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='complaints')
    ride = models.ForeignKey(Ride, on_delete=models.SET_NULL, blank=True, null=True, related_name='complaints')
    complaint_text = models.TextField()
    status = models.CharField(max_length=20, default='Open')
    created_at = models.DateTimeField(auto_now_add=True)

class ChatMessage(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='chat_messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

