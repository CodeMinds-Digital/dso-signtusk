//! Signature appearance and visual representation

use crate::{
    error::{PdfSignError, Result},
    types::*,
};
use chrono::{DateTime, Utc};
use std::collections::HashMap;

/// Signature appearance renderer that handles custom signature appearance with text and images
pub struct SignatureAppearanceRenderer {
    /// Default font size for signature text
    default_font_size: f64,
    /// Default margin for signature content
    default_margin: f64,
}

impl SignatureAppearanceRenderer {
    pub fn new() -> Self {
        Self {
            default_font_size: 12.0,
            default_margin: 5.0,
        }
    }

    /// Create a new renderer with custom configuration
    pub fn with_config(font_size: f64, margin: f64) -> Self {
        Self {
            default_font_size: font_size,
            default_margin: margin,
        }
    }

    /// Render signature appearance into PDF form XObject
    /// Handles custom signature appearance with text and images, positioning and scaling
    pub async fn render_appearance(
        &self,
        appearance: &SignatureAppearance,
        bounds: &Rectangle,
    ) -> Result<Vec<u8>> {
        if !appearance.visible {
            // Return empty appearance for invisible signatures
            return Ok(Vec::new());
        }

        // Create PDF form XObject for the signature appearance
        let mut form_content = Vec::new();
        
        // Start with graphics state
        form_content.extend_from_slice(b"q\n"); // Save graphics state
        
        // Set up coordinate system and clipping
        form_content.extend_from_slice(
            format!("0 0 {} {} re W n\n", bounds.width, bounds.height).as_bytes()
        );
        
        // Render background if specified
        if let Some(bg_color) = &appearance.background_color {
            self.render_background(&mut form_content, bounds, bg_color)?;
        }
        
        // Render border if specified
        if let Some(border_color) = &appearance.border_color {
            self.render_border(&mut form_content, bounds, border_color)?;
        }
        
        // Calculate content area (inside margins)
        let content_bounds = Rectangle {
            x: self.default_margin,
            y: self.default_margin,
            width: bounds.width - (2.0 * self.default_margin),
            height: bounds.height - (2.0 * self.default_margin),
        };
        
        // Render image if provided
        let mut text_area = content_bounds.clone();
        if let Some(image_data) = &appearance.image {
            let image_height = self.render_image(&mut form_content, image_data, &content_bounds)?;
            // Adjust text area to be below the image
            text_area.y += image_height + self.default_margin;
            text_area.height -= image_height + self.default_margin;
        }
        
        // Render text if provided
        if let Some(text) = &appearance.text {
            self.render_text(&mut form_content, text, &text_area)?;
        }
        
        // Restore graphics state
        form_content.extend_from_slice(b"Q\n"); // Restore graphics state
        
        // Create complete PDF form XObject
        self.create_form_xobject(&form_content, bounds)
    }

    /// Render background color
    fn render_background(
        &self,
        content: &mut Vec<u8>,
        bounds: &Rectangle,
        color: &Color,
    ) -> Result<()> {
        // Set fill color (RGB)
        let color_str = format!(
            "{:.3} {:.3} {:.3} rg\n",
            color.r as f64 / 255.0,
            color.g as f64 / 255.0,
            color.b as f64 / 255.0
        );
        content.extend_from_slice(color_str.as_bytes());
        
        // Fill rectangle
        let rect_str = format!(
            "0 0 {} {} re f\n",
            bounds.width,
            bounds.height
        );
        content.extend_from_slice(rect_str.as_bytes());
        
        Ok(())
    }

    /// Render border
    fn render_border(
        &self,
        content: &mut Vec<u8>,
        bounds: &Rectangle,
        color: &Color,
    ) -> Result<()> {
        // Set stroke color (RGB)
        let color_str = format!(
            "{:.3} {:.3} {:.3} RG\n",
            color.r as f64 / 255.0,
            color.g as f64 / 255.0,
            color.b as f64 / 255.0
        );
        content.extend_from_slice(color_str.as_bytes());
        
        // Set line width
        content.extend_from_slice(b"1 w\n");
        
        // Draw rectangle border
        let rect_str = format!(
            "0.5 0.5 {} {} re S\n",
            bounds.width - 1.0,
            bounds.height - 1.0
        );
        content.extend_from_slice(rect_str.as_bytes());
        
        Ok(())
    }

