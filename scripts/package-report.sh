#!/bin/bash

# Package Report Generation Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
REPORT_TYPE=${1:-"basic"}

show_help() {
    echo "Usage: $0 [REPORT_TYPE]"
    echo ""
    echo "Report Types:"
    echo "  basic    - Basic package information (default)"
    echo "  detailed - Detailed analysis including dependencies"
    echo "  nuclear  - Complete analysis with build, test, and dependency reports"
    echo ""
    echo "Examples:"
    echo "  $0           # Basic reports"
    echo "  $0 basic     # Same as above"
    echo "  $0 detailed  # Detailed analysis"
    echo "  $0 nuclear   # Complete analysis"
}

# Check if help is requested
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    show_help
    exit 0
fi

# Generate package info
generate_package_info() {
    local package_dir=$1
    local package_name=$2
    local report_dir="reports/packages/$package_name"
    
    print_status "Analyzing $package_name..."
    
    # Basic package.json info
    if [ -f "${package_dir}package.json" ]; then
        echo "=== Package Information ===" > "$report_dir/info.txt"
        echo "Name: $(jq -r '.name // "N/A"' "${package_dir}package.json")" >> "$report_dir/info.txt"
        echo "Version: $(jq -r '.version // "N/A"' "${package_dir}package.json")" >> "$report_dir/info.txt"
        echo "Description: $(jq -r '.description // "N/A"' "${package_dir}package.json")" >> "$report_dir/info.txt"
        echo "Main: $(jq -r '.main // "N/A"' "${package_dir}package.json")" >> "$report_dir/info.txt"
        echo "Types: $(jq -r '.types // "N/A"' "${package_dir}package.json")" >> "$report_dir/info.txt"
        echo "" >> "$report_dir/info.txt"
        
        # Scripts
        echo "=== Available Scripts ===" >> "$report_dir/info.txt"
        jq -r '.scripts // {} | to_entries[] | "\(.key): \(.value)"' "${package_dir}package.json" >> "$report_dir/info.txt"
        echo "" >> "$report_dir/info.txt"
        
        # Dependencies
        echo "=== Dependencies ===" >> "$report_dir/info.txt"
        jq -r '.dependencies // {} | keys[]' "${package_dir}package.json" >> "$report_dir/info.txt"
        echo "" >> "$report_dir/info.txt"
        
        # Dev Dependencies
        echo "=== Dev Dependencies ===" >> "$report_dir/info.txt"
        jq -r '.devDependencies // {} | keys[]' "${package_dir}package.json" >> "$report_dir/info.txt"
    fi
    
    # File structure
    echo "=== File Structure ===" > "$report_dir/structure.txt"
    find "$package_dir" -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | head -20 >> "$report_dir/structure.txt"
    
    # TypeScript config if exists
    if [ -f "${package_dir}tsconfig.json" ]; then
        echo "=== TypeScript Configuration ===" > "$report_dir/tsconfig.txt"
        cat "${package_dir}tsconfig.json" >> "$report_dir/tsconfig.txt"
    fi
}

# Generate detailed analysis
generate_detailed_analysis() {
    local package_dir=$1
    local package_name=$2
    local report_dir="reports/packages/$package_name"
    
    # Generate basic info first
    generate_package_info "$package_dir" "$package_name"
    
    print_status "Detailed analysis for $package_name..."
    
    # Line count analysis
    echo "=== Code Statistics ===" > "$report_dir/stats.txt"
    if [ -d "${package_dir}src" ]; then
        echo "TypeScript files: $(find "${package_dir}src" -name "*.ts" -o -name "*.tsx" | wc -l)" >> "$report_dir/stats.txt"
        echo "JavaScript files: $(find "${package_dir}src" -name "*.js" -o -name "*.jsx" | wc -l)" >> "$report_dir/stats.txt"
        echo "Total lines of code: $(find "${package_dir}src" -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs wc -l | tail -1)" >> "$report_dir/stats.txt"
    fi
    
    # Test files
    echo "Test files: $(find "$package_dir" -name "*.test.*" -o -name "*.spec.*" | wc -l)" >> "$report_dir/stats.txt"
}

