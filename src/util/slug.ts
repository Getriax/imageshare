const ALPHABET = "abcdefghijklmnopqrstuvwxyz234567";
const SLUG_LENGTH = 8;

export function generateSlug(): string {
  const bytes = new Uint8Array(SLUG_LENGTH);
  crypto.getRandomValues(bytes);
  let slug = "";
  for (let i = 0; i < SLUG_LENGTH; i++) {
    slug += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return slug;
}

export const SLUG_REGEX = /^[a-z2-7]{8}$/;
