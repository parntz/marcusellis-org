export function PullQuote({ quote, attribution }: { quote: string; attribution?: string }) {
  return (
    <figure className="border-l border-gold-200 pl-6">
      <blockquote className="font-serif text-3xl leading-tight text-ivory md:text-5xl">“{quote}”</blockquote>
      {attribution ? <figcaption className="mt-4 text-sm uppercase tracking-[0.25em] text-gold-200">{attribution}</figcaption> : null}
    </figure>
  );
}
