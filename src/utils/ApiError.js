class ApiError extends Error {
  constructor(status, message = "Something went wrong", err = [], stack = "") {
    super(message);
    this.status = status;
    this.message = message;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = err;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };
