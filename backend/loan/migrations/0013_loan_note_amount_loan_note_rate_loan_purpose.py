# Generated by Django 5.2.2 on 2025-07-04 13:57

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('loan', '0012_xmlupload'),
    ]

    operations = [
        migrations.AddField(
            model_name='loan',
            name='note_amount',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True),
        ),
        migrations.AddField(
            model_name='loan',
            name='note_rate',
            field=models.DecimalField(blank=True, decimal_places=3, max_digits=6, null=True),
        ),
        migrations.AddField(
            model_name='loan',
            name='purpose',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
    ]
