//! PDF document structure definitions and utilities

/// PDF object types and structure representations
/// This module will contain the internal PDF object model

use std::collections::HashMap;

/// PDF object reference
#[derive(Debug, Clone, PartialEq)]
pub struct PdfObjectRef {
    pub object_number: u32,
    pub generation: u16,
}

/// PDF object types
#[derive(Debug, Clone)]
pub enum PdfObject {
    Null,
    Boolean(bool),
    Integer(i64),
    Real(f64),
    String(Vec<u8>),
    Name(String),
    Array(Vec<PdfObject>),
    Dictionary(HashMap<String, PdfObject>),
    Stream {
        dictionary: HashMap<String, PdfObject>,
        data: Vec<u8>,
    },
    Reference(PdfObjectRef),
}

/// PDF document structure
#[derive(Debug)]
pub struct PdfDocumentStructure {
    /// PDF version
    pub version: String,
    /// Cross-reference table
    pub xref_table: HashMap<u32, XrefEntry>,
    /// Document trailer
    pub trailer: HashMap<String, PdfObject>,
    /// Document objects
    pub objects: HashMap<u32, PdfObject>,
}

/// Cross-reference table entry
#[derive(Debug, Clone)]
pub struct XrefEntry {
    pub offset: u64,
    pub generation: u16,
    pub in_use: bool,
}

impl PdfDocumentStructure {
    pub fn new(version: String) -> Self {
        Self {
            version,
            xref_table: HashMap::new(),
            trailer: HashMap::new(),
            objects: HashMap::new(),
        }
    }

    pub fn get_object(&self, object_ref: &PdfObjectRef) -> Option<&PdfObject> {
        self.objects.get(&object_ref.object_number)
    }

    pub fn add_object(&mut self, object_number: u32, object: PdfObject) {
        self.objects.insert(object_number, object);
    }
}