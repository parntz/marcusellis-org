"use client";

type Props = {
  categories: string[];
  activeCategory: string;
  search: string;
  onSearch: (value: string) => void;
  onCategory: (value: string) => void;
};

export function SearchAndFilterBar({ categories, activeCategory, search, onSearch, onCategory }: Props) {
  return (
    <div className="rounded-[2rem] border border-ivory/10 bg-ivory/[0.04] p-4">
      <label className="sr-only" htmlFor="resource-search">Search resources</label>
      <input
        id="resource-search"
        className="focus-ring w-full rounded-full border border-ivory/15 bg-charcoal/70 px-5 py-3 text-ivory placeholder:text-ivory/40"
        placeholder="Search by title, speaker, category, or description"
        value={search}
        onChange={(event) => onSearch(event.target.value)}
      />
      <div className="mt-4 flex flex-wrap gap-2">
        {["All", ...categories].map((category) => (
          <button
            key={category}
            type="button"
            className={`focus-ring rounded-full px-4 py-2 text-sm transition ${
              activeCategory === category ? "bg-gold-200 text-forest-950" : "bg-ivory/10 text-ivory/70 hover:bg-ivory/15"
            }`}
            onClick={() => onCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}
