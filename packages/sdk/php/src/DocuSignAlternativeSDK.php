<?php

declare(strict_types=1);

namespace DocuSignAlternative\SDK;

use DocuSignAlternative\SDK\Configuration\SDKConfiguration;
use DocuSignAlternative\SDK\Http\HttpClient;
use DocuSignAlternative\SDK\Services\DocumentService;
use DocuSignAlternative\SDK\Services\TemplateService;
use DocuSignAlternative\SDK\Services\SigningService;
use DocuSignAlternative\SDK\Services\OrganizationService;
use DocuSignAlternative\SDK\Services\UserService;
use DocuSignAlternative\SDK\Services\WebhookService;
use DocuSignAlternative\SDK\Services\AnalyticsService;
use DocuSignAlternative\SDK\Services\AuthService;
use DocuSignAlternative\SDK\Exceptions\ConfigurationException;

/**
 * Main SDK client for Signtusk platform.
 * 
 * Provides access to all API services with authentication, error handling,
 * and retry logic built-in.
 */
class DocuSignAlternativeSDK
{
    private SDKConfiguration $config;
    private HttpClient $httpClient;

    // Service instances
    public readonly DocumentService $documents;
    public readonly TemplateService $templates;
    public readonly SigningService $signing;
    public readonly OrganizationService $organizations;
    public readonly UserService $users;
    public readonly WebhookService $webhooks;
    public readonly AnalyticsService $analytics;
    public readonly AuthService $auth;

    /**
     * Initialize the SDK client.
     * 
     * @param array|SDKConfiguration $config SDK configuration
     * @throws ConfigurationException
     */
    public function __construct(array|SDKConfiguration $config)
    {
        if (is_array($config)) {
            $config = new SDKConfiguration($config);
        }

        $this->config = $this->validateConfig($config);
        $this->httpClient = new HttpClient($this->config);

        // Initialize services
        $this->documents = new DocumentService($this);
        $this->templates = new TemplateService($this);
        $this->signing = new SigningService($this);
        $this->organizations = new OrganizationService($this);
        $this->users = new UserService($this);
        $this->webhooks = new WebhookService($this);
        $this->analytics = new AnalyticsService($this);
        $this->auth = new AuthService($this);
    }

    /**
     * Validate and normalize configuration.
     */
    private function validateConfig(SDKConfiguration $config): SDKConfiguration
    {
        if (!$config->getApiKey() && !$config->getOAuth() && !$config->getJwt()) {
            throw new ConfigurationException('API key, OAuth configuration, or JWT token is required');
        }

        if (!$config->getBaseUrl()) {
            $baseUrls = [
                'development' => 'https://api-dev.docusign-alternative.com',
                'staging' => 'https://api-staging.docusign-alternative.com',
                'production' => 'https://api.docusign-alternative.com'
            ];

            $environment = $config->getEnvironment() ?? 'production';
            $config->setBaseUrl($baseUrls[$environment] ?? $baseUrls['production']);
        }

        return $config;
    }

    /**
     * Get HTTP client instance.
     */
    public function getHttpClient(): HttpClient
    {
        return $this->httpClient;
    }

    /**
     * Get current configuration.
     */
    public function getConfig(): SDKConfiguration
    {
        return $this->config;
    }

    /**
     * Set authentication token.
     */
    public function setAuthToken(string $token): void
    {
        $this->config->setApiKey($token);
        $this->httpClient->setAuthToken($token);
    }

    /**
     * Clear authentication.
     */
    public function clearAuth(): void
    {
        $this->config->setApiKey(null);
        $this->httpClient->clearAuth();
    }

    /**
     * Create SDK instance with API key authentication.
     */
    public static function withApiKey(string $apiKey, array $options = []): self
    {
        $config = array_merge($options, ['apiKey' => $apiKey]);
        return new self($config);
    }

    /**
     * Create SDK instance with OAuth configuration.
     */
    public static function withOAuth(array $oauthConfig, array $options = []): self
    {
        $config = array_merge($options, ['oauth' => $oauthConfig]);
        return new self($config);
    }

    /**
     * Create SDK instance with JWT token.
     */
    public static function withJWT(string $token, array $options = []): self
    {
        $config = array_merge($options, ['jwt' => ['token' => $token]]);
        return new self($config);
    }
}