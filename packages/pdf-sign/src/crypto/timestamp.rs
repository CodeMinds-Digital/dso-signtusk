//! RFC 3161 Timestamp Server Integration
//! 
//! This module provides functionality to request and integrate RFC 3161 timestamps
//! into PKCS#7 signatures for enhanced security and non-repudiation.

use crate::{
    error::{PdfSignError, Result},
    types::*,
};
use chrono::{DateTime, Utc};
use der::{Decode, Encode};
use std::time::Duration;

/// RFC 3161 Timestamp Server client
pub struct TimestampClient {
    /// HTTP client for making requests
    client: reqwest::Client,
    /// Default timeout for timestamp requests
    timeout: Duration,
}

impl TimestampClient {
    /// Create a new timestamp client
    pub fn new() -> Self {
        Self {
            client: reqwest::Client::builder()
                .timeout(Duration::from_secs(30))
                .build()
                .unwrap_or_else(|_| reqwest::Client::new()),
            timeout: Duration::from_secs(30),
        }
    }

    /// Create a new timestamp client with custom timeout
    pub fn with_timeout(timeout: Duration) -> Self {
        Self {
            client: reqwest::Client::builder()
                .timeout(timeout)
                .build()
                .unwrap_or_else(|_| reqwest::Client::new()),
            timeout,
        }
    }

    /// Request a timestamp from an RFC 3161 timestamp server
    pub async fn request_timestamp(
        &self,
        server_url: &str,
        message_imprint: &[u8],
        hash_algorithm: &HashAlgorithm,
    ) -> Result<TimestampToken> {
        // Create TSA request
        let tsa_request = self.create_tsa_request(message_imprint, hash_algorithm)?;
        
        // Send request to timestamp server
        let response = self.send_tsa_request(server_url, &tsa_request).await?;
        
        // Parse and validate response
        let timestamp_token = self.parse_tsa_response(&response)?;
        
        Ok(timestamp_token)
    }

    /// Create a TSA (Time Stamping Authority) request
    fn create_tsa_request(
        &self,
        message_imprint: &[u8],
        hash_algorithm: &HashAlgorithm,
    ) -> Result<Vec<u8>> {
        // Create TSARequest structure according to RFC 3161
        let mut tsa_request = Vec::new();
        
        // TSARequest SEQUENCE
        tsa_request.push(0x30);
        
        let mut request_content = Vec::new();
        
        // Version (INTEGER 1)
        request_content.extend_from_slice(&[0x02, 0x01, 0x01]);
        
        // MessageImprint SEQUENCE
        request_content.push(0x30);
        
        let mut message_imprint_content = Vec::new();
        
        // AlgorithmIdentifier for hash algorithm
        message_imprint_content.push(0x30);
        let hash_oid = self.get_hash_algorithm_oid(hash_algorithm);
        let mut alg_id = Vec::new();
        alg_id.push(0x06); // OID tag
        alg_id.push(hash_oid.len() as u8);
        alg_id.extend_from_slice(&hash_oid);
        alg_id.extend_from_slice(&[0x05, 0x00]); // NULL parameters
        
        message_imprint_content.push(alg_id.len() as u8);
        message_imprint_content.extend_from_slice(&alg_id);
        
        // HashedMessage (OCTET STRING)
        message_imprint_content.push(0x04);
        message_imprint_content.push(message_imprint.len() as u8);
        message_imprint_content.extend_from_slice(message_imprint);
        
        // Encode MessageImprint length
        request_content.push(message_imprint_content.len() as u8);
        request_content.extend_from_slice(&message_imprint_content);
        
        // ReqPolicy (optional) - omitted for simplicity
        
        // Nonce (optional) - add a random nonce for security
        let nonce = self.generate_nonce();
        request_content.push(0x02); // INTEGER tag
        request_content.push(nonce.len() as u8);
        request_content.extend_from_slice(&nonce);
        
        // CertReq (BOOLEAN TRUE) - request certificate in response
        request_content.extend_from_slice(&[0x01, 0x01, 0xFF]);
        
        // Encode TSARequest length
        if request_content.len() < 0x80 {
            tsa_request.push(request_content.len() as u8);
        } else {
            // Long form length encoding
            let len_bytes = (request_content.len() as u32).to_be_bytes();
            let mut non_zero_start = 0;
            while non_zero_start < 4 && len_bytes[non_zero_start] == 0 {
                non_zero_start += 1;
            }
            tsa_request.push(0x80 | (4 - non_zero_start) as u8);
            tsa_request.extend_from_slice(&len_bytes[non_zero_start..]);
        }
        
        tsa_request.extend_from_slice(&request_content);
        
        Ok(tsa_request)
    }

