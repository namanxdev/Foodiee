"use client";

import Image from "next/image";

const galleryItems = [
  {
    title: "Midnight ramen blaze",
    description: "Broth clouds captured with torch-kissed pork and neon chili oils.",
    media:
      "https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg?auto=compress&cs=tinysrgb&w=900",
  },
  {
    title: "Charred mango ceviche",
    description: "Tropical sweetness meets smoked lime ash.",
    media:
      "https://images.pexels.com/photos/1059905/pexels-photo-1059905.jpeg?auto=compress&cs=tinysrgb&w=900",
  },
  {
    title: "Harissa ember chicken",
    description: "Saffron yogurt lava over glowing coals.",
    media:
      "https://images.pexels.com/photos/2673353/pexels-photo-2673353.jpeg?auto=compress&cs=tinysrgb&w=900",
  },
  {
    title: "Ghee roasted cauliflower",
    description: "Golden char, nutty crunch, and coriander sparks.",
    media:
      "https://images.pexels.com/photos/566345/pexels-photo-566345.jpeg?auto=compress&cs=tinysrgb&w=900",
  },
  {
    title: "Basque cheesecake brûlée",
    description: "Velvet center with caramelized crown and citrus mist.",
    media:
      "https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=900",
  },
  {
    title: "Smoked cocoa pavlova",
    description: "Crackled shell, molten ganache, ember sugar shards.",
    media:
      "https://images.pexels.com/photos/2228558/pexels-photo-2228558.jpeg?auto=compress&cs=tinysrgb&w=900",
  },
];

export function ChefGallery() {
  return (
    <section className="relative overflow-hidden px-6 py-24 sm:px-10 md:px-12 lg:px-16">
      <div className="mx-auto max-w-4xl text-center text-balance">
        <p className="text-xs uppercase tracking-[0.45em] text-[#FFD07F]/75">Chef’s Gallery</p>
        <h2 className="mt-4 text-4xl font-semibold text-white sm:text-5xl md:text-6xl">
          Hover to feel the heat.
        </h2>
        <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-white/70 sm:text-lg">
          AI-generated dishes that shimmer, steam, and glow. Each tile responds to your curiosity
          with tilt-to-zoom, aroma cues, and instant recipe access.
        </p>
      </div>

      <div className="mt-16 columns-1 gap-4 [column-fill:_balance] sm:columns-2 lg:columns-3">
        {galleryItems.map((item, index) => (
          <figure
            key={item.title}
            className="mb-4 break-inside-avoid rounded-3xl border border-white/10 bg-white/5 overflow-hidden backdrop-blur-2xl transition duration-500 hover:-translate-y-2 hover:shadow-[0_25px_55px_-22px_rgba(255,90,47,0.55)]"
          >
            <div className="relative aspect-[4/5] overflow-hidden">
              <Image
                src={item.media}
                alt={item.title}
                fill
                className="object-cover transition-transform duration-[1000ms] hover:scale-[1.08]"
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <span className="absolute right-4 top-4 rounded-full bg-black/60 px-3 py-1 text-xs uppercase tracking-[0.35em] text-[#FFD07F]/85">
                Shot {index + 1}
              </span>
            </div>
            <figcaption className="space-y-2 px-6 pb-6 pt-5 text-white">
              <h3 className="text-xl font-semibold">{item.title}</h3>
              <p className="text-sm text-white/70">{item.description}</p>
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-[#FFD07F]/80">
                <span>Generate again</span>
                <span className="text-sm">⟳</span>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

