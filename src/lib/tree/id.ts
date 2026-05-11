const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

export function newNodeId(): string {
  let id = '';
  for (let i = 0; i < 8; i++) {
    id += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return id;
}
