/**
 * Unicode-safe Base64 encoding via TextEncoder and btoa.
 * Standard window.btoa fails when given code points > 0xFF (e.g. emojis 🔥,
 * smart quotes, en-dashes "2017–2019", accented letters).
 * This function first encodes UTF-8 code points to a Uint8Array byte sequence,
 * and then converts each byte (0-255) to a Latin1 binary string before btoa.
 */
export function encodeBase64Unicode(str: string): string {
  if (typeof str !== 'string') {
    throw new TypeError('encodeBase64Unicode requires a string input');
  }
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  const CHUNK_SIZE = 8192;
  const len = utf8Bytes.length;
  for (let i = 0; i < len; i += CHUNK_SIZE) {
    const chunk = utf8Bytes.subarray(i, i + CHUNK_SIZE);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

/**
 * Unicode-safe Base64 decoding via atob and TextDecoder.
 * Strips any whitespace / newline characters commonly introduced by GitHub Contents API
 * (which wraps Base64 lines at 60 characters). Converts binary string to Uint8Array,
 * then decodes UTF-8 bytes into a standard JavaScript Unicode string.
 */
export function decodeBase64Unicode(base64: string): string {
  if (typeof base64 !== 'string') {
    throw new TypeError('decodeBase64Unicode requires a string input');
  }
  const clean = base64.replace(/\s+/g, '');
  if (!clean) return '';
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    const code = binary.charCodeAt(i);
    bytes[i] = code;
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Safe wrapper around decodeBase64Unicode that catches decoding errors
 * and returns a fallback string.
 */
export function tryDecodeBase64Unicode(base64: string, fallback = ''): string {
  try {
    return decodeBase64Unicode(base64);
  } catch {
    return fallback;
  }
}