# Generate nuclear analysis (complete)
generate_nuclear_analysis() {
    local package_dir=$1
    local package_name=$2
    local report_dir="reports/packages/$package_name"
    
    # Generate detailed analysis first
    generate_detailed_analysis "$package_dir" "$package_name"
    
    print_status "Nuclear analysis for $package_name..."
    
    # Try to build if build script exists
    if jq -e '.scripts.build' "${package_dir}package.json" > /dev/null 2>&1; then
        local current_dir=$(pwd)
        local build_report_path="$current_dir/$report_dir/build.txt"
        echo "=== Build Test ===" > "$build_report_path"
        cd "$package_dir"
        if npm run build >> "$build_report_path" 2>&1; then
            echo "✅ Build successful" >> "$build_report_path"
        else
            echo "❌ Build failed" >> "$build_report_path"
        fi
        cd "$current_dir"
    fi
    
    # Try to run tests if test script exists (skip for now to avoid hanging)
    if jq -e '.scripts.test' "${package_dir}package.json" > /dev/null 2>&1; then
        local current_dir=$(pwd)
        local test_report_path="$current_dir/$report_dir/test.txt"
        echo "=== Test Results ===" > "$test_report_path"
        echo "⚠️  Test execution skipped to prevent hanging" >> "$test_report_path"
        echo "To run tests manually: cd $package_dir && npm test" >> "$test_report_path"
        echo "❌ Tests skipped" >> "$test_report_path"
    fi
}

