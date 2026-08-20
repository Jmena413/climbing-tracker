import { PRODUCT_NAME } from "@climbing-tracker/config";

export default function Home() {
  return (
    <main>
      <p className="eyebrow">Foundation ready</p>
      <h1>{PRODUCT_NAME}</h1>
      <p>Fast bouldering session logging, built for the wall.</p>
      <section aria-labelledby="auth-heading">
        <h2 id="auth-heading">Authentication setup</h2>
        <p>
          Connect Supabase environment variables to enable sign-in in the
          session logging milestone.
        </p>
      </section>
    </main>
  );
}
