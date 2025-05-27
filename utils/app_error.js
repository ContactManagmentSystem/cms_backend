class AppError extends Error {
  constructor(message) {
    super();
    this.message = message;
  }
  getCode() {
    return 500;
  }
}

class BadRequest extends AppError {
  constructor(message) {
    super(message);
    this.message = message;
  }
  getCode() {
    return 400;
  }
}

class NotFound extends AppError {
  constructor(message) {
    super(message);
    this.message = message;
  }
  getCode() {
    return 404;
  }
}
class Unauthorized extends AppError {
  constructor(message) {
    super(message);
  }
  getCode() {
    return 401;
  }
}
class Forbidden extends AppError {
  constructor(message) {
    super(message);
  }
  getCode() {
    return 403;
  }
}

module.exports = { AppError, BadRequest, NotFound, Unauthorized, Forbidden };
