export class UnAuthorizedError extends Error {
  constructor(message: string) {
    super(message ?? 'Unauthorized error')
    this.name = 'UnAuthorizedError'
  }
}
