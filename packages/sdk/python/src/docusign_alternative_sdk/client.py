"""
Main SDK client for DocuSign Alternative Python SDK
"""

import time
from typing import Optional, Dict, Any, Union
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from .config import SDKConfiguration
from .exceptions import (
    ConfigurationError,
    create_error_from_response,
    is_retryable_error,
)
from .services import (
    DocumentService,
    TemplateService,
    SigningService,
    OrganizationService,
    UserService,
    WebhookService,
    AnalyticsService,
    AuthService,
    EventService,
)


class DocuSignAlternativeSDK:
    """
    Main SDK client for Signtusk platform.
    
    Provides access to all API services with authentication, error handling,
    and retry logic built-in.
    """

    def __init__(self, config: Union[SDKConfiguration, Dict[str, Any]]):
        """
        Initialize the SDK client.
        
        Args:
            config: SDK configuration object or dictionary
        """
        if isinstance(config, dict):
            config = SDKConfiguration(**config)
        
        self.config = self._validate_config(config)
        self.session = self._create_session()
        
        # Initialize services
        self.documents = DocumentService(self)
        self.templates = TemplateService(self)
        self.signing = SigningService(self)
        self.organizations = OrganizationService(self)
        self.users = UserService(self)
        self.webhooks = WebhookService(self)
        self.analytics = AnalyticsService(self)
        self.auth = AuthService(self)
        self.events = EventService(self)

    def _validate_config(self, config: SDKConfiguration) -> SDKConfiguration:
        """Validate and normalize configuration."""
        if not config.api_key and not config.oauth and not config.jwt:
            raise ConfigurationError("API key, OAuth configuration, or JWT token is required")
        
        if not config.base_url:
            base_urls = {
                "development": "https://api-dev.docusign-alternative.com",
                "staging": "https://api-staging.docusign-alternative.com",
                "production": "https://api.docusign-alternative.com"
            }
            config.base_url = base_urls.get(config.environment, base_urls["production"])
        
        return config

    def _create_session(self) -> requests.Session:
        """Create and configure HTTP session."""
        session = requests.Session()
        
        # Set default headers
        session.headers.update({
            "Content-Type": "application/json",
            "User-Agent": "DocuSignAlternative-Python-SDK/1.0.0",
            "Accept": "application/json"
        })
        
        # Set authentication
        if self.config.api_key:
            session.headers["Authorization"] = f"Bearer {self.config.api_key}"
        elif self.config.jwt and self.config.jwt.token:
            session.headers["Authorization"] = f"Bearer {self.config.jwt.token}"
        
        # Configure retry strategy
        retry_strategy = Retry(
            total=self.config.retries,
            backoff_factor=self.config.retry_delay / 1000,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["HEAD", "GET", "PUT", "DELETE", "OPTIONS", "TRACE", "POST"]
        )
        
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        
        return session

    def request(
        self,
        method: str,
        url: str,
        data: Optional[Any] = None,
        json: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
        files: Optional[Dict[str, Any]] = None,
        **kwargs
    ) -> requests.Response:
        """
        Make HTTP request with error handling and retry logic.
        
        Args:
            method: HTTP method
            url: Request URL (relative to base_url)
            data: Request body data
            json: JSON data to send
            params: URL parameters
            headers: Additional headers
            files: Files to upload
            **kwargs: Additional arguments for requests
            
        Returns:
            Response object
            
        Raises:
            DocuSignAlternativeError: On API errors
        """
        full_url = f"{self.config.base_url.rstrip('/')}/{url.lstrip('/')}"
        
        request_headers = {}
        if headers:
            request_headers.update(headers)
        
        # Handle file uploads
        if files:
            # Remove Content-Type header for multipart uploads
            if "Content-Type" in request_headers:
                del request_headers["Content-Type"]
        
        try:
            response = self.session.request(
                method=method.upper(),
                url=full_url,
                data=data,
                json=json,
                params=params,
                headers=request_headers,
                files=files,
                timeout=self.config.timeout / 1000,
                **kwargs
            )
            
            # Check for HTTP errors
            if not response.ok:
                request_id = response.headers.get("x-request-id")
                try:
                    error_data = response.json()
                except ValueError:
                    error_data = {"message": response.text or "Unknown error"}
                
                raise create_error_from_response(response.status_code, error_data, request_id)
            
            return response
            
        except requests.exceptions.Timeout:
            from .exceptions import TimeoutError
            raise TimeoutError("Request timeout")
        except requests.exceptions.ConnectionError as e:
            from .exceptions import NetworkError
            raise NetworkError(f"Network error: {str(e)}")
        except requests.exceptions.RequestException as e:
            from .exceptions import NetworkError
            raise NetworkError(f"Request error: {str(e)}")

    def get(self, url: str, **kwargs) -> requests.Response:
        """Make GET request."""
        return self.request("GET", url, **kwargs)

    def post(self, url: str, **kwargs) -> requests.Response:
        """Make POST request."""
        return self.request("POST", url, **kwargs)

    def put(self, url: str, **kwargs) -> requests.Response:
        """Make PUT request."""
        return self.request("PUT", url, **kwargs)

    def patch(self, url: str, **kwargs) -> requests.Response:
        """Make PATCH request."""
        return self.request("PATCH", url, **kwargs)

    def delete(self, url: str, **kwargs) -> requests.Response:
        """Make DELETE request."""
        return self.request("DELETE", url, **kwargs)

    def upload_file(
        self,
        url: str,
        file_data: Any,
        additional_data: Optional[Dict[str, Any]] = None,
        progress_callback: Optional[callable] = None
    ) -> requests.Response:
        """
        Upload file with progress tracking.
        
        Args:
            url: Upload URL
            file_data: File data to upload
            additional_data: Additional form data
            progress_callback: Progress callback function
            
        Returns:
            Response object
        """
        files = {"file": file_data}
        data = additional_data or {}
        
        # Note: Progress tracking would require additional implementation
        # for monitoring upload progress in Python requests
        
        return self.post(url, files=files, data=data)

    def set_auth_token(self, token: str) -> None:
        """Set authentication token."""
        self.config.api_key = token
        self.session.headers["Authorization"] = f"Bearer {token}"

    def clear_auth(self) -> None:
        """Clear authentication."""
        self.config.api_key = None
        if "Authorization" in self.session.headers:
            del self.session.headers["Authorization"]

    def close(self) -> None:
        """Close the HTTP session."""
        self.session.close()

    def __enter__(self):
        """Context manager entry."""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.close()