#!/bin/bash

# Prisma Database Setup Script
# Automates Prisma database connection setup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if .env file exists
check_env_file() {
    if [ ! -f .env ]; then
        print_error ".env file not found!"
        echo "Creating .env from .env.example..."
        if [ -f .env.example ]; then
            cp .env.example .env
            print_success ".env file created"
        else
            print_error ".env.example not found. Please create .env manually."
            exit 1
        fi
    fi
}

# Test database connection
test_connection() {
    local connection_string=$1
    print_info "Testing database connection..."
    
    # Extract connection details
    if command -v psql &> /dev/null; then
        if psql "$connection_string" -c "SELECT 1;" &> /dev/null; then
            print_success "Database connection successful!"
            return 0
        else
            print_error "Database connection failed!"
            return 1
        fi
    else
        print_warning "psql not found. Skipping connection test."
        print_info "Install PostgreSQL client to enable connection testing."
        return 0
    fi
}

# Setup for Neon (current configuration)
setup_neon() {
    print_header "Setting up Neon Database"
    
    print_info "Your .env already has Neon configured."
    print_info "Connection string: NEXT_PRIVATE_DATABASE_URL"
    
    # Check if connection string exists
    if grep -q "NEXT_PRIVATE_DATABASE_URL" .env; then
        print_success "Neon connection string found in .env"
        
        # Extract connection string
        connection_string=$(grep "NEXT_PRIVATE_DATABASE_URL" .env | cut -d '=' -f2- | tr -d '"')
        
        # Test connection
        test_connection "$connection_string"
    else
        print_error "NEXT_PRIVATE_DATABASE_URL not found in .env"
        exit 1
    fi
}

# Setup for Supabase
setup_supabase() {
    print_header "Setting up Supabase Database"
    
    echo "Please provide your Supabase connection details:"
    echo ""
    echo "Get these from: https://app.supabase.com"
    echo "→ Your Project → Settings → Database → Connection pooling"
    echo ""
    
    read -p "Enter Supabase pooled connection string: " pooled_url
    read -p "Enter Supabase direct connection string: " direct_url
    
    # Update .env file
    if grep -q "NEXT_PRIVATE_DATABASE_URL" .env; then
        # Replace existing
        sed -i.bak "s|NEXT_PRIVATE_DATABASE_URL=.*|NEXT_PRIVATE_DATABASE_URL=\"$pooled_url\"|" .env
        sed -i.bak "s|NEXT_PRIVATE_DIRECT_DATABASE_URL=.*|NEXT_PRIVATE_DIRECT_DATABASE_URL=\"$direct_url\"|" .env
        rm .env.bak
    else
        # Add new
        echo "" >> .env
        echo "# Supabase Database Connection" >> .env
        echo "NEXT_PRIVATE_DATABASE_URL=\"$pooled_url\"" >> .env
        echo "NEXT_PRIVATE_DIRECT_DATABASE_URL=\"$direct_url\"" >> .env
    fi
    
    print_success "Supabase connection strings added to .env"
    
    # Test connection
    test_connection "$direct_url"
}

# Setup for Local PostgreSQL
setup_local() {
    print_header "Setting up Local PostgreSQL"
    
    echo "Choose local setup method:"
    echo "1) Use existing PostgreSQL"
    echo "2) Start PostgreSQL with Docker"
    read -p "Enter choice (1-2): " local_choice
    
    case $local_choice in
        1)
            read -p "Enter database host [localhost]: " db_host
            db_host=${db_host:-localhost}
            
            read -p "Enter database port [5432]: " db_port
            db_port=${db_port:-5432}
            
            read -p "Enter database name [signtusk_dev]: " db_name
            db_name=${db_name:-signtusk_dev}
            
            read -p "Enter database user [postgres]: " db_user
            db_user=${db_user:-postgres}
            
            read -sp "Enter database password: " db_pass
            echo ""
            
            connection_string="postgresql://${db_user}:${db_pass}@${db_host}:${db_port}/${db_name}"
            ;;
        2)
            print_info "Starting PostgreSQL with Docker..."
            
            docker run -d \
                --name signtusk-postgres \
                -e POSTGRES_PASSWORD=password \
                -e POSTGRES_DB=signtusk_dev \
                -p 5432:5432 \
                postgres:16
            
            print_success "PostgreSQL container started"
            print_info "Waiting for PostgreSQL to be ready..."
            sleep 5
            
            connection_string="postgresql://postgres:password@localhost:5432/signtusk_dev"
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac
    
    # Update .env file
    if grep -q "NEXT_PRIVATE_DATABASE_URL" .env; then
        sed -i.bak "s|NEXT_PRIVATE_DATABASE_URL=.*|NEXT_PRIVATE_DATABASE_URL=\"$connection_string\"|" .env
        sed -i.bak "s|NEXT_PRIVATE_DIRECT_DATABASE_URL=.*|NEXT_PRIVATE_DIRECT_DATABASE_URL=\"$connection_string\"|" .env
        rm .env.bak
    else
        echo "" >> .env
        echo "# Local PostgreSQL Connection" >> .env
        echo "NEXT_PRIVATE_DATABASE_URL=\"$connection_string\"" >> .env
        echo "NEXT_PRIVATE_DIRECT_DATABASE_URL=\"$connection_string\"" >> .env
    fi
    
    print_success "Local PostgreSQL connection strings added to .env"
    
    # Test connection
    test_connection "$connection_string"
}

