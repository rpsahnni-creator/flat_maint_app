from django.contrib import admin

from . import models

admin.site.register(models.Unit)
admin.site.register(models.Bill)
admin.site.register(models.Payment)
admin.site.register(models.Expense)
admin.site.register(models.Notice)
admin.site.register(models.Visitor)
admin.site.register(models.Amenity)
admin.site.register(models.Booking)
admin.site.register(models.SosAlert)
admin.site.register(models.Complaint)
