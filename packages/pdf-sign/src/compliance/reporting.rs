//! Compliance reporting and result aggregation
//! 
//! Provides comprehensive reporting of standards compliance validation results

use super::standards::*;
use chrono::{DateTime, Utc};
use std::collections::HashMap;

/// Comprehensive compliance report for all validated standards
#[derive(Debug, Clone, serde::Serialize)]
pub struct ComplianceReport {
    /// Individual standard compliance results
    pub standard_results: Vec<StandardComplianceResult>,
    /// Overall compliance status
    pub overall_compliance: OverallComplianceStatus,
    /// Report generation timestamp
    pub generated_at: DateTime<Utc>,
    /// Summary statistics
    pub summary: ComplianceSummary,
    /// Recommendations for improving compliance
    pub recommendations: Vec<ComplianceRecommendation>,
}

/// Overall compliance status across all standards
#[derive(Debug, Clone, PartialEq, serde::Serialize)]
pub enum OverallComplianceStatus {
    /// All standards are fully compliant
    FullyCompliant,
    /// Most standards are compliant with minor issues
    MostlyCompliant,
    /// Some standards have significant compliance issues
    PartiallyCompliant,
    /// Major compliance failures across multiple standards
    NonCompliant,
}

/// Summary statistics for compliance validation
#[derive(Debug, Clone, serde::Serialize)]
pub struct ComplianceSummary {
    /// Total number of standards validated
    pub standards_validated: usize,
    /// Number of fully compliant standards
    pub fully_compliant_standards: usize,
    /// Total number of violations found
    pub total_violations: usize,
    /// Total number of warnings found
    pub total_warnings: usize,
    /// Violations by severity level
    pub violations_by_severity: HashMap<ViolationSeverity, usize>,
    /// Most severe violation found
    pub highest_severity: Option<ViolationSeverity>,
}

/// Recommendation for improving compliance
#[derive(Debug, Clone, serde::Serialize)]
pub struct ComplianceRecommendation {
    /// Priority level of the recommendation
    pub priority: RecommendationPriority,
    /// The standard this recommendation applies to
    pub standard: Standard,
    /// Description of the recommendation
    pub description: String,
    /// Expected impact of implementing the recommendation
    pub impact: String,
    /// Estimated effort to implement
    pub effort: RecommendationEffort,
}

/// Priority levels for compliance recommendations
#[derive(Debug, Clone, PartialEq, Ord, PartialOrd, Eq, serde::Serialize)]
pub enum RecommendationPriority {
    /// Low priority - nice to have improvements
    Low,
    /// Medium priority - should be addressed
    Medium,
    /// High priority - important for compliance
    High,
    /// Critical priority - must be addressed immediately
    Critical,
}

/// Estimated effort levels for implementing recommendations
#[derive(Debug, Clone, PartialEq, serde::Serialize)]
pub enum RecommendationEffort {
    /// Minimal effort required
    Minimal,
    /// Low effort required
    Low,
    /// Medium effort required
    Medium,
    /// High effort required
    High,
}

impl ComplianceReport {
    /// Create a new compliance report from standard results
    pub fn new(
        standard_results: Vec<StandardComplianceResult>,
        generated_at: DateTime<Utc>,
    ) -> Self {
        let summary = Self::calculate_summary(&standard_results);
        let overall_compliance = Self::determine_overall_compliance(&summary);
        let recommendations = Self::generate_recommendations(&standard_results);

        Self {
            standard_results,
            overall_compliance,
            generated_at,
            summary,
            recommendations,
        }
    }

    /// Get compliance result for a specific standard
    pub fn get_standard_result(&self, standard: &Standard) -> Option<&StandardComplianceResult> {
        self.standard_results.iter().find(|result| &result.standard == standard)
    }

    /// Check if all standards are compliant
    pub fn is_fully_compliant(&self) -> bool {
        self.overall_compliance == OverallComplianceStatus::FullyCompliant
    }

    /// Get all violations across all standards
    pub fn get_all_violations(&self) -> Vec<&ComplianceViolation> {
        self.standard_results
            .iter()
            .flat_map(|result| &result.violations)
            .collect()
    }

