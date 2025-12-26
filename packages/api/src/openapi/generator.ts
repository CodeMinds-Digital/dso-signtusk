import type { OpenAPIObject, PathsObject } from '@hono/zod-openapi';
import { openAPISpec } from './spec';

/**
 * Generate OpenAPI specification with dynamic paths
 */
export function generateOpenAPISpec(additionalPaths: PathsObject = {}): OpenAPIObject {
    return {
        ...openAPISpec,
        paths: {
            ...openAPISpec.paths,
            ...additionalPaths
        }
    };
}

/**
 * Add custom endpoint to OpenAPI spec
 */
export function addEndpointToSpec(
    method: string,
    path: string,
    operation: any
): OpenAPIObject {
    const currentPaths = openAPISpec.paths || {};

    if (!currentPaths[path]) {
        currentPaths[path] = {};
    }

    currentPaths[path][method.toLowerCase()] = operation;

    return {
        ...openAPISpec,
        paths: currentPaths
    };
}

/**
 * Generate operation object for OpenAPI
 */
export function createOperation(config: {
    summary: string;
    description?: string;
    tags?: string[];
    security?: any[];
    parameters?: any[];
    requestBody?: any;
    responses: Record<string, any>;
    operationId?: string;
}) {
    return {
        summary: config.summary,
        description: config.description,
        tags: config.tags || [],
        security: config.security,
        parameters: config.parameters || [],
        requestBody: config.requestBody,
        responses: {
            '400': { $ref: '#/components/responses/BadRequest' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
            '429': { $ref: '#/components/responses/TooManyRequests' },
            '500': { $ref: '#/components/responses/InternalServerError' },
            ...config.responses
        },
        operationId: config.operationId
    };
}

/**
 * Create paginated response schema
 */
export function createPaginatedResponse(itemSchema: any) {
    return {
        type: 'object',
        required: ['data', 'pagination'],
        properties: {
            data: {
                type: 'array',
                items: itemSchema
            },
            pagination: {
                $ref: '#/components/schemas/PaginatedResponse/properties/pagination'
            }
        }
    };
}

/**
 * Create standard CRUD operations for a resource
 */
export function createCRUDOperations(resourceName: string, schema: any) {
    const capitalizedName = resourceName.charAt(0).toUpperCase() + resourceName.slice(1);

    return {
        list: createOperation({
            summary: `List ${resourceName}s`,
            description: `Retrieve a paginated list of ${resourceName}s`,
            tags: [capitalizedName + 's'],
            parameters: [
                { $ref: '#/components/parameters/Page' },
                { $ref: '#/components/parameters/Limit' },
                { $ref: '#/components/parameters/Sort' },
                { $ref: '#/components/parameters/Order' }
            ],
            responses: {
                '200': {
                    description: `List of ${resourceName}s`,
                    content: {
                        'application/json': {
                            schema: createPaginatedResponse(schema)
                        }
                    }
                }
            },
            operationId: `list${capitalizedName}s`
        }),

        create: createOperation({
            summary: `Create ${resourceName}`,
            description: `Create a new ${resourceName}`,
            tags: [capitalizedName + 's'],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: schema
                    }
                }
            },
            responses: {
                '201': {
                    description: `${capitalizedName} created successfully`,
                    content: {
                        'application/json': {
                            schema: schema
                        }
                    }
                }
            },
            operationId: `create${capitalizedName}`
        }),

        get: createOperation({
            summary: `Get ${resourceName}`,
            description: `Retrieve a specific ${resourceName} by ID`,
            tags: [capitalizedName + 's'],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    schema: { type: 'string' },
                    description: `${capitalizedName} ID`
                }
            ],
            responses: {
                '200': {
                    description: `${capitalizedName} details`,
                    content: {
                        'application/json': {
                            schema: schema
                        }
                    }
                }
            },
            operationId: `get${capitalizedName}`
        }),

        update: createOperation({
            summary: `Update ${resourceName}`,
            description: `Update an existing ${resourceName}`,
            tags: [capitalizedName + 's'],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    schema: { type: 'string' },
                    description: `${capitalizedName} ID`
                }
            ],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: schema
                    }
                }
            },
            responses: {
                '200': {
                    description: `${capitalizedName} updated successfully`,
                    content: {
                        'application/json': {
                            schema: schema
                        }
                    }
                }
            },
            operationId: `update${capitalizedName}`
        }),

        delete: createOperation({
            summary: `Delete ${resourceName}`,
            description: `Delete a ${resourceName}`,
            tags: [capitalizedName + 's'],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    schema: { type: 'string' },
                    description: `${capitalizedName} ID`
                }
            ],
            responses: {
                '204': {
                    description: `${capitalizedName} deleted successfully`
                }
            },
            operationId: `delete${capitalizedName}`
        })
    };
}