# Main report generation function
generate_package_reports() {
    print_status "Starting package report generation..."
    print_status "Report type: $REPORT_TYPE"
    
    # Create reports directory
    mkdir -p reports/packages
    
    # Initialize counters for summary
    local package_count=0
    local build_success_count=0
    local build_fail_count=0
    local test_success_count=0
    local test_fail_count=0
    local no_build_script_count=0
    local no_test_script_count=0
    
    # Arrays to store package names by status
    local build_success_packages=()
    local build_fail_packages=()
    local test_success_packages=()
    local test_fail_packages=()
    local no_build_packages=()
    local no_test_packages=()
    
    # Create summary file
    echo "Package Report Summary - $(date)" > reports/packages/summary.txt
    echo "Report Type: $REPORT_TYPE" >> reports/packages/summary.txt
    echo "==============================" >> reports/packages/summary.txt
    
    # Find all packages (similar to the TypeScript function)
    for package_dir in packages/*/; do
        if [ -f "${package_dir}package.json" ]; then
            package_name=$(basename "$package_dir")
            package_count=$((package_count + 1))
            
            print_status "Processing package: $package_name"
            
            # Create package-specific report directory
            mkdir -p "reports/packages/$package_name"
            
            # Generate reports based on type
            case $REPORT_TYPE in
                "basic")
                    generate_package_info "$package_dir" "$package_name"
                    ;;
                "detailed")
                    generate_detailed_analysis "$package_dir" "$package_name"
                    ;;
                "nuclear")
                    generate_nuclear_analysis "$package_dir" "$package_name"
                    ;;
            esac
            
            # Check build status for nuclear reports
            if [ "$REPORT_TYPE" = "nuclear" ]; then
                if jq -e '.scripts.build' "${package_dir}package.json" > /dev/null 2>&1; then
                    if [ -f "reports/packages/$package_name/build.txt" ] && grep -q "✅ Build successful" "reports/packages/$package_name/build.txt"; then
                        build_success_count=$((build_success_count + 1))
                        build_success_packages+=("$package_name")
                    else
                        build_fail_count=$((build_fail_count + 1))
                        build_fail_packages+=("$package_name")
                    fi
                else
                    no_build_script_count=$((no_build_script_count + 1))
                    no_build_packages+=("$package_name")
                fi
                
                # Check test status
                if jq -e '.scripts.test' "${package_dir}package.json" > /dev/null 2>&1; then
                    if [ -f "reports/packages/$package_name/test.txt" ] && grep -q "✅ Tests passed" "reports/packages/$package_name/test.txt"; then
                        test_success_count=$((test_success_count + 1))
                        test_success_packages+=("$package_name")
                    else
                        test_fail_count=$((test_fail_count + 1))
                        test_fail_packages+=("$package_name")
                    fi
                else
                    no_test_script_count=$((no_test_script_count + 1))
                    no_test_packages+=("$package_name")
                fi
            fi
            
            # Add to summary
            echo "$package_name - $(jq -r '.description // "No description"' "${package_dir}package.json")" >> reports/packages/summary.txt
        fi
    done
    
    echo "" >> reports/packages/summary.txt
    echo "Total packages processed: $package_count" >> reports/packages/summary.txt
    
    # Add detailed summary for nuclear reports
    if [ "$REPORT_TYPE" = "nuclear" ]; then
        echo "" >> reports/packages/summary.txt
        echo "=== BUILD SUMMARY ===" >> reports/packages/summary.txt
        echo "✅ Successful builds: $build_success_count" >> reports/packages/summary.txt
        echo "❌ Failed builds: $build_fail_count" >> reports/packages/summary.txt
        echo "⚪ No build script: $no_build_script_count" >> reports/packages/summary.txt
        echo "" >> reports/packages/summary.txt
        echo "=== TEST SUMMARY ===" >> reports/packages/summary.txt
        echo "✅ Successful tests: $test_success_count" >> reports/packages/summary.txt
        echo "❌ Failed tests: $test_fail_count" >> reports/packages/summary.txt
        echo "⚪ No test script: $no_test_script_count" >> reports/packages/summary.txt
        
        # Create detailed status report
        echo "" > reports/packages/detailed-status.txt
        echo "DETAILED PACKAGE STATUS REPORT - $(date)" >> reports/packages/detailed-status.txt
        echo "=========================================" >> reports/packages/detailed-status.txt
        
        echo "" >> reports/packages/detailed-status.txt
        echo "BUILD SUCCESSFUL PACKAGES ($build_success_count):" >> reports/packages/detailed-status.txt
        echo "-----------------------------------" >> reports/packages/detailed-status.txt
        for pkg in "${build_success_packages[@]}"; do
            echo "✅ $pkg" >> reports/packages/detailed-status.txt
        done
        
        echo "" >> reports/packages/detailed-status.txt
        echo "BUILD FAILED PACKAGES ($build_fail_count):" >> reports/packages/detailed-status.txt
        echo "-----------------------------" >> reports/packages/detailed-status.txt
        for pkg in "${build_fail_packages[@]}"; do
            echo "❌ $pkg" >> reports/packages/detailed-status.txt
        done
        
        echo "" >> reports/packages/detailed-status.txt
        echo "TEST SUCCESSFUL PACKAGES ($test_success_count):" >> reports/packages/detailed-status.txt
        echo "----------------------------------" >> reports/packages/detailed-status.txt
        for pkg in "${test_success_packages[@]}"; do
            echo "✅ $pkg" >> reports/packages/detailed-status.txt
        done
        
        echo "" >> reports/packages/detailed-status.txt
        echo "TEST FAILED PACKAGES ($test_fail_count):" >> reports/packages/detailed-status.txt
        echo "----------------------------" >> reports/packages/detailed-status.txt
        for pkg in "${test_fail_packages[@]}"; do
            echo "❌ $pkg" >> reports/packages/detailed-status.txt
        done
        
        echo "" >> reports/packages/detailed-status.txt
        echo "NO BUILD SCRIPT PACKAGES ($no_build_script_count):" >> reports/packages/detailed-status.txt
        echo "--------------------------------" >> reports/packages/detailed-status.txt
        for pkg in "${no_build_packages[@]}"; do
            echo "⚪ $pkg" >> reports/packages/detailed-status.txt
        done
        
        echo "" >> reports/packages/detailed-status.txt
        echo "NO TEST SCRIPT PACKAGES ($no_test_script_count):" >> reports/packages/detailed-status.txt
        echo "-------------------------------" >> reports/packages/detailed-status.txt
        for pkg in "${no_test_packages[@]}"; do
            echo "⚪ $pkg" >> reports/packages/detailed-status.txt
        done
    fi
    
    print_success "Package reports completed! Check reports/packages/ directory"
}

# Execute the appropriate report generation
case $REPORT_TYPE in
    "basic")
        generate_package_reports
        ;;
    "detailed")
        generate_package_reports
        ;;
    "nuclear")
        generate_package_reports
        ;;
    *)
        print_error "Unknown report type: $REPORT_TYPE"
        show_help
        exit 1
        ;;
esac

echo ""
print_success "🎉 Package report generation completed!"
echo ""
print_status "Reports generated in: reports/packages/"
print_status "Summary available at: reports/packages/summary.txt"
if [ "$REPORT_TYPE" = "nuclear" ]; then
    print_status "Detailed status report: reports/packages/detailed-status.txt"
fi
echo ""