    /// Render image with proper scaling
    fn render_image(
        &self,
        content: &mut Vec<u8>,
        image_data: &[u8],
        bounds: &Rectangle,
    ) -> Result<f64> {
        // For now, we'll create a placeholder for image rendering
        // In a full implementation, this would decode the image and embed it properly
        
        // Calculate image area (top portion of the signature)
        let image_height = (bounds.height * 0.4).min(40.0); // Max 40% of height or 40 points
        
        // Create a simple placeholder rectangle for the image
        content.extend_from_slice(b"0.9 0.9 0.9 rg\n"); // Light gray fill
        let image_rect = format!(
            "{} {} {} {} re f\n",
            bounds.x,
            bounds.height - image_height,
            bounds.width,
            image_height
        );
        content.extend_from_slice(image_rect.as_bytes());
        
        // Add image placeholder text
        content.extend_from_slice(b"0 0 0 rg\n"); // Black text
        content.extend_from_slice(b"BT\n");
        content.extend_from_slice(b"/F1 8 Tf\n");
        let text_pos = format!(
            "{} {} Td\n",
            bounds.x + 5.0,
            bounds.height - image_height + 5.0
        );
        content.extend_from_slice(text_pos.as_bytes());
        content.extend_from_slice(format!("({} bytes) Tj\n", image_data.len()).as_bytes());
        content.extend_from_slice(b"ET\n");
        
        Ok(image_height)
    }

    /// Render text with proper positioning and scaling
    fn render_text(
        &self,
        content: &mut Vec<u8>,
        text: &str,
        bounds: &Rectangle,
    ) -> Result<()> {
        // Set text color to black
        content.extend_from_slice(b"0 0 0 rg\n");
        
        // Begin text object
        content.extend_from_slice(b"BT\n");
        
        // Set font and size (using built-in Helvetica)
        let font_size = self.calculate_font_size(text, bounds);
        content.extend_from_slice(format!("/F1 {} Tf\n", font_size).as_bytes());
        
        // Calculate text positioning (center vertically, left-align horizontally)
        let text_x = bounds.x;
        let text_y = bounds.y + (bounds.height - font_size) / 2.0;
        
        // Set text position
        content.extend_from_slice(format!("{} {} Td\n", text_x, text_y).as_bytes());
        
        // Split text into lines if necessary
        let lines = self.split_text_to_fit(text, bounds.width, font_size);
        
        for (i, line) in lines.iter().enumerate() {
            if i > 0 {
                // Move to next line
                content.extend_from_slice(format!("0 -{} Td\n", font_size * 1.2).as_bytes());
            }
            
            // Escape special characters in PDF strings
            let escaped_line = self.escape_pdf_string(line);
            content.extend_from_slice(format!("({}) Tj\n", escaped_line).as_bytes());
        }
        
        // End text object
        content.extend_from_slice(b"ET\n");
        
        Ok(())
    }

    /// Calculate appropriate font size for the given text and bounds
    fn calculate_font_size(&self, text: &str, bounds: &Rectangle) -> f64 {
        // Estimate character width (rough approximation for Helvetica)
        let avg_char_width = self.default_font_size * 0.6;
        let max_chars_per_line = (bounds.width / avg_char_width) as usize;
        
        if text.len() <= max_chars_per_line {
            // Text fits on one line, use default size or scale down if needed
            let required_width = text.len() as f64 * avg_char_width;
            if required_width <= bounds.width {
                self.default_font_size
            } else {
                // Scale down to fit
                (bounds.width / text.len() as f64) / 0.6
            }
        } else {
            // Multi-line text, use smaller font
            (self.default_font_size * 0.8).max(8.0)
        }
    }

