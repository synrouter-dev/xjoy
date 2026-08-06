interface PlaceholderCardProps {
  title: string;
  body: string;
}

export function PlaceholderCard({ title, body }: PlaceholderCardProps) {
  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 p-6">
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
        {title}
      </h2>
      <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
        {body}
      </p>
    </div>
  );
}
