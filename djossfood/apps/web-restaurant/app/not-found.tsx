export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h2 className="text-2xl font-bold">Page introuvable</h2>
      <p className="mt-2 text-muted-foreground">
        La page que vous recherchez n&apos;existe pas.
      </p>
    </div>
  );
}