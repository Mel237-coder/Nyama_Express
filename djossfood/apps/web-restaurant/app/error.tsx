'use client';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h2 className="text-2xl font-bold">Une erreur est survenue</h2>
      <p className="mt-2 text-muted-foreground">
        Something went wrong. Please try again.
      </p>
      <button
        className="mt-4 rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
        onClick={() => reset()}
      >
        Réessayer
      </button>
    </div>
  );
}