"""
RBAC helpers for society-scoped operations.
"""

from rest_framework.permissions import BasePermission, SAFE_METHODS

ADMIN_ROLES = {'super_admin', 'society_admin', 'accountant', 'manager'}
GUARD_ROLES = {'guard'}
# See all units / visitors / SOS (not billing or settings writes)
SOCIETY_WIDE_ROLES = ADMIN_ROLES | GUARD_ROLES


def user_society_ids(user):
    if not user or not user.is_authenticated:
        return []
    return list(user.roles.values_list('society_id', flat=True))


def user_roles_for_society(user, society_id):
    if not user or not user.is_authenticated:
        return set()
    return set(user.roles.filter(society_id=society_id).values_list('role', flat=True))


def is_society_admin(user, society_id=None):
    if not user or not user.is_authenticated:
        return False
    qs = user.roles.filter(role__in=ADMIN_ROLES)
    if society_id is not None:
        qs = qs.filter(society_id=society_id)
    return qs.exists() or user.is_superuser


def is_guard(user, society_id=None):
    if not user or not user.is_authenticated:
        return False
    qs = user.roles.filter(role__in=GUARD_ROLES)
    if society_id is not None:
        qs = qs.filter(society_id=society_id)
    return qs.exists()


def can_view_all_units(user, society_id=None):
    """Admins and gate guards see the full unit/owner directory."""
    return is_society_admin(user, society_id) or is_guard(user, society_id)


def resident_unit_ids(user, society_id=None):
    from apps.operations.models import Unit

    qs = Unit.objects.filter(resident_user=user, is_active=True)
    if society_id is not None:
        qs = qs.filter(society_id=society_id)
    return list(qs.values_list('id', flat=True))


class IsAuthenticatedInSociety(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)


class IsSocietyAdmin(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        return is_society_admin(request.user)
