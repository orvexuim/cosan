export class ApiResponse {
  constructor(statusCode, success, message, data = null, errors = null) {
    this.statusCode = statusCode;
    this.success = success;
    this.message = message;
    if (data !== null) this.data = data;
    if (errors !== null) this.errors = errors;
  }

  static success(data, message = 'Success', statusCode = 200) {
    return new ApiResponse(statusCode, true, message, data);
  }

  static error(message = 'An error occurred', statusCode = 500, errors = null) {
    return new ApiResponse(statusCode, false, message, null, errors);
  }
}

export default ApiResponse;