    /// Get all warnings across all standards
    pub fn get_all_warnings(&self) -> Vec<&ComplianceWarning> {
        self.standard_results
            .iter()
            .flat_map(|result| &result.warnings)
            .collect()
    }

    /// Get violations by severity level
    pub fn get_violations_by_severity(&self, severity: ViolationSeverity) -> Vec<&ComplianceViolation> {
        self.get_all_violations()
            .into_iter()
            .filter(|violation| violation.severity == severity)
            .collect()
    }

    /// Get critical violations that must be addressed
    pub fn get_critical_violations(&self) -> Vec<&ComplianceViolation> {
        self.get_violations_by_severity(ViolationSeverity::Critical)
    }

    /// Get high-priority recommendations
    pub fn get_high_priority_recommendations(&self) -> Vec<&ComplianceRecommendation> {
        self.recommendations
            .iter()
            .filter(|rec| rec.priority >= RecommendationPriority::High)
            .collect()
    }

    /// Generate a human-readable summary
    pub fn generate_summary_text(&self) -> String {
        let mut summary = String::new();
        
        summary.push_str(&format!("Compliance Report - Generated: {}\n", self.generated_at.format("%Y-%m-%d %H:%M:%S UTC")));
        summary.push_str(&format!("Overall Status: {:?}\n\n", self.overall_compliance));
        
        summary.push_str("Standards Validation Summary:\n");
        for result in &self.standard_results {
            let status = if result.is_compliant { "✓ COMPLIANT" } else { "✗ NON-COMPLIANT" };
            summary.push_str(&format!("  {:?}: {} ({} violations, {} warnings)\n", 
                result.standard, status, result.violations.len(), result.warnings.len()));
        }
        
        summary.push_str(&format!("\nTotal: {} violations, {} warnings\n", 
            self.summary.total_violations, self.summary.total_warnings));
        
        if !self.recommendations.is_empty() {
            summary.push_str(&format!("\nTop Recommendations ({}):\n", self.recommendations.len()));
            for (i, rec) in self.recommendations.iter().take(5).enumerate() {
                summary.push_str(&format!("  {}. [{:?}] {}\n", i + 1, rec.priority, rec.description));
            }
        }
        
        summary
    }

    /// Export report as JSON
    pub fn to_json(&self) -> serde_json::Result<String> {
        serde_json::to_string_pretty(self)
    }

    // Private helper methods

    fn calculate_summary(results: &[StandardComplianceResult]) -> ComplianceSummary {
        let standards_validated = results.len();
        let fully_compliant_standards = results.iter().filter(|r| r.is_compliant).count();
        
        let mut total_violations = 0;
        let mut total_warnings = 0;
        let mut violations_by_severity = HashMap::new();
        let mut highest_severity = None;

        for result in results {
            total_violations += result.violations.len();
            total_warnings += result.warnings.len();

            for violation in &result.violations {
                *violations_by_severity.entry(violation.severity.clone()).or_insert(0) += 1;
                
                if highest_severity.is_none() || violation.severity > *highest_severity.as_ref().unwrap() {
                    highest_severity = Some(violation.severity.clone());
                }
            }
        }

        ComplianceSummary {
            standards_validated,
            fully_compliant_standards,
            total_violations,
            total_warnings,
            violations_by_severity,
            highest_severity,
        }
    }

    fn determine_overall_compliance(summary: &ComplianceSummary) -> OverallComplianceStatus {
        if summary.total_violations == 0 {
            OverallComplianceStatus::FullyCompliant
        } else if summary.violations_by_severity.get(&ViolationSeverity::Critical).unwrap_or(&0) > &0 {
            OverallComplianceStatus::NonCompliant
        } else if summary.violations_by_severity.get(&ViolationSeverity::High).unwrap_or(&0) > &2 {
            OverallComplianceStatus::PartiallyCompliant
        } else {
            OverallComplianceStatus::MostlyCompliant
        }
    }

