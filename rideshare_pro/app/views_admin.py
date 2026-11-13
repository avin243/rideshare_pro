import json
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from .models import User, Ride, Booking, Complaint, Payment

@require_http_methods(["GET"])
def admin_overview(request):
    if not request.user.is_authenticated or request.user.role != 'Admin':
        return JsonResponse({"error": "Unauthorized"}, status=401)
    
    users_data = []
    for u in User.objects.all():
        users_data.append({
            "id": u.id, 
            "name": u.username, 
            "email": u.email, 
            "role": u.role.lower(), 
            "status": "active" if u.is_active else "inactive", 
            "rides": u.client_bookings.count() if u.role=='Client' else u.driver_rides.count()
        })
    
    rides_data = []
    for r in Ride.objects.all():
        client_name = "None"
        b_count = r.ride_bookings.count()
        if b_count == 1:
            client_name = r.ride_bookings.first().client.username
        elif b_count > 1:
            client_name = "Multiple"
            
        amount = sum(b.total_price for b in r.ride_bookings.all())
        
        rides_data.append({
            "id": f"R{r.id:03d}", 
            "driver": r.driver.username, 
            "client": client_name, 
            "route": f"{r.pickup_location} → {r.destination}", 
            "seats": r.car.total_seats - r.available_seats, 
            "amount": str(amount), 
            "status": r.status.lower()
        })

    return JsonResponse({
        "users": users_data,
        "rides_admin": rides_data
    })
