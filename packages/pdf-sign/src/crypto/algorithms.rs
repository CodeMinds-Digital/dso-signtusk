//! Cryptographic algorithm implementations

use crate::{
    error::{Result},
    types::{HashAlgorithm, SignatureAlgorithm},
};

/// Hash algorithm utilities
pub struct HashAlgorithms;

impl HashAlgorithms {
    /// Get the algorithm identifier string
    pub fn get_algorithm_id(algorithm: &HashAlgorithm) -> &'static str {
        match algorithm {
            HashAlgorithm::Sha256 => "SHA-256",
            HashAlgorithm::Sha384 => "SHA-384",
            HashAlgorithm::Sha512 => "SHA-512",
        }
    }

    /// Get the hash output size in bytes
    pub fn get_hash_size(algorithm: &HashAlgorithm) -> usize {
        match algorithm {
            HashAlgorithm::Sha256 => 32,
            HashAlgorithm::Sha384 => 48,
            HashAlgorithm::Sha512 => 64,
        }
    }

    /// Validate hash algorithm support
    pub fn is_supported(algorithm: &HashAlgorithm) -> bool {
        matches!(
            algorithm,
            HashAlgorithm::Sha256 | HashAlgorithm::Sha384 | HashAlgorithm::Sha512
        )
    }
}

/// Signature algorithm utilities
pub struct SignatureAlgorithms;

impl SignatureAlgorithms {
    /// Get the algorithm identifier string
    pub fn get_algorithm_id(algorithm: &SignatureAlgorithm) -> &'static str {
        match algorithm {
            SignatureAlgorithm::RsaPkcs1Sha256 => "RSA-PKCS1-SHA256",
            SignatureAlgorithm::RsaPkcs1Sha384 => "RSA-PKCS1-SHA384",
            SignatureAlgorithm::RsaPkcs1Sha512 => "RSA-PKCS1-SHA512",
            SignatureAlgorithm::RsaPss => "RSA-PSS",
            SignatureAlgorithm::EcdsaP256Sha256 => "ECDSA-P256-SHA256",
            SignatureAlgorithm::EcdsaP384Sha384 => "ECDSA-P384-SHA384",
            SignatureAlgorithm::EcdsaP521Sha512 => "ECDSA-P521-SHA512",
        }
    }

    /// Validate signature algorithm support
    pub fn is_supported(algorithm: &SignatureAlgorithm) -> bool {
        matches!(
            algorithm,
            SignatureAlgorithm::RsaPkcs1Sha256
                | SignatureAlgorithm::RsaPkcs1Sha384
                | SignatureAlgorithm::RsaPkcs1Sha512
                | SignatureAlgorithm::RsaPss
                | SignatureAlgorithm::EcdsaP256Sha256
                | SignatureAlgorithm::EcdsaP384Sha384
                | SignatureAlgorithm::EcdsaP521Sha512
        )
    }

    /// Get compatible hash algorithm for signature algorithm
    pub fn get_compatible_hash(algorithm: &SignatureAlgorithm) -> Result<HashAlgorithm> {
        match algorithm {
            SignatureAlgorithm::RsaPkcs1Sha256 | SignatureAlgorithm::EcdsaP256Sha256 => Ok(HashAlgorithm::Sha256),
            SignatureAlgorithm::RsaPkcs1Sha384 | SignatureAlgorithm::EcdsaP384Sha384 => Ok(HashAlgorithm::Sha384),
            SignatureAlgorithm::RsaPkcs1Sha512 | SignatureAlgorithm::EcdsaP521Sha512 => Ok(HashAlgorithm::Sha512),
            SignatureAlgorithm::RsaPss => Ok(HashAlgorithm::Sha256), // Default for PSS
        }
    }
}