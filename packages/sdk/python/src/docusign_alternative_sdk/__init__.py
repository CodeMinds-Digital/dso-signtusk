"""
DocuSign Alternative SDK for Python

Official Python SDK for the DocuSign Alternative e-signature platform.
Provides comprehensive client libraries with full API coverage and type safety.
"""

from .client import DocuSignAlternativeSDK
from .exceptions import (
    DocuSignAlternativeError,
    AuthenticationError,
    AuthorizationError,
    ValidationError,
    NotFoundError,
    ConflictError,
    RateLimitError,
    ServerError,
    NetworkError,
    TimeoutError,
    ConfigurationError,
    WebhookVerificationError,
)
from .models import (
    Document,
    Template,
    SigningRequest,
    Recipient,
    Organization,
    User,
    Webhook,
)

__version__ = "1.0.0"
__author__ = "DocuSign Alternative Team"
__email__ = "support@docusign-alternative.com"

__all__ = [
    "DocuSignAlternativeSDK",
    "DocuSignAlternativeError",
    "AuthenticationError",
    "AuthorizationError",
    "ValidationError",
    "NotFoundError",
    "ConflictError",
    "RateLimitError",
    "ServerError",
    "NetworkError",
    "TimeoutError",
    "ConfigurationError",
    "WebhookVerificationError",
    "Document",
    "Template",
    "SigningRequest",
    "Recipient",
    "Organization",
    "User",
    "Webhook",
]