const reviews = [
  {
    stars: 5,
    text: "Extremely easy to use and very intuitive. I use it almost every day for work.",
    name: "Maria T.",
  },
  {
    stars: 5,
    text: "Best free PDF tool I've found. Fast, simple, and the results are always perfect.",
    name: "James K.",
  },
  {
    stars: 5,
    text: "Love how the files are automatically deleted after 2 hours. Privacy matters to me.",
    name: "Sandra M.",
  },
];

export default function ReviewsSection() {
  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-10">
          <div className="text-3xl text-amber-400 mb-1.5">
            {"★★★★"}
            <span className="opacity-50">★</span>
          </div>
          <div className="text-sm text-gray-500 font-medium">
            4.5 out of 5 &middot; 1,874 Google Reviews
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {reviews.map((r, i) => (
            <div
              key={i}
              className="bg-gray-50 rounded-xl p-6 border border-gray-100"
            >
              <div className="text-amber-400 text-base mb-2.5">
                {"★".repeat(r.stars)}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed italic mb-3">
                &ldquo;{r.text}&rdquo;
              </p>
              <span className="text-[12.5px] text-gray-400 font-semibold">
                &mdash; {r.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
