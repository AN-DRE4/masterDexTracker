from django.db import models


class SquareChoice(models.Model):
    """Stores which option (1, 2, or 3) was picked for a grid square."""

    square_id = models.PositiveIntegerField(unique=True)
    option = models.PositiveSmallIntegerField()  # 1, 2, or 3
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['square_id']
