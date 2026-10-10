export class ApiError extends Error {
    statusCode: number;
    errors: Record<string, unknown>[];
    isOperational: boolean;

    constructor(
        statusCode: number,
        message: string,
        errors: Record<string, unknown>[] = [],
        isOperational = true,
        stack?: string
    ) {
        super(message);

        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.errors = errors;
        this.isOperational = isOperational;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    toJSON() {
        return {
            success: false,
            statusCode: this.statusCode,
            message: this.message,
            ...(this.errors.length > 0 && { errors: this.errors }),
        };
    }
}