export class RateLimitError extends Error {
  constructor() {
    super("Rate limit exceeded");
    this.name = "RateLimitError";
  }
}

export class PublicError extends Error {
  constructor(message: string) {
    super(message);
  }
}
