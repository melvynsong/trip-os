const valuePoints = [
  'Plan your itinerary in one place',
  'Discover places and restaurants for your trip',
  'Organise your journey more easily',
  'Turn your trip into stories and memories you can share',
]

export default function ValueSection() {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white px-6 py-8 shadow-[0_18px_50px_rgba(15,23,42,0.07)] sm:px-8 sm:py-10">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Value</p>
        <h2 className="mt-3 font-serif text-3xl text-slate-900">Travel planning that feels calm, clear, and memorable.</h2>
        <ul className="mt-6 grid gap-3 text-sm leading-7 text-slate-700 sm:text-base">
          {valuePoints.map((item) => (
            <li key={item} className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
