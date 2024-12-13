# Generated by Django 5.1 on 2024-08-19 11:34

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('events', '0005_evento_color'),
    ]

    operations = [
        migrations.CreateModel(
            name='Categoria',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre', models.CharField(max_length=50)),
                ('color', models.CharField(default='#ffffff', max_length=7)),
            ],
        ),
        migrations.AlterField(
            model_name='evento',
            name='categoria',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='events.categoria'),
        ),
    ]
