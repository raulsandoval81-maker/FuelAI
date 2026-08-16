const VALID_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp"
]);


export class AiApiError extends Error {
  constructor(
    statusCode,
    code,
    message,
    details = {}
  ) {
    super(message);
    this.name = "AiApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}


export function boundedAiString(
  value,
  field,
  maximumLength,
  {
    required = false,
    errorCode = "INVALID_REQUEST",
    statusCode = 400,
    publicMessage = `${field} is too long.`
  } = {}
) {
  const normalized =
    String(value ?? "").trim();

  if (
    (required && !normalized) ||
    normalized.length > maximumLength
  ) {
    throw new AiApiError(
      statusCode,
      errorCode,
      publicMessage
    );
  }

  return normalized;
}


export function boundedAiStringArray(
  value,
  field,
  {
    maximumItems,
    maximumItemLength
  }
) {
  if (!Array.isArray(value)) {
    throw new AiApiError(
      400,
      "INVALID_REQUEST",
      `${field} must be a list.`
    );
  }

  if (
    value.length > maximumItems ||
    value.some(item => typeof item !== "string")
  ) {
    throw new AiApiError(
      400,
      "INVALID_REQUEST",
      `${field} has too many items.`
    );
  }

  const seen = new Set();

  return value
    .map(item =>
      boundedAiString(
        item,
        field,
        maximumItemLength
      )
    )
    .filter(item => {
      const key = item.toLowerCase();

      if (!item || seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}


function hasValidImageSignature(
  bytes,
  mimeType
) {
  if (mimeType === "image/jpeg") {
    return (
      bytes.length >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff
    );
  }

  if (mimeType === "image/png") {
    const signature = [
      0x89, 0x50, 0x4e, 0x47,
      0x0d, 0x0a, 0x1a, 0x0a
    ];

    return signature.every(
      (byte, index) =>
        bytes[index] === byte
    );
  }

  if (mimeType === "image/webp") {
    return (
      bytes.length >= 12 &&
      bytes.subarray(0, 4)
        .toString("ascii") === "RIFF" &&
      bytes.subarray(8, 12)
        .toString("ascii") === "WEBP"
    );
  }

  return false;
}


export function validateAiImageDataUrl(
  image,
  {
    maximumBytes,
    toolLabel
  }
) {
  const value =
    String(image ?? "").trim();

  const match =
    /^data:(image\/[a-z0-9.+-]+);base64,([a-z0-9+/=\r\n]+)$/i
      .exec(value);

  if (!match) {
    throw new AiApiError(
      415,
      "UNSUPPORTED_IMAGE",
      "Choose a JPEG, PNG, or WebP image."
    );
  }

  const mimeType =
    match[1].toLowerCase();

  if (!VALID_IMAGE_TYPES.has(mimeType)) {
    throw new AiApiError(
      415,
      "UNSUPPORTED_IMAGE",
      "Choose a JPEG, PNG, or WebP image."
    );
  }

  const bytes = Buffer.from(
    match[2].replace(/\s/g, ""),
    "base64"
  );

  if (!bytes.length) {
    throw new AiApiError(
      415,
      "UNSUPPORTED_IMAGE",
      "The selected image could not be read."
    );
  }

  if (bytes.length > maximumBytes) {
    throw new AiApiError(
      413,
      "IMAGE_TOO_LARGE",
      `Choose an image smaller than ${Math.floor(maximumBytes / 1024 / 1024)} MB.`
    );
  }

  if (!hasValidImageSignature(bytes, mimeType)) {
    throw new AiApiError(
      415,
      "UNSUPPORTED_IMAGE",
      "The image type does not match its contents."
    );
  }

  return value;
}


export function validateAiRequestId(value) {
  const requestId =
    String(value ?? "").trim();

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      .test(requestId)
  ) {
    throw new AiApiError(
      400,
      "INVALID_REQUEST",
      "A valid request ID is required."
    );
  }

  return requestId.toLowerCase();
}
