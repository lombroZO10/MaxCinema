const required = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"];
const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
  console.error(`Missing Supabase environment variables: ${missing.join(", ")}`);
  console.error("Create .env.local from .env.example and restart the dev server.");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

try {
  new URL(url);
} catch {
  console.error("NEXT_PUBLIC_SUPABASE_URL is not a valid URL.");
  process.exit(1);
}

console.log("Supabase environment variables are present.");
