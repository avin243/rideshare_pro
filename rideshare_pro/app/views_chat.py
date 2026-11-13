import json
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from .models import ChatMessage, Booking

@require_http_methods(["GET"])
def get_chat_messages(request, booking_id):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Unauthorized"}, status=401)
    
    try:
        booking = Booking.objects.get(id=booking_id)
    except Booking.DoesNotExist:
        return JsonResponse({"error": "Booking not found"}, status=404)
        
    # Only allow the client or the driver of this booking to view
    if request.user != booking.client and request.user != booking.ride.driver:
        return JsonResponse({"error": "Unauthorized to view this chat"}, status=403)
        
    messages = ChatMessage.objects.filter(booking=booking).order_by('timestamp')
    data = []
    
    for m in messages:
        data.append({
            "id": m.id,
            "sender_id": m.sender.id,
            "sender_name": m.sender.username,
            "message": m.message,
            "timestamp": m.timestamp.isoformat()
        })
        
    return JsonResponse({"messages": data})

@require_http_methods(["POST"])
def send_chat_message(request, booking_id):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Unauthorized"}, status=401)
        
    try:
        booking = Booking.objects.get(id=booking_id)
    except Booking.DoesNotExist:
        return JsonResponse({"error": "Booking not found"}, status=404)
        
    if request.user != booking.client and request.user != booking.ride.driver:
        return JsonResponse({"error": "Unauthorized to send messages for this chat"}, status=403)
        
    data = json.loads(request.body)
    msg_text = data.get('message', '').strip()
    
    if not msg_text:
        return JsonResponse({"error": "Message cannot be empty"}, status=400)
        
    msg = ChatMessage.objects.create(
        booking=booking,
        sender=request.user,
        message=msg_text
    )
    
    return JsonResponse({
        "status": "success",
        "message": {
            "id": msg.id,
            "sender_id": msg.sender.id,
            "sender_name": msg.sender.username,
            "message": msg.message,
            "timestamp": msg.timestamp.isoformat()
        }
    })
