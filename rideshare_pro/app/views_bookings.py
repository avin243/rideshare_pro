import json
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from .models import Ride, Booking, Payment

# --- BOOKINGS & PAYMENTS ---

@require_http_methods(["POST"])
def create_booking(request):
    if not request.user.is_authenticated or request.user.role != 'Client':
        return JsonResponse({"error": "Unauthorized. Only clients can book"}, status=401)
    
    data = json.loads(request.body)
    ride_id = data.get('ride_id')
    seats_booked = int(data.get('seats_booked', 1))

    # Support matching string ID for simplicity of multi-car simulation
    if isinstance(ride_id, str) and ride_id.startswith("MULTI"):
        return JsonResponse({"status": "success", "message": "Multi-car combination booked successfully", "booking_id": "M-"+str(ride_id)})

    try:
        ride = Ride.objects.get(id=ride_id)
    except Ride.DoesNotExist:
        return JsonResponse({"error": "Ride not found"}, status=404)
        
    if ride.available_seats < seats_booked:
        return JsonResponse({"error": "Not enough seats available"}, status=400)
    
    total_price = ride.price_per_seat * seats_booked
    
    booking = Booking.objects.create(
        client=request.user,
        ride=ride,
        seats_booked=seats_booked,
        total_price=total_price
    )
    
    ride.available_seats -= seats_booked
    ride.save()
    
    return JsonResponse({"status": "success", "booking_id": booking.id, "total_price": str(total_price)})

@require_http_methods(["GET"])
def get_my_bookings(request):
    if not request.user.is_authenticated or request.user.role != 'Client':
        return JsonResponse({"error": "Unauthorized"}, status=401)
        
    bookings = Booking.objects.filter(client=request.user)
    data = []
    for b in bookings:
        data.append({
            "id": b.id,
            "ride_id": b.ride.id,
            "driver": b.ride.driver.username,
            "destination": b.ride.destination,
            "departure": b.ride.departure_time.isoformat(),
            "seats": b.seats_booked,
            "status": b.booking_status,
            "payment": b.payment_status,
            "price": str(b.total_price)
        })
    return JsonResponse({"bookings": data})

@require_http_methods(["POST"])
def simulate_payment(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Unauthorized"}, status=401)
        
    data = json.loads(request.body)
    booking_id = data.get('booking_id')
    
    try:
        if str(booking_id).startswith("M-"):
             return JsonResponse({"status": "success", "transaction_id": "sim_multi_12345"})
             
        booking = Booking.objects.get(id=booking_id, client=request.user)
    except Booking.DoesNotExist:
         return JsonResponse({"error": "Booking not found"}, status=404)
         
    if booking.payment_status == 'Completed':
         return JsonResponse({"error": "Already paid"}, status=400)
         
    # Simulate payment success
    import uuid
    payment = Payment.objects.create(
         booking=booking,
         transaction_id=str(uuid.uuid4())[:12],
         amount=booking.total_price
    )
    booking.payment_status = 'Completed'
    booking.save()
    
    return JsonResponse({"status": "success", "transaction_id": payment.transaction_id})

@require_http_methods(["GET"])
def get_driver_passengers(request):
    if not request.user.is_authenticated or request.user.role != 'Driver':
        return JsonResponse({"error": "Unauthorized"}, status=401)
        
    bookings = Booking.objects.filter(ride__driver=request.user).order_by('-created_at')
    data = []
    for b in bookings:
        data.append({
            "id": b.id,
            "name": b.client.username,
            "gender": "U",
            "seats": b.seats_booked,
            "pickup": b.ride.pickup_location,
            "dest": b.ride.destination,
            "status": b.booking_status.lower()
        })
    return JsonResponse({"passengers": data})

@require_http_methods(["POST"])
def accept_passenger(request, booking_id):
    if not request.user.is_authenticated or request.user.role != 'Driver':
        return JsonResponse({"error": "Unauthorized"}, status=401)
    try:
        booking = Booking.objects.get(id=booking_id, ride__driver=request.user)
        booking.booking_status = 'Confirmed'
        booking.save()
        return JsonResponse({"status": "success"})
    except Booking.DoesNotExist:
        return JsonResponse({"error": "Not Found"}, status=404)
