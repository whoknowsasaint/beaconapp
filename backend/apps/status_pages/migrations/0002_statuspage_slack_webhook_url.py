from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("status_pages", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="statuspage",
            name="slack_webhook_url",
            field=models.URLField(
                blank=True,
                default="",
                max_length=500,
                help_text="Slack incoming webhook URL for incident notifications.",
            ),
        ),
    ]