    fn generate_recommendations(results: &[StandardComplianceResult]) -> Vec<ComplianceRecommendation> {
        let mut recommendations = Vec::new();

        for result in results {
            // Generate recommendations based on violations
            for violation in &result.violations {
                let priority = match violation.severity {
                    ViolationSeverity::Critical => RecommendationPriority::Critical,
                    ViolationSeverity::High => RecommendationPriority::High,
                    ViolationSeverity::Medium => RecommendationPriority::Medium,
                    ViolationSeverity::Low => RecommendationPriority::Low,
                };

                let effort = Self::estimate_effort(&violation.violation_id);

                if let Some(remediation) = &violation.remediation {
                    recommendations.push(ComplianceRecommendation {
                        priority,
                        standard: result.standard.clone(),
                        description: remediation.clone(),
                        impact: format!("Resolves: {}", violation.description),
                        effort,
                    });
                }
            }

            // Generate recommendations based on warnings
            for warning in &result.warnings {
                if let Some(recommendation) = &warning.recommendation {
                    recommendations.push(ComplianceRecommendation {
                        priority: RecommendationPriority::Low,
                        standard: result.standard.clone(),
                        description: recommendation.clone(),
                        impact: format!("Improves: {}", warning.description),
                        effort: RecommendationEffort::Low,
                    });
                }
            }
        }

        // Sort by priority (highest first)
        recommendations.sort_by(|a, b| b.priority.cmp(&a.priority));
        
        // Remove duplicates and limit to top recommendations
        recommendations.dedup_by(|a, b| a.description == b.description);
        recommendations.truncate(20);

        recommendations
    }

    fn estimate_effort(violation_id: &str) -> RecommendationEffort {
        match violation_id {
            id if id.contains("VERSION") || id.contains("ALGORITHM") => RecommendationEffort::Medium,
            id if id.contains("STRUCT") || id.contains("FORMAT") => RecommendationEffort::High,
            id if id.contains("CERT") || id.contains("KEY") => RecommendationEffort::Medium,
            id if id.contains("SIZE") || id.contains("TIME") => RecommendationEffort::Low,
            _ => RecommendationEffort::Medium,
        }
    }
}

/// Compliance report builder for customizing report generation
#[derive(Debug)]
pub struct ComplianceReportBuilder {
    include_warnings: bool,
    include_metadata: bool,
    max_recommendations: usize,
    severity_filter: Option<ViolationSeverity>,
}

impl Default for ComplianceReportBuilder {
    fn default() -> Self {
        Self {
            include_warnings: true,
            include_metadata: true,
            max_recommendations: 20,
            severity_filter: None,
        }
    }
}

impl ComplianceReportBuilder {
    /// Create a new report builder
    pub fn new() -> Self {
        Self::default()
    }

    /// Include or exclude warnings in the report
    pub fn include_warnings(mut self, include: bool) -> Self {
        self.include_warnings = include;
        self
    }

    /// Include or exclude metadata in the report
    pub fn include_metadata(mut self, include: bool) -> Self {
        self.include_metadata = include;
        self
    }

    /// Set maximum number of recommendations to include
    pub fn max_recommendations(mut self, max: usize) -> Self {
        self.max_recommendations = max;
        self
    }

    /// Filter violations by minimum severity level
    pub fn filter_by_severity(mut self, min_severity: ViolationSeverity) -> Self {
        self.severity_filter = Some(min_severity);
        self
    }

    /// Build the compliance report
    pub fn build(self, standard_results: Vec<StandardComplianceResult>) -> ComplianceReport {
        let mut filtered_results = standard_results;

        // Apply filters
        if !self.include_warnings {
            for result in &mut filtered_results {
                result.warnings.clear();
            }
        }

        if let Some(min_severity) = self.severity_filter {
            for result in &mut filtered_results {
                result.violations.retain(|v| v.severity >= min_severity);
            }
        }

        if !self.include_metadata {
            for result in &mut filtered_results {
                result.metadata.clear();
            }
        }

        let mut report = ComplianceReport::new(filtered_results, Utc::now());
        
        // Limit recommendations
        report.recommendations.truncate(self.max_recommendations);

        report
    }
}

// Implement serde traits for JSON serialization
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
struct SerializableComplianceReport {
    standard_results: Vec<SerializableStandardResult>,
    overall_compliance: String,
    generated_at: String,
    summary: SerializableComplianceSummary,
    recommendations: Vec<SerializableRecommendation>,
}

#[derive(Serialize, Deserialize)]
struct SerializableStandardResult {
    standard: String,
    is_compliant: bool,
    compliance_level: Option<String>,
    violations: Vec<SerializableViolation>,
    warnings: Vec<SerializableWarning>,
    metadata: HashMap<String, String>,
}

