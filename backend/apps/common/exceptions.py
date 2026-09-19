"""
Custom exception handling for the API.
"""

from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom exception handler that returns consistent error responses.
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)

    if response is not None:
        # Custom error response format
        custom_response_data = {
            'error': {
                'code': get_error_code(exc),
                'message': str(exc),
                'details': response.data if hasattr(response, 'data') else None
            }
        }
        
        # Log the error
        logger.error(
            f"API Error: {get_error_code(exc)} - {str(exc)}",
            extra={
                'status_code': response.status_code,
                'view': context['view'].__class__.__name__ if 'view' in context else None,
                'path': context['request'].path if 'request' in context else None,
            }
        )
        
        response.data = custom_response_data
        response.status_code = get_error_status_code(exc, response.status_code)
    
    else:
        # Handle non-API exceptions
        logger.error(
            f"Unhandled Exception: {type(exc).__name__} - {str(exc)}",
            exc_info=True,
            extra={
                'view': context['view'].__class__.__name__ if 'view' in context else None,
                'path': context['request'].path if 'request' in context else None,
            }
        )
        
        custom_response_data = {
            'error': {
                'code': 'SERVER_ERROR',
                'message': 'An internal server error occurred.',
                'details': None
            }
        }
        
        response = Response(custom_response_data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return response


def get_error_code(exc):
    """
    Map exception types to error codes.
    """
    error_code_mapping = {
        'ValidationError': 'VALIDATION_ERROR',
        'AuthenticationFailed': 'AUTHENTICATION_ERROR',
        'NotAuthenticated': 'AUTHENTICATION_ERROR',
        'PermissionDenied': 'PERMISSION_DENIED',
        'NotFound': 'NOT_FOUND',
        'MethodNotAllowed': 'METHOD_NOT_ALLOWED',
        'Throttled': 'RATE_LIMIT_EXCEEDED',
        'ParseError': 'PARSE_ERROR',
    }
    
    exc_class_name = exc.__class__.__name__
    return error_code_mapping.get(exc_class_name, 'SERVER_ERROR')


def get_error_status_code(exc, default_status_code):
    """
    Map exception types to appropriate HTTP status codes.
    """
    status_code_mapping = {
        'ValidationError': status.HTTP_400_BAD_REQUEST,
        'AuthenticationFailed': status.HTTP_401_UNAUTHORIZED,
        'NotAuthenticated': status.HTTP_401_UNAUTHORIZED,
        'PermissionDenied': status.HTTP_403_FORBIDDEN,
        'NotFound': status.HTTP_404_NOT_FOUND,
        'MethodNotAllowed': status.HTTP_405_METHOD_NOT_ALLOWED,
        'Throttled': status.HTTP_429_TOO_MANY_REQUESTS,
    }
    
    exc_class_name = exc.__class__.__name__
    return status_code_mapping.get(exc_class_name, default_status_code)