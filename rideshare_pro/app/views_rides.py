import json
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from .models import DriverCar, Ride
from django.utils import timezone
from datetime import datetime

# --- CAR AND RIDE MANAGEMENT ---

@require_http_methods(["POST"])
def add_driver_car(request):
    if not request.user.is_authenticated or request.user.role != 'Driver':
        return JsonResponse({"error": "Unauthorized"}, status=401)
    
    data = json.loads(request.body)
    car = DriverCar.objects.create(
        driver=request.user,
        car_model=data.get('car_model'),
        car_number=data.get('car_number'),
        total_seats=int(data.get('total_seats', 4)),
        available_seats=int(data.get('total_seats', 4)),
        seat_price=data.get('seat_price', 0.0),
        pickup_location=data.get('pickup_location', ''),
        destination=data.get('destination', '')
    )
    return JsonResponse({"status": "success", "car_id": car.id})

@require_http_methods(["GET"])
def list_driver_cars(request):
    if not request.user.is_authenticated or request.user.role != 'Driver':
        return JsonResponse({"error": "Unauthorized"}, status=401)
    
    cars = DriverCar.objects.filter(driver=request.user)
    cars_data = [{"id": c.id, "car_model": c.car_model, "car_number": c.car_number, "available_seats": c.available_seats, "seat_price": str(c.seat_price)} for c in cars]
    return JsonResponse({"cars": cars_data})

@require_http_methods(["POST"])
def create_ride(request):
    if not request.user.is_authenticated or request.user.role != 'Driver':
        return JsonResponse({"error": "Unauthorized"}, status=401)
    
    data = json.loads(request.body)
    car_id = data.get('car_id')
    try:
        car = DriverCar.objects.get(id=car_id, driver=request.user)
    except DriverCar.DoesNotExist:
        return JsonResponse({"error": "Car not found"}, status=404)
        
    departure_str = data.get('departure_time')
    try:
        departure_dt = datetime.fromisoformat(departure_str.replace('Z', '+00:00'))
    except:
        departure_dt = timezone.now()

    ride = Ride.objects.create(
        driver=request.user,
        car=car,
        pickup_location=data.get('pickup_location', car.pickup_location),
        destination=data.get('destination', car.destination),
        departure_time=departure_dt,
        available_seats=int(data.get('available_seats', car.available_seats)),
        price_per_seat=data.get('price_per_seat', car.seat_price)
    )
    return JsonResponse({"status": "success", "ride_id": ride.id})

@require_http_methods(["POST"])
def match_rides(request):
    data = json.loads(request.body)
    pickup = data.get('pickup_location')
    destination = data.get('destination')
    required_seats = int(data.get('required_seats', 1))

    # Basic single-car match logic
    matching_rides = Ride.objects.filter(
        pickup_location__icontains=pickup,
        destination__icontains=destination,
        available_seats__gte=required_seats,
        status='Scheduled'
    ).order_by('price_per_seat')

    results = []
    for r in matching_rides:
        results.append({
            "id": r.id,
            "driver": r.driver.username,
            "car": r.car.car_model,
            "departure": r.departure_time.isoformat(),
            "price": str(r.price_per_seat * required_seats),
            "match_type": "Single Car"
        })

    # Basic multi-car logic (if single car doesn't fit, find two cars)
    if not results and required_seats > 1:
        # Split seats to find two cars
        split_a = required_seats // 2
        split_b = required_seats - split_a
        
        rides_a = Ride.objects.filter(pickup_location__icontains=pickup, destination__icontains=destination, available_seats__gte=split_a, status='Scheduled')
        rides_b = Ride.objects.filter(pickup_location__icontains=pickup, destination__icontains=destination, available_seats__gte=split_b, status='Scheduled')
        
        for r1 in rides_a:
            for r2 in rides_b:
                if r1.id != r2.id:
                    total_price = (r1.price_per_seat * split_a) + (r2.price_per_seat * split_b)
                    results.append({
                        "id": f"MULTI-{r1.id}-{r2.id}",
                        "drivers": f"{r1.driver.username} & {r2.driver.username}",
                        "car": f"{r1.car.car_model} & {r2.car.car_model}",
                        "departure": "Coordinated",
                        "price": str(total_price),
                        "match_type": "Multi-Car Combination"
                    })
                    break # Limit multi matches

    return JsonResponse({"matches": results})
