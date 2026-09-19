"""
Auth serializers for email-based JWT login.
"""

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    JWT obtain using email (USERNAME_FIELD) + password.
    Response includes a small user payload for clients.
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        token['display_name'] = user.get_full_name()
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'display_name': self.user.get_full_name(),
        }
        return data