    /// Split text into lines that fit within the given width
    fn split_text_to_fit(&self, text: &str, width: f64, font_size: f64) -> Vec<String> {
        let avg_char_width = font_size * 0.6;
        let max_chars_per_line = (width / avg_char_width) as usize;
        
        if max_chars_per_line == 0 {
            return vec![text.to_string()];
        }
        
        let mut lines = Vec::new();
        let words: Vec<&str> = text.split_whitespace().collect();
        let mut current_line = String::new();
        
        for word in words {
            let test_line = if current_line.is_empty() {
                word.to_string()
            } else {
                format!("{} {}", current_line, word)
            };
            
            if test_line.len() <= max_chars_per_line {
                current_line = test_line;
            } else {
                if !current_line.is_empty() {
                    lines.push(current_line);
                }
                current_line = word.to_string();
            }
        }
        
        if !current_line.is_empty() {
            lines.push(current_line);
        }
        
        if lines.is_empty() {
            lines.push(text.to_string());
        }
        
        lines
    }

    /// Escape special characters for PDF string literals
    fn escape_pdf_string(&self, text: &str) -> String {
        text.replace('\\', "\\\\")
            .replace('(', "\\(")
            .replace(')', "\\)")
            .replace('\r', "\\r")
            .replace('\n', "\\n")
            .replace('\t', "\\t")
    }

    /// Create a complete PDF form XObject from the content
    fn create_form_xobject(&self, content: &[u8], bounds: &Rectangle) -> Result<Vec<u8>> {
        let mut xobject = Vec::new();
        
        // Form XObject dictionary
        xobject.extend_from_slice(b"<<\n");
        xobject.extend_from_slice(b"/Type /XObject\n");
        xobject.extend_from_slice(b"/Subtype /Form\n");
        xobject.extend_from_slice(
            format!("/BBox [0 0 {} {}]\n", bounds.width, bounds.height).as_bytes()
        );
        xobject.extend_from_slice(b"/Resources <<\n");
        xobject.extend_from_slice(b"  /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >>\n");
        xobject.extend_from_slice(b">>\n");
        xobject.extend_from_slice(format!("/Length {}\n", content.len()).as_bytes());
        xobject.extend_from_slice(b">>\n");
        xobject.extend_from_slice(b"stream\n");
        xobject.extend_from_slice(content);
        xobject.extend_from_slice(b"\nendstream");
        
        Ok(xobject)
    }

    /// Create default appearance with comprehensive metadata
    pub fn create_default_appearance(&self, signer_name: &str) -> SignatureAppearance {
        SignatureAppearance {
            visible: true,
            page: None,
            bounds: None,
            text: Some(format!("Digitally signed by: {}", signer_name)),
            image: None,
            background_color: Some(Color { r: 255, g: 255, b: 255 }),
            border_color: Some(Color { r: 0, g: 0, b: 0 }),
        }
    }

    /// Create appearance with comprehensive metadata embedding
    /// Implements Requirements 6.2: embed signing time, signer name, and reason for signing
    pub fn create_metadata_rich_appearance(
        &self,
        signer_name: &str,
        signing_time: DateTime<Utc>,
        reason: Option<&str>,
        location: Option<&str>,
        contact_info: Option<&str>,
    ) -> SignatureAppearance {
        let mut text_parts = vec![format!("Digitally signed by: {}", signer_name)];
        
        // Add signing time (always included per Requirements 6.2)
        text_parts.push(format!("Date: {}", signing_time.format("%Y-%m-%d %H:%M:%S UTC")));
        
        // Add reason if provided (per Requirements 6.2)
        if let Some(reason) = reason {
            text_parts.push(format!("Reason: {}", reason));
        }
        
        // Add location if provided
        if let Some(location) = location {
            text_parts.push(format!("Location: {}", location));
        }
        
        // Add contact info if provided
        if let Some(contact) = contact_info {
            text_parts.push(format!("Contact: {}", contact));
        }
        
        SignatureAppearance {
            visible: true,
            page: None,
            bounds: None,
            text: Some(text_parts.join("\n")),
            image: None,
            background_color: Some(Color { r: 250, g: 250, b: 250 }),
            border_color: Some(Color { r: 100, g: 100, b: 100 }),
        }
    }