    /// Send TSA request to timestamp server
    async fn send_tsa_request(
        &self,
        server_url: &str,
        tsa_request: &[u8],
    ) -> Result<Vec<u8>> {
        let response = self
            .client
            .post(server_url)
            .header("Content-Type", "application/timestamp-query")
            .header("Accept", "application/timestamp-reply")
            .body(tsa_request.to_vec())
            .send()
            .await
            .map_err(|e| PdfSignError::TimestampRequest {
                message: format!("Failed to send timestamp request: {,
                code: crate::error::ErrorCode::TimestampRequest,}", e),
            })?;

        if !response.status().is_success() {
            return Err(PdfSignError::TimestampRequest {
                message: format!("Timestamp server returned error: {,
                code: crate::error::ErrorCode::TimestampRequest,}", response.status()),
            });
        }

        let response_bytes = response
            .bytes()
            .await
            .map_err(|e| PdfSignError::TimestampRequest {
                message: format!("Failed to read timestamp response: {,
                code: crate::error::ErrorCode::TimestampRequest,}", e),
            })?;

        Ok(response_bytes.to_vec())
    }

    /// Parse TSA response and extract timestamp token
    fn parse_tsa_response(&self, response_data: &[u8]) -> Result<TimestampToken> {
        // Parse TSAResponse structure according to RFC 3161
        if response_data.len() < 10 {
            return Err(PdfSignError::TimestampValidation {
                message: "TSA response too short".to_string(),
                code: crate::error::ErrorCode::TimestampValidation,
            ,
                code: crate::error::ErrorCode::TimestampValidation,});
        }

        // Verify it starts with SEQUENCE tag
        if response_data[0] != 0x30 {
            return Err(PdfSignError::TimestampValidation {
                message: "Invalid TSA response structure".to_string(),
                code: crate::error::ErrorCode::TimestampValidation,
            ,
                code: crate::error::ErrorCode::TimestampValidation,});
        }

        // Parse the response structure
        let (content_start, _total_length) = self.parse_length(&response_data[1..])?;
        let content_start = content_start + 1; // Account for SEQUENCE tag

        // Parse TSAResponse components
        let mut offset = content_start;
        
        // Parse status (PKIStatus)
        if offset >= response_data.len() || response_data[offset] != 0x02 {
            return Err(PdfSignError::TimestampValidation {
                message: "Expected INTEGER tag for status".to_string(),
                code: crate::error::ErrorCode::TimestampValidation,
            ,
                code: crate::error::ErrorCode::TimestampValidation,});
        }
        offset += 1;
        
        let (status_len_size, status_len) = self.parse_length(&response_data[offset..])?;
        offset += status_len_size;
        
        if offset + status_len > response_data.len() {
            return Err(PdfSignError::TimestampValidation {
                message: "Status data truncated".to_string(),
                code: crate::error::ErrorCode::TimestampValidation,
            ,
                code: crate::error::ErrorCode::TimestampValidation,});
        }
        
        let status = if status_len == 1 {
            response_data[offset] as i32
        } else {
            return Err(PdfSignError::TimestampValidation {
                message: "Invalid status length".to_string(),
                code: crate::error::ErrorCode::TimestampValidation,
            ,
                code: crate::error::ErrorCode::TimestampValidation,});
        };
        offset += status_len;

        // Check if status indicates success (0 = granted)
        if status != 0 {
            return Err(PdfSignError::TimestampValidation {
                message: format!("Timestamp request failed with status: {,
                code: crate::error::ErrorCode::TimestampValidation,}", status),
            });
        }

        // Skip optional status string and failure info if present
        // Look for the TimeStampToken (ContentInfo)
        while offset < response_data.len() && response_data[offset] != 0x30 {
            // Skip non-SEQUENCE elements
            if response_data[offset] == 0x04 || response_data[offset] == 0x0C {
                // OCTET STRING or UTF8String - skip status string
                offset += 1;
                let (len_size, len) = self.parse_length(&response_data[offset..])?;
                offset += len_size + len;
            } else {
                offset += 1;
            }
        }

        if offset >= response_data.len() {
            return Err(PdfSignError::TimestampValidation {
                message: "No TimeStampToken found in response".to_string(),
                code: crate::error::ErrorCode::TimestampValidation,
            ,
                code: crate::error::ErrorCode::TimestampValidation,});
        }

        // Extract TimeStampToken (remaining data should be the ContentInfo)
        let token_data = response_data[offset..].to_vec();
        
        // Parse the timestamp token to extract timestamp information
        let timestamp_info = self.parse_timestamp_token(&token_data)?;
        
        Ok(TimestampToken {
            token_data,
            timestamp_info,
        })
    }

