import os
import django
from datetime import timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rideshare_pro.settings')
django.setup()

from app.models import User, DriverCar, Ride

def create_sample_data():
    if User.objects.exists():
        print("Data already exists. Skipping.")
        return

    # Create Admin
    admin = User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    admin.role = 'Admin'
    admin.save()

    # Create Clients
    client1 = User.objects.create_user('alice', 'alice@example.com', 'pass123', role='Client')
    client2 = User.objects.create_user('bob', 'bob@example.com', 'pass123', role='Client')

    # Create Drivers
    driver1 = User.objects.create_user('driver1', 'driver1@example.com', 'pass123', role='Driver', rating=4.8)
    driver2 = User.objects.create_user('driver2', 'driver2@example.com', 'pass123', role='Driver', rating=4.2)

    # Create Cars
    car1 = DriverCar.objects.create(
        driver=driver1, car_model='Hyundai Creta', car_number='KA-01-AB-1234',
        total_seats=4, available_seats=4, seat_price=150.00,
        pickup_location='MG Road', destination='Airport'
    )
    
    car2 = DriverCar.objects.create(
        driver=driver2, car_model='Toyota Innova', car_number='KA-02-CD-5678',
        total_seats=3, available_seats=3, seat_price=100.00,
        pickup_location='MG Road', destination='Airport'
    )

    # Create Rides
    now = timezone.now()
    ride1 = Ride.objects.create(
        driver=driver1, car=car1, pickup_location='MG Road', destination='Airport',
        departure_time=now + timedelta(days=1), available_seats=4, price_per_seat=150.00
    )

    ride2 = Ride.objects.create(
        driver=driver2, car=car2, pickup_location='MG Road', destination='Airport',
        departure_time=now + timedelta(days=1, hours=2), available_seats=3, price_per_seat=100.00
    )

    print("Sample data generated successfully!")

if __name__ == '__main__':
    create_sample_data()
