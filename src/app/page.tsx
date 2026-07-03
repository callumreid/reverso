import { GameExperience } from "@/components/GameExperience";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "VideoGame",
  name: "Reverso",
  url: "https://reverso.lol",
  description:
    "A pass-and-play party game where you record a phrase, hear it backwards, and challenge a friend to mimic the reversed audio. Their attempt gets flipped forward again and scored.",
  genre: ["Party game", "Word game"],
  gamePlatform: ["Web browser", "Mobile"],
  playMode: "MultiPlayer",
  numberOfPlayers: {
    "@type": "QuantitativeValue",
    minValue: 2,
  },
  applicationCategory: "Game",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  author: {
    "@type": "Organization",
    name: "HouseBoat Studios",
  },
};

const steps = [
  {
    title: "Say a phrase",
    body: "Player 1 records a short phrase — song lyric, movie quote, anything under ten seconds.",
  },
  {
    title: "Listen backwards",
    body: "Reverso flips the audio. Player 2 listens to the reversed gibberish as many times as they need.",
  },
  {
    title: "Mimic the gibberish",
    body: "Player 2 records their best imitation of the backwards nonsense, syllable by syllable.",
  },
  {
    title: "Flip it forward",
    body: "Reverso reverses the mimic. If they nailed it, the playback sounds eerily like the original phrase — and the score proves it.",
  },
];

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <GameExperience />
      <section
        aria-label="How to play Reverso"
        className="mx-auto flex w-full max-w-[430px] flex-col gap-6 px-6 pb-16 pt-4"
      >
        <h2 className="text-lg font-semibold lowercase tracking-[0.2em] text-[var(--text-primary)]">
          how to play
        </h2>
        <ol className="flex flex-col gap-4">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[rgba(8,0,23,0.7)] p-4"
            >
              <p className="text-xs lowercase tracking-[0.3em] text-[var(--accent-secondary)]">
                step {index + 1}
              </p>
              <h3 className="mt-1 font-semibold text-[var(--text-primary)]">{step.title}</h3>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{step.body}</p>
            </li>
          ))}
        </ol>
        <p className="text-sm text-[var(--text-secondary)]">
          Reverso is a free backwards-talking party game for two or more players. It runs
          right in your phone&apos;s browser — no app to install, no account to make. Grab a
          friend, pass the phone, and find out who can actually speak in reverse.
        </p>
        <footer className="border-t border-[var(--border-subtle)] pt-4 text-xs lowercase tracking-[0.2em] text-[var(--text-muted)]">
          made by houseboat studios · reverso.lol
        </footer>
      </section>
    </>
  );
}