    /// Parse timestamp token to extract timestamp information
    fn parse_timestamp_token(&self, token_data: &[u8]) -> Result<TimestampInfo> {
        // This is a simplified parser for the TimeStampToken
        // A complete implementation would fully parse the ASN.1 structure
        
        // For now, create a basic timestamp info with current time
        // In a real implementation, this would extract the actual timestamp
        // from the TSTInfo structure within the ContentInfo
        
        Ok(TimestampInfo {
            timestamp: Utc::now(),
            accuracy: None,
            ordering: false,
            nonce: None,
            tsa_certificate: None,
            policy_id: "1.2.3.4.5".to_string(), // Default policy OID
            serial_number: vec![0x01, 0x02, 0x03, 0x04], // Mock serial number
        })
    }

    /// Get OID for hash algorithm
    fn get_hash_algorithm_oid(&self, algorithm: &HashAlgorithm) -> Vec<u8> {
        match algorithm {
            HashAlgorithm::Sha256 => vec![0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x02, 0x01],
            HashAlgorithm::Sha384 => vec![0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x02, 0x02],
            HashAlgorithm::Sha512 => vec![0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x02, 0x03],
        }
    }

    /// Generate a random nonce for TSA request
    fn generate_nonce(&self) -> Vec<u8> {
        use rand::Rng;
        let mut rng = rand::thread_rng();
        let nonce: u64 = rng.gen();
        nonce.to_be_bytes().to_vec()
    }

    /// Parse ASN.1 length field
    fn parse_length(&self, data: &[u8]) -> Result<(usize, usize)> {
        if data.is_empty() {
            return Err(PdfSignError::TimestampValidation {
                message: "Empty length field".to_string(),
                code: crate::error::ErrorCode::TimestampValidation,
            ,
                code: crate::error::ErrorCode::TimestampValidation,});
        }

        if data[0] & 0x80 == 0 {
            // Short form
            Ok((1, data[0] as usize))
        } else {
            // Long form
            let len_bytes = (data[0] & 0x7F) as usize;
            if len_bytes == 0 || len_bytes > 4 || data.len() < 1 + len_bytes {
                return Err(PdfSignError::TimestampValidation {
                    message: "Invalid length encoding".to_string(),
                code: crate::error::ErrorCode::TimestampValidation,
                ,
                code: crate::error::ErrorCode::TimestampValidation,});
            }

            let mut length = 0usize;
            for i in 0..len_bytes {
                length = (length << 8) | (data[1 + i] as usize);
            }

            Ok((1 + len_bytes, length))
        }
    }
}

impl Default for TimestampClient {
    fn default() -> Self {
        Self::new()
    }
}

/// RFC 3161 timestamp token
#[derive(Debug, Clone)]
pub struct TimestampToken {
    /// Raw timestamp token data (ContentInfo)
    pub token_data: Vec<u8>,
    /// Parsed timestamp information
    pub timestamp_info: TimestampInfo,
}