#[derive(Serialize, Deserialize)]
struct SerializableViolation {
    violation_id: String,
    description: String,
    severity: String,
    location: Option<String>,
    remediation: Option<String>,
}

#[derive(Serialize, Deserialize)]
struct SerializableWarning {
    warning_id: String,
    description: String,
    location: Option<String>,
    recommendation: Option<String>,
}

#[derive(Serialize, Deserialize)]
struct SerializableComplianceSummary {
    standards_validated: usize,
    fully_compliant_standards: usize,
    total_violations: usize,
    total_warnings: usize,
    violations_by_severity: HashMap<String, usize>,
    highest_severity: Option<String>,
}

#[derive(Serialize, Deserialize)]
struct SerializableRecommendation {
    priority: String,
    standard: String,
    description: String,
    impact: String,
    effort: String,
}

impl ComplianceReport {
    /// Convert to serializable format for JSON export
    fn to_serializable(&self) -> SerializableComplianceReport {
        SerializableComplianceReport {
            standard_results: self.standard_results.iter().map(|r| SerializableStandardResult {
                standard: format!("{:?}", r.standard),
                is_compliant: r.is_compliant,
                compliance_level: r.compliance_level.as_ref().map(|l| format!("{:?}", l)),
                violations: r.violations.iter().map(|v| SerializableViolation {
                    violation_id: v.violation_id.clone(),
                    description: v.description.clone(),
                    severity: format!("{:?}", v.severity),
                    location: v.location.clone(),
                    remediation: v.remediation.clone(),
                }).collect(),
                warnings: r.warnings.iter().map(|w| SerializableWarning {
                    warning_id: w.warning_id.clone(),
                    description: w.description.clone(),
                    location: w.location.clone(),
                    recommendation: w.recommendation.clone(),
                }).collect(),
                metadata: r.metadata.clone(),
            }).collect(),
            overall_compliance: format!("{:?}", self.overall_compliance),
            generated_at: self.generated_at.to_rfc3339(),
            summary: SerializableComplianceSummary {
                standards_validated: self.summary.standards_validated,
                fully_compliant_standards: self.summary.fully_compliant_standards,
                total_violations: self.summary.total_violations,
                total_warnings: self.summary.total_warnings,
                violations_by_severity: self.summary.violations_by_severity.iter()
                    .map(|(k, v)| (format!("{:?}", k), *v))
                    .collect(),
                highest_severity: self.summary.highest_severity.as_ref().map(|s| format!("{:?}", s)),
            },
            recommendations: self.recommendations.iter().map(|r| SerializableRecommendation {
                priority: format!("{:?}", r.priority),
                standard: format!("{:?}", r.standard),
                description: r.description.clone(),
                impact: r.impact.clone(),
                effort: format!("{:?}", r.effort),
            }).collect(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_overall_compliance_determination() {
        // Test fully compliant
        let summary = ComplianceSummary {
            standards_validated: 3,
            fully_compliant_standards: 3,
            total_violations: 0,
            total_warnings: 2,
            violations_by_severity: HashMap::new(),
            highest_severity: None,
        };
        assert_eq!(
            ComplianceReport::determine_overall_compliance(&summary),
            OverallComplianceStatus::FullyCompliant
        );

        // Test non-compliant with critical violations
        let mut violations_by_severity = HashMap::new();
        violations_by_severity.insert(ViolationSeverity::Critical, 1);
        let summary = ComplianceSummary {
            standards_validated: 3,
            fully_compliant_standards: 2,
            total_violations: 1,
            total_warnings: 0,
            violations_by_severity,
            highest_severity: Some(ViolationSeverity::Critical),
        };
        assert_eq!(
            ComplianceReport::determine_overall_compliance(&summary),
            OverallComplianceStatus::NonCompliant
        );
    }

    #[test]
    fn test_recommendation_priority_ordering() {
        assert!(RecommendationPriority::Critical > RecommendationPriority::High);
        assert!(RecommendationPriority::High > RecommendationPriority::Medium);
        assert!(RecommendationPriority::Medium > RecommendationPriority::Low);
    }
}