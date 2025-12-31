mod errors;
// mod gcloud_signer; // Commented out due to missing dependencies

use napi::bindgen_prelude::*;
use napi_derive::napi;

// use chrono; // Commented out due to unused import
// use cryptographic_message_syntax::{asn1::rfc5652, Bytes, Oid, SignedDataBuilder, SignerBuilder}; // Commented out due to missing dependencies
// use errors::CmsError; // Commented out due to unused import
// use gcloud_signer::GCloudSigner; // Commented out due to missing dependencies
// use p12::PFX; // Commented out due to unused import
// use pem::{encode, Pem}; // Commented out due to unused imports
// use x509_certificate::{CapturedX509Certificate, InMemorySigningKeyPair}; // Commented out due to unused imports

#[napi(object)]
#[derive(Default)]
pub struct SignWithPrivateKeyOptions {
  pub content: Buffer,
  pub cert: Buffer,
  pub private_key: Buffer,
  pub signing_time: Option<String>,
  pub timestamp_server: Option<String>,
}

/// Sign data with the private key.
#[napi]
pub fn sign_with_private_key(_options: SignWithPrivateKeyOptions) -> Result<Buffer> {
  // TODO: Implement when cryptographic_message_syntax dependency is available
  Err(napi::Error::new(napi::Status::GenericFailure, "Function temporarily disabled due to missing dependencies"))
}

#[napi(object)]
#[derive(Default)]
pub struct SignWithP12Options {
  pub content: Buffer,
  pub cert: Buffer,
  pub password: Option<String>,
  pub signing_time: Option<String>,
  pub timestamp_server: Option<String>,
}

/// Sign data with a P12 container.
#[napi]
pub fn sign_with_p12(_options: SignWithP12Options) -> Result<Buffer> {
  // TODO: Implement when cryptographic_message_syntax dependency is available
  Err(napi::Error::new(napi::Status::GenericFailure, "Function temporarily disabled due to missing dependencies"))
}

#[napi(object)]
#[derive(Default)]
pub struct SignWithGCloudOptions {
  pub content: Buffer,
  pub cert: Buffer,
  pub key_path: String,
  pub signing_time: Option<String>,
  pub timestamp_server: Option<String>,
}

/// Sign data with Google Cloud.
#[napi(js_name = "signWithGCloud")]
pub fn sign_with_gcloud(_options: SignWithGCloudOptions) -> Result<Buffer> {
  // TODO: Implement when cryptographic_message_syntax dependency is available
  Err(napi::Error::new(napi::Status::GenericFailure, "Function temporarily disabled due to missing dependencies"))
}

/*
// Commented out due to missing cryptographic_message_syntax dependency
pub struct CreateSignedDataOptions<'a> {
  pub content: Buffer,
  pub signer: SignerBuilder<'a>,
  pub signing_time: Option<String>,
  pub certs: Option<Vec<CapturedX509Certificate>>,
}

/// Helper function to create signed data.
fn create_signed_data<'a>(options: CreateSignedDataOptions<'a>) -> Result<Buffer> {
  let CreateSignedDataOptions {
    content,
    signer,
    signing_time,
    certs,
  } = options;

  let signing_time = signing_time
    .and_then(|time| time.parse::<chrono::DateTime<chrono::Utc>>().ok())
    .unwrap_or(chrono::Utc::now());

  let mut builder = SignedDataBuilder::default()
    .content_type(Oid(Bytes::from(rfc5652::OID_ID_DATA.as_ref())))
    .content_external(content.to_vec())
    .signing_time(signing_time.into())
    .signer(signer);

  if let Some(certs) = certs {
    builder = builder.certificates(certs.into_iter());
  }

  builder
    .build_der()
    .map_err(|_| CmsError::BuildSignedDataError.into())
    .map(|data| Buffer::from(data))
}
*/
