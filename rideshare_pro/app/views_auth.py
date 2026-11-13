import json
from django.http import JsonResponse
from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect
from django.views.decorators.http import require_http_methods
from .models import User, DriverCar, Ride, Booking, Payment, Complaint, Rating

# --- CSRF and Auth ---

@ensure_csrf_cookie
@require_http_methods(["GET"])
def get_csrf(request):
    return JsonResponse({"detail": "CSRF cookie set"})

@require_http_methods(["POST"])
def register_user(request):
    data = json.loads(request.body)
    username = data.get('username')
    password = data.get('password')
    email = data.get('email', '')
    role = data.get('role', 'Client')
    phone = data.get('phone_number', '')

    if User.objects.filter(username=username).exists():
        return JsonResponse({"error": "Username already exists"}, status=400)
    
    user = User.objects.create_user(username=username, email=email, password=password, role=role, phone_number=phone)
    return JsonResponse({"status": "success", "message": "User created successfully"})

@require_http_methods(["POST"])
def login_user(request):
    data = json.loads(request.body)
    username = data.get('username')
    password = data.get('password')
    user = authenticate(request, username=username, password=password)
    
    if user is not None:
        login(request, user)
        return JsonResponse({"status": "success", "user": {"id": user.id, "username": user.username, "role": user.role}})
    return JsonResponse({"error": "Invalid credentials"}, status=401)

@require_http_methods(["POST"])
def logout_user(request):
    logout(request)
    return JsonResponse({"status": "success", "message": "Logged out"})

@require_http_methods(["GET"])
def get_profile(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Not authenticated"}, status=401)
    
    user = request.user
    return JsonResponse({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "phone_number": user.phone_number,
        "rating": user.rating
    })
