import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { prisma } from './client';

interface Migration {
    id: string;
    filename: string;
    sql: string;
    appliedAt?: Date;
}

// Migration tracking table
const createMigrationTable = async (): Promise<void> => {
    await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "_migrations" (
            "id" TEXT PRIMARY KEY,
            "filename" TEXT NOT NULL,
            "applied_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "checksum" TEXT NOT NULL
        )
    `;
};

// Get applied migrations from database
const getAppliedMigrations = async (): Promise<Set<string>> => {
    try {
        const migrations = await prisma.$queryRaw<Array<{ id: string }>>`
            SELECT id FROM "_migrations" ORDER BY applied_at
        `;
        return new Set(migrations.map((m: { id: string }) => m.id));
    } catch (error) {
        // Table doesn't exist yet
        return new Set();
    }
};

// Load migration files from filesystem
const loadMigrationFiles = (): Migration[] => {
    const migrationsDir = join(__dirname, '../migrations');

    try {
        const files = readdirSync(migrationsDir)
            .filter(file => file.endsWith('.sql'))
            .sort();

        return files.map(filename => {
            const id = filename.replace('.sql', '');
            const sql = readFileSync(join(migrationsDir, filename), 'utf-8');

            return {
                id,
                filename,
                sql,
            };
        });
    } catch (error) {
        console.warn('No migrations directory found, skipping file-based migrations');
        return [];
    }
};

// Calculate checksum for migration content
const calculateChecksum = (content: string): string => {
    const crypto = require('node:crypto');
    return crypto.createHash('sha256').update(content).digest('hex');
};

// Apply a single migration
const applyMigration = async (migration: Migration): Promise<void> => {
    console.log(`Applying migration: ${migration.filename}`);

    try {
        // Execute migration in a transaction
        await prisma.$transaction(async (tx: any) => {
            // Split SQL by semicolons and execute each statement
            const statements = migration.sql
                .split(';')
                .map(stmt => stmt.trim())
                .filter(stmt => stmt.length > 0);

            for (const statement of statements) {
                if (statement.trim()) {
                    await tx.$executeRawUnsafe(statement);
                }
            }

            // Record migration as applied
            const checksum = calculateChecksum(migration.sql);
            await tx.$executeRaw`
                INSERT INTO "_migrations" (id, filename, checksum)
                VALUES (${migration.id}, ${migration.filename}, ${checksum})
            `;
        });

        console.log(`✅ Migration ${migration.filename} applied successfully`);
    } catch (error) {
        console.error(`❌ Failed to apply migration ${migration.filename}:`, error);
        throw error;
    }
};

// Run all pending migrations
export const runMigrations = async (): Promise<void> => {
    try {
        console.log('🔄 Starting database migrations...');

        // Ensure migration tracking table exists
        await createMigrationTable();

        // Get applied migrations
        const appliedMigrations = await getAppliedMigrations();

        // Load migration files
        const migrationFiles = loadMigrationFiles();

        // Find pending migrations
        const pendingMigrations = migrationFiles.filter(
            migration => !appliedMigrations.has(migration.id)
        );

        if (pendingMigrations.length === 0) {
            console.log('✅ No pending migrations found');
            return;
        }

        console.log(`📋 Found ${pendingMigrations.length} pending migrations`);

        // Apply each pending migration
        for (const migration of pendingMigrations) {
            await applyMigration(migration);
        }

        console.log('✅ All migrations completed successfully');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
};

// Rollback last migration (for development)
export const rollbackLastMigration = async (): Promise<void> => {
    try {
        const lastMigration = await prisma.$queryRaw<Array<{
            id: string;
            filename: string;
        }>>`
            SELECT id, filename FROM "_migrations" 
            ORDER BY applied_at DESC 
            LIMIT 1
        `;

        if (lastMigration.length === 0) {
            console.log('No migrations to rollback');
            return;
        }

        const migration = lastMigration[0];
        console.log(`Rolling back migration: ${migration.filename}`);

        // Remove migration record
        await prisma.$executeRaw`
            DELETE FROM "_migrations" WHERE id = ${migration.id}
        `;

        console.log(`✅ Migration ${migration.filename} rolled back`);
        console.log('⚠️  Note: This only removes the migration record. Manual schema cleanup may be required.');

    } catch (error) {
        console.error('❌ Rollback failed:', error);
        throw error;
    }
};

// Get migration status
export const getMigrationStatus = async (): Promise<{
    applied: number;
    pending: number;
    migrations: Array<{
        id: string;
        filename: string;
        status: 'applied' | 'pending';
        appliedAt?: Date;
    }>;
}> => {
    try {
        await createMigrationTable();

        const appliedMigrations = await prisma.$queryRaw<Array<{
            id: string;
            filename: string;
            applied_at: Date;
        }>>`
            SELECT id, filename, applied_at FROM "_migrations" 
            ORDER BY applied_at
        `;

        const migrationFiles = loadMigrationFiles();
        const appliedSet = new Set(appliedMigrations.map((m: any) => m.id));

        const migrations = migrationFiles.map(file => {
            const applied = appliedMigrations.find((m: any) => m.id === file.id);
            return {
                id: file.id,
                filename: file.filename,
                status: appliedSet.has(file.id) ? 'applied' as const : 'pending' as const,
                appliedAt: applied?.applied_at,
            };
        });

        return {
            applied: appliedMigrations.length,
            pending: migrationFiles.length - appliedMigrations.length,
            migrations,
        };

    } catch (error) {
        console.error('❌ Failed to get migration status:', error);
        throw error;
    }
};

// CLI interface for migrations
if (require.main === module) {
    const command = process.argv[2];

    switch (command) {
        case 'run':
            runMigrations()
                .then(() => process.exit(0))
                .catch(() => process.exit(1));
            break;

        case 'status':
            getMigrationStatus()
                .then(status => {
                    console.log(`Applied: ${status.applied}`);
                    console.log(`Pending: ${status.pending}`);
                    console.log('\nMigrations:');
                    status.migrations.forEach(m => {
                        const statusIcon = m.status === 'applied' ? '✅' : '⏳';
                        console.log(`  ${statusIcon} ${m.filename} (${m.status})`);
                    });
                })
                .then(() => process.exit(0))
                .catch(() => process.exit(1));
            break;

        case 'rollback':
            rollbackLastMigration()
                .then(() => process.exit(0))
                .catch(() => process.exit(1));
            break;

        default:
            console.log('Usage: tsx migrate.ts [run|status|rollback]');
            process.exit(1);
    }
}