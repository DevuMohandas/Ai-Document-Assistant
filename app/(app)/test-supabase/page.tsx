import { createClient } from "@/lib/supabase/server";

export default async function TestSupabasePage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return (
      <div>
        <h1>Supabase connection successful</h1>
        <p>No authenticated user yet.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Supabase connection successful</h1>
      <pre>{JSON.stringify(data.user, null, 2)}</pre>
    </div>
  );
}