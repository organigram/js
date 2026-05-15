export const bytesToArrayBuffer = (
  value: ArrayBuffer | Uint8Array
): ArrayBuffer => {
  if (value instanceof ArrayBuffer) {
    return value
  }
  const bytes = new Uint8Array(value.byteLength)
  bytes.set(value)
  return bytes.buffer
}

export const bytesToBase64 = (bytes: ArrayBuffer | Uint8Array): string => {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(view).toString('base64')
  }
  let binary = ''
  for (let index = 0; index < view.length; index += 8192) {
    binary += String.fromCharCode(...view.slice(index, index + 8192))
  }
  return btoa(binary)
}

export const base64ToBytes = (value: string): Uint8Array => {
  if (typeof Buffer !== 'undefined') {
    return Uint8Array.from(Buffer.from(value, 'base64'))
  }
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

export const textToBytes = (value: string): Uint8Array =>
  new TextEncoder().encode(value)

export const bytesToText = (value: ArrayBuffer | Uint8Array): string =>
  new TextDecoder().decode(value)

export const bytesToBase64Url = (bytes: ArrayBuffer | Uint8Array): string =>
  bytesToBase64(bytes)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '')

export const base64UrlToBytes = (value: string): Uint8Array => {
  const base64 = value
    .replaceAll('-', '+')
    .replaceAll('_', '/')
    .padEnd(Math.ceil(value.length / 4) * 4, '=')
  return base64ToBytes(base64)
}
