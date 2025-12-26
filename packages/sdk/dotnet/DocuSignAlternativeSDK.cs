using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using DocuSignAlternative.SDK.Configuration;
using DocuSignAlternative.SDK.Http;
using DocuSignAlternative.SDK.Services;
using DocuSignAlternative.SDK.Exceptions;

namespace DocuSignAlternative.SDK;

/// <summary>
/// Main SDK client for Signtusk platform.
/// Provides access to all API services with authentication, error handling, and retry logic built-in.
/// </summary>
public class DocuSignAlternativeSDK : IDisposable
{
    private readonly SDKConfiguration _config;
    private readonly HttpClientService _httpClient;
    private readonly ILogger<DocuSignAlternativeSDK>? _logger;
    private bool _disposed;

    /// <summary>
    /// Document management service
    /// </summary>
    public DocumentService Documents { get; }

    /// <summary>
    /// Template management service
    /// </summary>
    public TemplateService Templates { get; }

    /// <summary>
    /// Signing workflow service
    /// </summary>
    public SigningService Signing { get; }

    /// <summary>
    /// Organization management service
    /// </summary>
    public OrganizationService Organizations { get; }

    /// <summary>
    /// User management service
    /// </summary>
    public UserService Users { get; }

    /// <summary>
    /// Webhook management service
    /// </summary>
    public WebhookService Webhooks { get; }

    /// <summary>
    /// Analytics service
    /// </summary>
    public AnalyticsService Analytics { get; }

    /// <summary>
    /// Authentication service
    /// </summary>
    public AuthService Auth { get; }

    /// <summary>
    /// Initialize the SDK client.
    /// </summary>
    /// <param name="config">SDK configuration</param>
    /// <param name="httpClient">Optional HTTP client</param>
    /// <param name="logger">Optional logger</param>
    /// <exception cref="ConfigurationException">Thrown when configuration is invalid</exception>
    public DocuSignAlternativeSDK(
        SDKConfiguration config,
        HttpClient? httpClient = null,
        ILogger<DocuSignAlternativeSDK>? logger = null)
    {
        _config = ValidateConfig(config);
        _logger = logger;
        _httpClient = new HttpClientService(_config, httpClient, logger);

        // Initialize services
        Documents = new DocumentService(_httpClient, logger);
        Templates = new TemplateService(_httpClient, logger);
        Signing = new SigningService(_httpClient, logger);
        Organizations = new OrganizationService(_httpClient, logger);
        Users = new UserService(_httpClient, logger);
        Webhooks = new WebhookService(_httpClient, logger);
        Analytics = new AnalyticsService(_httpClient, logger);
        Auth = new AuthService(_httpClient, _config, logger);
    }

    /// <summary>
    /// Initialize the SDK client with options pattern.
    /// </summary>
    /// <param name="options">SDK configuration options</param>
    /// <param name="httpClient">Optional HTTP client</param>
    /// <param name="logger">Optional logger</param>
    public DocuSignAlternativeSDK(
        IOptions<SDKConfiguration> options,
        HttpClient? httpClient = null,
        ILogger<DocuSignAlternativeSDK>? logger = null)
        : this(options.Value, httpClient, logger)
    {
    }

    /// <summary>
    /// Create SDK instance with API key authentication.
    /// </summary>
    /// <param name="apiKey">API key</param>
    /// <param name="environment">Environment (development, staging, production)</param>
    /// <param name="httpClient">Optional HTTP client</param>
    /// <param name="logger">Optional logger</param>
    /// <returns>SDK instance</returns>
    public static DocuSignAlternativeSDK WithApiKey(
        string apiKey,
        string environment = "production",
        HttpClient? httpClient = null,
        ILogger<DocuSignAlternativeSDK>? logger = null)
    {
        var config = new SDKConfiguration
        {
            ApiKey = apiKey,
            Environment = environment
        };
        return new DocuSignAlternativeSDK(config, httpClient, logger);
    }

    /// <summary>
    /// Create SDK instance with OAuth configuration.
    /// </summary>
    /// <param name="oauthConfig">OAuth configuration</param>
    /// <param name="environment">Environment (development, staging, production)</param>
    /// <param name="httpClient">Optional HTTP client</param>
    /// <param name="logger">Optional logger</param>
    /// <returns>SDK instance</returns>
    public static DocuSignAlternativeSDK WithOAuth(
        OAuthConfiguration oauthConfig,
        string environment = "production",
        HttpClient? httpClient = null,
        ILogger<DocuSignAlternativeSDK>? logger = null)
    {
        var config = new SDKConfiguration
        {
            OAuth = oauthConfig,
            Environment = environment
        };
        return new DocuSignAlternativeSDK(config, httpClient, logger);
    }

    /// <summary>
    /// Create SDK instance with JWT token.
    /// </summary>
    /// <param name="token">JWT token</param>
    /// <param name="environment">Environment (development, staging, production)</param>
    /// <param name="httpClient">Optional HTTP client</param>
    /// <param name="logger">Optional logger</param>
    /// <returns>SDK instance</returns>
    public static DocuSignAlternativeSDK WithJWT(
        string token,
        string environment = "production",
        HttpClient? httpClient = null,
        ILogger<DocuSignAlternativeSDK>? logger = null)
    {
        var config = new SDKConfiguration
        {
            JWT = new JWTConfiguration { Token = token },
            Environment = environment
        };
        return new DocuSignAlternativeSDK(config, httpClient, logger);
    }

    /// <summary>
    /// Get current configuration.
    /// </summary>
    /// <returns>SDK configuration</returns>
    public SDKConfiguration GetConfig() => _config;

    /// <summary>
    /// Set authentication token.
    /// </summary>
    /// <param name="token">Authentication token</param>
    public void SetAuthToken(string token)
    {
        _config.ApiKey = token;
        _httpClient.SetAuthToken(token);
    }

    /// <summary>
    /// Clear authentication.
    /// </summary>
    public void ClearAuth()
    {
        _config.ApiKey = null;
        _httpClient.ClearAuth();
    }

    /// <summary>
    /// Validate and normalize configuration.
    /// </summary>
    /// <param name="config">Configuration to validate</param>
    /// <returns>Validated configuration</returns>
    /// <exception cref="ConfigurationException">Thrown when configuration is invalid</exception>
    private static SDKConfiguration ValidateConfig(SDKConfiguration config)
    {
        if (string.IsNullOrEmpty(config.ApiKey) && 
            config.OAuth == null && 
            config.JWT == null)
        {
            throw new ConfigurationException("API key, OAuth configuration, or JWT token is required");
        }

        if (string.IsNullOrEmpty(config.BaseUrl))
        {
            var baseUrls = new Dictionary<string, string>
            {
                ["development"] = "https://api-dev.docusign-alternative.com",
                ["staging"] = "https://api-staging.docusign-alternative.com",
                ["production"] = "https://api.docusign-alternative.com"
            };

            config.BaseUrl = baseUrls.GetValueOrDefault(config.Environment ?? "production", 
                                                       baseUrls["production"]);
        }

        return config;
    }

    /// <summary>
    /// Dispose resources.
    /// </summary>
    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }

    /// <summary>
    /// Dispose resources.
    /// </summary>
    /// <param name="disposing">Whether disposing</param>
    protected virtual void Dispose(bool disposing)
    {
        if (!_disposed && disposing)
        {
            _httpClient?.Dispose();
            _disposed = true;
        }
    }
}