    /// Apply field positioning constraints while respecting pre-defined field dimensions
    /// Implements Requirements 6.4: respect existing field dimensions and positioning
    pub fn apply_field_positioning_respect(
        &self,
        appearance: &SignatureAppearance,
        field_bounds: &Rectangle,
        preserve_field_dimensions: bool,
    ) -> Result<SignatureAppearance> {
        let mut constrained_appearance = appearance.clone();
        
        if preserve_field_dimensions {
            // Respect pre-defined field dimensions exactly (Requirements 6.4)
            constrained_appearance.bounds = Some(field_bounds.clone());
            
            // Validate that the field dimensions are usable
            self.validate_field_dimensions_for_content(field_bounds, &constrained_appearance)?;
            
            // Adjust content to fit within pre-defined field constraints
            constrained_appearance = self.adjust_content_for_field_constraints(
                constrained_appearance,
                field_bounds,
            )?;
        } else {
            // Calculate optimal bounds but respect field positioning
            let optimal_bounds = self.calculate_optimal_bounds_respecting_field(
                &constrained_appearance,
                field_bounds,
            )?;
            constrained_appearance.bounds = Some(optimal_bounds);
        }
        
        Ok(constrained_appearance)
    }

    /// Validate that pre-defined field dimensions can accommodate signature content
    fn validate_field_dimensions_for_content(
        &self,
        field_bounds: &Rectangle,
        appearance: &SignatureAppearance,
    ) -> Result<()> {
        // Check minimum dimensions for readability
        if field_bounds.width < 50.0 || field_bounds.height < 20.0 {
            return Err(PdfSignError::SignatureField {
                message: format!(
                    "Pre-defined field dimensions ({,
                code: crate::error::ErrorCode::SignatureField,}x{}) are too small for signature content",
                    field_bounds.width, field_bounds.height
                ),
                code: crate::error::ErrorCode::SignatureField,
            });
        }
        
        // Estimate content requirements
        if let Some(text) = &appearance.text {
            let lines = text.lines().count();
            let min_height_needed = (lines as f64 * self.default_font_size * 1.2) + (2.0 * self.default_margin);
            
            if field_bounds.height < min_height_needed {
                return Err(PdfSignError::SignatureField {
                    message: format!(
                        "Pre-defined field height ({,
                code: crate::error::ErrorCode::SignatureField,}) is insufficient for text content (needs {})",
                        field_bounds.height, min_height_needed
                    ),
                    code: crate::error::ErrorCode::SignatureField,
                });
            }
        }
        
        // Check for image space if image is present
        if appearance.image.is_some() {
            let min_image_space = 30.0; // Minimum space for image
            if field_bounds.height < min_image_space + (2.0 * self.default_margin) {
                return Err(PdfSignError::SignatureField {
                    message: format!(
                        "Pre-defined field height ({,
                code: crate::error::ErrorCode::SignatureField,}) is insufficient for image content",
                        field_bounds.height
                    ),
                    code: crate::error::ErrorCode::SignatureField,
                });
            }
        }
        
        Ok(())
    }

    /// Adjust signature content to fit within pre-defined field constraints
    fn adjust_content_for_field_constraints(
        &self,
        mut appearance: SignatureAppearance,
        field_bounds: &Rectangle,
    ) -> Result<SignatureAppearance> {
        // Adjust text content for small fields
        if let Some(text) = &appearance.text {
            let available_width = field_bounds.width - (2.0 * self.default_margin);
            let available_height = field_bounds.height - (2.0 * self.default_margin);
            
            // Calculate maximum lines that can fit
            let line_height = self.default_font_size * 1.2;
            let max_lines = (available_height / line_height).floor() as usize;
            
            if max_lines == 0 {
                // Field too small for any text
                appearance.text = None;
            } else {
                let lines: Vec<&str> = text.lines().collect();
                if lines.len() > max_lines {
                    // Truncate text to fit
                    let truncated_lines = &lines[..max_lines.min(lines.len())];
                    let mut truncated_text = truncated_lines.join("\n");
                    
                    // Add ellipsis if truncated
                    if lines.len() > max_lines {
                        if let Some(last_line) = truncated_lines.last() {
                            if last_line.len() > 3 {
                                truncated_text = format!("{}...", &truncated_text[..truncated_text.len()-3]);
                            }
                        }
                    }
                    
                    appearance.text = Some(truncated_text);
                }
                
                // Adjust font size if text is still too wide
                appearance = self.adjust_font_size_for_width(appearance, available_width)?;
            }
        }
        
        // Remove image if field is too small
        if appearance.image.is_some() {
            let min_image_height = 25.0;
            let remaining_height = field_bounds.height - (2.0 * self.default_margin);
            
            if let Some(text) = &appearance.text {
                let text_lines = text.lines().count();
                let text_height = text_lines as f64 * self.default_font_size * 1.2;
                
                if remaining_height < text_height + min_image_height {
                    // Not enough space for both text and image
                    appearance.image = None;
                }
            } else if remaining_height < min_image_height {
                // Not enough space for image alone
                appearance.image = None;
            }
        }
        
        Ok(appearance)
    }

    /// Calculate optimal bounds while respecting field positioning constraints
    fn calculate_optimal_bounds_respecting_field(
        &self,
        appearance: &SignatureAppearance,
        field_bounds: &Rectangle,
    ) -> Result<Rectangle> {
        // Start with field position but calculate optimal size
        let mut optimal_bounds = field_bounds.clone();
        
        // Calculate content-based dimensions
        let mut content_width: f64 = 150.0; // Minimum width
        let mut content_height: f64 = 40.0; // Minimum height
        
        // Adjust for text content
        if let Some(text) = &appearance.text {
            let lines = text.lines().count();
            let max_line_length = text.lines().map(|line| line.len()).max().unwrap_or(0);
            
            let estimated_width = (max_line_length as f64 * self.default_font_size * 0.6) + (2.0 * self.default_margin);
            let estimated_height = (lines as f64 * self.default_font_size * 1.2) + (2.0 * self.default_margin);
            
            content_width = content_width.max(estimated_width);
            content_height = content_height.max(estimated_height);
        }
        
        // Adjust for image if present
        if appearance.image.is_some() {
            content_height += 40.0; // Add space for image
        }
        
        // Use larger of field bounds or content requirements
        optimal_bounds.width = optimal_bounds.width.max(content_width);
        optimal_bounds.height = optimal_bounds.height.max(content_height);
        
        // Ensure bounds don't exceed reasonable limits
        optimal_bounds.width = optimal_bounds.width.min(400.0);
        optimal_bounds.height = optimal_bounds.height.min(200.0);
        
        Ok(optimal_bounds)
    }

    /// Adjust font size to fit within specified width
    fn adjust_font_size_for_width(
        &self,
        mut appearance: SignatureAppearance,
        available_width: f64,
    ) -> Result<SignatureAppearance> {
        if let Some(text) = &appearance.text {
            let max_line_length = text.lines().map(|line| line.len()).max().unwrap_or(0);
            
            if max_line_length > 0 {
                let char_width_ratio = 0.6; // Approximate character width ratio for Helvetica
                let required_width = max_line_length as f64 * self.default_font_size * char_width_ratio;
                
                if required_width > available_width {
                    // Calculate scaling factor
                    let scale_factor = available_width / required_width;
                    let adjusted_font_size = (self.default_font_size * scale_factor).max(6.0); // Minimum 6pt font
                    
                    // Note: In a full implementation, we would store font size in the appearance
                    // For now, we'll adjust by shortening text if needed
                    if scale_factor < 0.7 {
                        // If font would be too small, truncate text instead
                        let max_chars = (available_width / (6.0 * char_width_ratio)) as usize;
                        let lines: Vec<String> = text.lines()
                            .map(|line| {
                                if line.len() > max_chars {
                                    format!("{}...", &line[..max_chars.saturating_sub(3)])
                                } else {
                                    line.to_string()
                                }
                            })
                            .collect();
                        
                        appearance.text = Some(lines.join("\n"));
                    }
                }
            }
        }
        
        Ok(appearance)
    }

    /// Validate signature appearance configuration
    pub fn validate_appearance(&self, appearance: &SignatureAppearance) -> Result<()> {
        if appearance.visible {
            // For visible signatures, validate bounds if specified
            if let Some(bounds) = &appearance.bounds {
                if bounds.width <= 0.0 || bounds.height <= 0.0 {
                    return Err(PdfSignError::SignatureField {
                        message: "Signature appearance bounds must have positive dimensions".to_string(),
                        code: crate::error::ErrorCode::SignatureField,
                    ,
                code: crate::error::ErrorCode::SignatureField,});
                }
                
                if bounds.width < 50.0 || bounds.height < 20.0 {
                    return Err(PdfSignError::SignatureField {
                        message: "Signature appearance bounds are too small for readable content".to_string(),
                        code: crate::error::ErrorCode::SignatureField,
                    ,
                code: crate::error::ErrorCode::SignatureField,});
                }
            }
            
            // Validate that we have either text or image content
            if appearance.text.is_none() && appearance.image.is_none() {
                return Err(PdfSignError::SignatureField {
                    message: "Visible signature must have either text or image content".to_string(),
                    code: crate::error::ErrorCode::SignatureField,
                ,
                code: crate::error::ErrorCode::SignatureField,});
            }
        }
        
        Ok(())
    }

    /// Calculate optimal bounds for signature appearance based on content
    pub fn calculate_optimal_bounds(
        &self,
        appearance: &SignatureAppearance,
        page_bounds: &Rectangle,
    ) -> Result<Rectangle> {
        let mut width: f64 = 200.0; // Default width
        let mut height: f64 = 60.0; // Default height
        
        // Adjust based on text content
        if let Some(text) = &appearance.text {
            let lines = text.lines().count();
            let max_line_length = text.lines().map(|line| line.len()).max().unwrap_or(0);
            
            // Estimate required dimensions
            let estimated_width = (max_line_length as f64 * self.default_font_size * 0.6) + (2.0 * self.default_margin);
            let estimated_height = (lines as f64 * self.default_font_size * 1.2) + (2.0 * self.default_margin);
            
            width = width.max(estimated_width);
            height = height.max(estimated_height);
        }
        
        // Adjust for image if present
        if appearance.image.is_some() {
            height += 40.0; // Add space for image
        }
        
        // Ensure bounds fit within page
        width = width.min(page_bounds.width - 20.0); // Leave 10pt margin on each side
        height = height.min(page_bounds.height - 20.0);
        
        // Position in bottom-right corner by default
        let x = page_bounds.width - width - 10.0;
        let y = 10.0;
        
        Ok(Rectangle { x, y, width, height })
    }

    /// Apply signature positioning and scaling based on field constraints
    pub fn apply_positioning_constraints(
        &self,
        appearance: &SignatureAppearance,
        field_bounds: &Rectangle,
    ) -> Result<SignatureAppearance> {
        let mut constrained_appearance = appearance.clone();
        
        // Override bounds to match field bounds
        constrained_appearance.bounds = Some(field_bounds.clone());
        
        // If the field is too small for the current content, adjust the appearance
        if field_bounds.width < 100.0 || field_bounds.height < 30.0 {
            // Use more compact text for small fields
            if let Some(text) = &appearance.text {
                let lines: Vec<&str> = text.lines().collect();
                if lines.len() > 2 {
                    // Keep only the first two lines for small fields
                    constrained_appearance.text = Some(lines[..2].join("\n"));
                }
            }
            
            // Remove image for very small fields
            if field_bounds.width < 80.0 || field_bounds.height < 25.0 {
                constrained_appearance.image = None;
            }
        }
        
        Ok(constrained_appearance)
    }
}

impl Default for SignatureAppearanceRenderer {
    fn default() -> Self {
        Self::new()
    }
}