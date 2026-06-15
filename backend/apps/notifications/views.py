from django.shortcuts import render

# Create your views here.
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from .telegram_bot import handle_webhook


@method_decorator(csrf_exempt, name="dispatch")
class TelegramWebhookView(View):
    """
    POST /api/v1/telegram/webhook/

    Receives Telegram bot updates. Always returns 200 so Telegram
    does not retry. All processing is best-effort.
    """

    def post(self, request):
        return handle_webhook(request)
