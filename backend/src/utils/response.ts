export class AppError extends Error {
  statusCode: number;
  errors?: Record<string, string[]>;
  isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    errors?: Record<string, string[]>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ApiResponse<T = unknown> {
  static success<T>(
    data: T,
    message: string = 'Success',
    statusCode: number = 200
  ) {
    return {
      success: true,
      message,
      data,
      statusCode,
    };
  }

  static created<T>(data: T, message: string = 'Created successfully') {
    return {
      success: true,
      message,
      data,
      statusCode: 201,
    };
  }

  static noContent(message: string = 'Deleted successfully') {
    return {
      success: true,
      message,
      statusCode: 204,
    };
  }

  static error(
    message: string = 'An error occurred',
    statusCode: number = 500,
    errors?: Record<string, string[]>
  ) {
    return {
      success: false,
      message,
      statusCode,
      errors,
    };
  }

  static paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
    message: string = 'Success'
  ) {
    const totalPages = Math.ceil(total / limit);
    return {
      success: true,
      message,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      statusCode: 200,
    };
  }
}