# Setup for Dokploy
setup_dokploy() {
    print_header "Setting up Dokploy PostgreSQL"
    
    echo "Please provide your Dokploy PostgreSQL connection details:"
    echo ""
    
    read -p "Enter database host: " db_host
    read -p "Enter database port [5432]: " db_port
    db_port=${db_port:-5432}
    
    read -p "Enter database name [dso]: " db_name
    db_name=${db_name:-dso}
    
    read -p "Enter database user [admin]: " db_user
    db_user=${db_user:-admin}
    
    read -sp "Enter database password: " db_pass
    echo ""
    
    connection_string="postgresql://${db_user}:${db_pass}@${db_host}:${db_port}/${db_name}"
    
    # Update .env file
    if grep -q "NEXT_PRIVATE_DATABASE_URL" .env; then
        sed -i.bak "s|NEXT_PRIVATE_DATABASE_URL=.*|NEXT_PRIVATE_DATABASE_URL=\"$connection_string\"|" .env
        sed -i.bak "s|NEXT_PRIVATE_DIRECT_DATABASE_URL=.*|NEXT_PRIVATE_DIRECT_DATABASE_URL=\"$connection_string\"|" .env
        rm .env.bak
    else
        echo "" >> .env
        echo "# Dokploy PostgreSQL Connection" >> .env
        echo "NEXT_PRIVATE_DATABASE_URL=\"$connection_string\"" >> .env
        echo "NEXT_PRIVATE_DIRECT_DATABASE_URL=\"$connection_string\"" >> .env
    fi
    
    print_success "Dokploy connection strings added to .env"
    
    # Test connection
    test_connection "$connection_string"
}

# Generate Prisma Client
generate_prisma() {
    print_header "Generating Prisma Client"
    
    if npm run prisma:generate; then
        print_success "Prisma Client generated successfully"
    else
        print_error "Failed to generate Prisma Client"
        exit 1
    fi
}

# Run migrations
run_migrations() {
    print_header "Running Database Migrations"
    
    echo "Choose migration option:"
    echo "1) Apply existing migrations (prisma:migrate-deploy)"
    echo "2) Create new migration (prisma:migrate-dev)"
    echo "3) Skip migrations"
    read -p "Enter choice (1-3): " migration_choice
    
    case $migration_choice in
        1)
            if npm run prisma:migrate-deploy; then
                print_success "Migrations applied successfully"
            else
                print_error "Failed to apply migrations"
                exit 1
            fi
            ;;
        2)
            read -p "Enter migration name: " migration_name
            if npm run prisma:migrate-dev -- --name "$migration_name"; then
                print_success "Migration created and applied successfully"
            else
                print_error "Failed to create migration"
                exit 1
            fi
            ;;
        3)
            print_warning "Skipping migrations"
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac
}

# Seed database
seed_database() {
    print_header "Seeding Database"
    
    read -p "Do you want to seed the database with test data? (y/n): " seed_choice
    
    if [ "$seed_choice" = "y" ] || [ "$seed_choice" = "Y" ]; then
        if npm run prisma:seed; then
            print_success "Database seeded successfully"
        else
            print_warning "Failed to seed database (this is optional)"
        fi
    else
        print_info "Skipping database seeding"
    fi
}

# Open Prisma Studio
open_studio() {
    print_header "Opening Prisma Studio"
    
    read -p "Do you want to open Prisma Studio to view your database? (y/n): " studio_choice
    
    if [ "$studio_choice" = "y" ] || [ "$studio_choice" = "Y" ]; then
        print_info "Opening Prisma Studio at http://localhost:5555"
        print_info "Press Ctrl+C to close Prisma Studio when done"
        npm run prisma:studio
    fi
}

# Main menu
main_menu() {
    print_header "Prisma Database Setup"
    
    echo "Choose your database provider:"
    echo "1) Neon (current configuration)"
    echo "2) Supabase"
    echo "3) Local PostgreSQL"
    echo "4) Dokploy PostgreSQL"
    echo "5) Exit"
    echo ""
    read -p "Enter choice (1-5): " choice
    
    case $choice in
        1)
            setup_neon
            ;;
        2)
            setup_supabase
            ;;
        3)
            setup_local
            ;;
        4)
            setup_dokploy
            ;;
        5)
            print_info "Exiting..."
            exit 0
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac
}

# Main execution
print_header "Prisma Database Setup Script"

# Check prerequisites
check_env_file

# Show main menu
main_menu

# Generate Prisma Client
generate_prisma

# Run migrations
run_migrations

# Seed database
seed_database

# Open Prisma Studio
open_studio

# Final message
print_header "Setup Complete!"
print_success "Your database is ready to use!"
echo ""
print_info "Next steps:"
echo "  1. Run: npm run dev"
echo "  2. Visit: http://localhost:3000"
echo ""
print_info "Useful commands:"
echo "  - View database: npm run prisma:studio"
echo "  - Create migration: npm run prisma:migrate-dev --name migration_name"
echo "  - Generate client: npm run prisma:generate"
echo ""
print_success "Happy coding! 🚀"
