import { hash } from '@node-rs/argon2';

async function main() {
  const password = process.argv[2];
  if (!password) {
    console.error('Usage: pnpm tsx scripts/hash-password.ts <password>');
    process.exit(1);
  }
  const out = await hash(password, {
    memoryCost: 19_456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });
  console.log(out);
}

main();
