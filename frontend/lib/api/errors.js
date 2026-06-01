export class BeaconAPIError extends Error {
  constructor(error, message, fields, httpStatus) {
    super(message)
    this.name       = "BeaconAPIError"
    this.error      = error
    this.fields     = fields
    this.httpStatus = httpStatus
  }

  get isAuth()       { return this.error === "auth" }
  get isValidation() { return this.error === "validation" }
  get isNotFound()   { return this.error === "not_found" }
  get isPermission() { return this.error === "permission" }
  get isThrottled()  { return this.error === "throttled" }
  get isServer()     { return this.error === "server" }

  fieldError(fieldName) {
    if (!this.fields) return null
    const errs = this.fields[fieldName]
    return errs && errs.length > 0 ? errs[0] : null
  }
}

export function parseAPIError(body, httpStatus) {
  if (
    body &&
    typeof body.error   === "string" &&
    typeof body.message === "string"
  ) {
    return new BeaconAPIError(
      body.error,
      body.message,
      body.fields ?? null,
      httpStatus,
    )
  }

  return new BeaconAPIError(
    "server",
    "An unexpected error occurred.",
    null,
    httpStatus,
  )
}

export function isBeaconAPIError(err) {
  return err instanceof BeaconAPIError
}