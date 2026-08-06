interface ScreenHeaderProps {
  title: string;
  description?: string;
}

export function ScreenHeader({ title, description }: ScreenHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
        {title}
      </h1>
      {description && (
        <p className="mt-2 text-lg text-neutral-600 dark:text-neutral-400 max-w-prose">
          {description}
        </p>
      )}
    </div>
  );
}