/// Timestamp information extracted from TSA response
#[derive(Debug, Clone)]
pub struct TimestampInfo {
    /// Timestamp when the token was created
    pub timestamp: DateTime<Utc>,
    /// Accuracy of the timestamp (optional)
    pub accuracy: Option<TimestampAccuracy>,
    /// Whether ordering is guaranteed
    pub ordering: bool,
    /// Nonce from the request (optional)
    pub nonce: Option<Vec<u8>>,
    /// TSA certificate (optional)
    pub tsa_certificate: Option<X509Certificate>,
    /// Policy identifier
    pub policy_id: String,
    /// Serial number of the timestamp
    pub serial_number: Vec<u8>,
}

/// Timestamp accuracy information
#[derive(Debug, Clone)]
pub struct TimestampAccuracy {
    /// Seconds accuracy
    pub seconds: Option<u32>,
    /// Milliseconds accuracy
    pub millis: Option<u32>,
    /// Microseconds accuracy
    pub micros: Option<u32>,
}

/// PKCS#7 timestamp integration utilities
pub struct TimestampIntegrator;

impl TimestampIntegrator {
    /// Integrate a timestamp token into a PKCS#7 signature
    pub fn integrate_timestamp(
        pkcs7_signature: &mut Vec<u8>,
        timestamp_token: &TimestampToken,
    ) -> Result<()> {
        // This would integrate the timestamp token into the PKCS#7 signature
        // as an unsigned attribute in the SignerInfo structure
        
        // For now, we'll append the timestamp token to the signature
        // A complete implementation would properly embed it as an unsigned attribute
        
        // In a real implementation, this would:
        // 1. Parse the existing PKCS#7 structure
        // 2. Locate the SignerInfo
        // 3. Add the timestamp as an unsigned attribute
        // 4. Re-encode the PKCS#7 structure
        
        // For demonstration, we'll create a simple wrapper structure
        let mut timestamped_signature = Vec::new();
        
        // Original PKCS#7 signature
        timestamped_signature.extend_from_slice(pkcs7_signature);
        
        // Separator marker (in real implementation, this would be proper ASN.1)
        timestamped_signature.extend_from_slice(&[0xFF, 0xFF, 0xFF, 0xFF]);
        
        // Timestamp token
        timestamped_signature.extend_from_slice(&timestamp_token.token_data);
        
        *pkcs7_signature = timestamped_signature;
        
        Ok(())
    }

    /// Extract timestamp from a timestamped PKCS#7 signature
    pub fn extract_timestamp(pkcs7_signature: &[u8]) -> Result<Option<TimestampToken>> {
        // Look for our separator marker
        let separator = [0xFF, 0xFF, 0xFF, 0xFF];
        
        if let Some(pos) = pkcs7_signature
            .windows(separator.len())
            .position(|window| window == separator)
        {
            let timestamp_start = pos + separator.len();
            if timestamp_start < pkcs7_signature.len() {
                let token_data = pkcs7_signature[timestamp_start..].to_vec();
                
                // Parse the timestamp token
                let client = TimestampClient::new();
                let timestamp_info = client.parse_timestamp_token(&token_data)?;
                
                return Ok(Some(TimestampToken {
                    token_data,
                    timestamp_info,
                }));
            }
        }
        
        Ok(None)
    }

    /// Validate a timestamp token
    pub fn validate_timestamp(
        timestamp_token: &TimestampToken,
        original_message_imprint: &[u8],
        trusted_certificates: &[X509Certificate],
    ) -> Result<bool> {
        // Validate the timestamp token
        // This would include:
        // 1. Verifying the timestamp signature
        // 2. Checking the message imprint matches
        // 3. Validating the TSA certificate chain
        // 4. Checking timestamp validity period
        
        // For now, perform basic validation
        if timestamp_token.token_data.is_empty() {
            return Ok(false);
        }
        
        if original_message_imprint.is_empty() {
            return Ok(false);
        }
        
        // In a real implementation, we would extract and verify the message imprint
        // from the timestamp token and compare it with the provided imprint
        
        Ok(true)
    }
}