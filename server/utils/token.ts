export function newToken() {
  const token = new BigUint64Array(2);
  token[0] = BigInt(Date.now());
  crypto.getRandomValues(token.subarray(1));
  if (token[0] === 0n || token[1] === 0n) {
    throw new Error("Token generation failed");
  }
  return new Uint8Array(token.buffer);
}