import { FormEvent, useState } from "react";
import { BackgroundShapes } from "./BackgroundShapes";
import { useLocalStorage } from "./hooks/useLocalStorage";

interface HistoryItem {
  id: string;
  originalUrl: string;
  shortUrl: string;
}

function CopyIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9 9h10v10H9z"
        fill="currentColor"
        stroke="black"
        strokeWidth="1.5"
      />
      <path
        d="M5 5h10v2H7v8H5z"
        fill="currentColor"
        stroke="black"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function HistoryCard({ item, onDelete }: { item: HistoryItem; onDelete: (id: string) => void }) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    const copyText = item.shortUrl.replace(/^https?:\/\//, "").replace(/^www\./, "");
    await navigator.clipboard.writeText(copyText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-3 border-4 border-black bg-[#ffb8eb] p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <p className="truncate text-sm font-bold opacity-75" title={item.originalUrl}>
          {item.originalUrl}
        </p>
        <a
          className="mt-1 block truncate text-lg font-black underline decoration-2 underline-offset-4"
          href={item.shortUrl}
          target="_blank"
          rel="noreferrer"
        >
          {item.shortUrl.replace(/^https?:\/\//, "").replace(/^www\./, "")}
        </a>
      </div>
      <div className="mt-2 flex shrink-0 gap-2 sm:mt-0">
        <button
          className="inline-flex items-center gap-1 border-4 border-black bg-[#ffe45e] px-3 py-2 text-xs font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
          onClick={handleCopy}
          type="button"
        >
          <CopyIcon />
          {isCopied ? "Copied" : "Copy"}
        </button>
        <button
          className="inline-flex items-center justify-center border-4 border-black bg-[#ff5e5e] px-3 py-2 text-xs font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
          onClick={() => onDelete(item.id)}
          title="Delete"
          type="button"
        >
          <svg className="h-5 w-5" fill="none" stroke="black" strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function App() {
  const [url, setUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useLocalStorage<HistoryItem[]>("shortened-urls", []);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDeleteHistory = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/shorten`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: trimmedUrl }),
      });

      if (!response.ok) {
        console.error("Failed to shorten URL");
        return;
      }

      const data = await response.json();
      setShortUrl(data.short_url);
      setIsCopied(false);

      const newHistoryItem: HistoryItem = {
        id: Date.now().toString(),
        originalUrl: trimmedUrl,
        shortUrl: data.short_url,
      };

      setHistory((prev) => {
        const updated = [newHistoryItem, ...prev.filter((i) => i.originalUrl !== trimmedUrl)];
        return updated.slice(0, 50);
      });
    } catch (error) {
      console.error("Error shortening URL:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!shortUrl) {
      return;
    }

    const copyText = shortUrl.replace(/^https?:\/\//, "").replace(/^www\./, "");
    await navigator.clipboard.writeText(copyText);
    setIsCopied(true);
  };

  return (
    <main className="relative z-0 flex min-h-screen items-center justify-center px-5 pb-24 pt-10 text-black">
      <BackgroundShapes />
      
      <button
        className="absolute right-6 top-6 z-20 flex items-center gap-2 border-4 border-black bg-[#ff9900] px-4 py-2 font-black uppercase text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none sm:right-8 sm:top-8"
        onClick={() => setIsModalOpen(true)}
        type="button"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        History
      </button>

      <section className="relative z-10 w-full max-w-4xl">
        <div className="border-4 border-black bg-[#FFFFFF] p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] sm:p-10">
          <p className="mb-4 inline-block border-4 border-black bg-[#7cff65] px-3 py-1 text-sm font-black uppercase tracking-[0.2em] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            URL shortener
          </p>
          <h1 className="text-5xl leading-none font-black uppercase text-[#e5e5e5] [-webkit-text-stroke:2px_black] [text-shadow:4px_4px_0_#000000] sm:text-7xl">
            make it short
          </h1>
          <p className="mt-5 max-w-2xl text-base font-bold uppercase tracking-[0.08em] sm:text-lg">
            Paste a long link, smash the button, and get a compact URL with zero fuss.
          </p>

          <form className="mt-8 flex flex-col gap-4 sm:flex-row" onSubmit={handleSubmit}>
            <input
              className="min-w-0 flex-1 border-4 border-black bg-white px-5 py-4 text-base font-bold outline-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] placeholder:text-black/55 focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-75 disabled:cursor-not-allowed"
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://really-long-link-you-want-to-shrink.com"
              type="url"
              value={url}
              disabled={isLoading}
            />
            <button
              className={`border-4 border-black bg-[#00a6ff] px-8 py-4 text-lg font-black uppercase transition-transform duration-100 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${
                isLoading
                  ? "cursor-not-allowed opacity-80"
                  : "hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none"
              }`}
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="h-5 w-5 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      fill="currentColor"
                    ></path>
                  </svg>
                  Shortening...
                </span>
              ) : (
                "Shorten"
              )}
            </button>
          </form>

          {error ? (
            <div className="mt-8 border-4 border-black bg-[#ff5e5e] p-4 text-center font-bold uppercase shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-black">
              {error}
            </div>
          ) : null}

          {shortUrl && !error ? (
            <div className="mt-8 border-4 border-black bg-[#a4f58c] p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.18em]">Your short link</p>
                  <a
                    className="mt-2 block break-all text-2xl font-black underline decoration-4 underline-offset-4"
                    href={shortUrl}
                  >
                    {shortUrl.replace(/^https?:\/\//, "").replace(/^www\./, "")}
                  </a>
                </div>
                <button
                  className="inline-flex items-center gap-2 self-start border-4 border-black bg-[#ffe45e] px-4 py-3 text-sm font-black uppercase transition-transform duration-100 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none"
                  onClick={handleCopy}
                  type="button"
                >
                  <CopyIcon />
                  {isCopied ? "Copied" : "Copy link"}
                </button>
              </div>
            </div>
          ) : null}

        </div>
      </section>

      <footer className="absolute bottom-6 left-6 z-10 flex flex-col gap-2 font-bold uppercase text-black sm:bottom-8 sm:left-8">
        <p className="inline-block w-max border-2 border-black bg-[#ff9900] px-2 py-1 text-xs tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] sm:text-sm">
          Made by Harxhe
        </p>
        <div className="flex gap-4 text-xs tracking-wider sm:text-sm">
          <a
            className="hover:underline hover:decoration-2 hover:underline-offset-4"
            href="https://github.com/harxhe"
            rel="noreferrer"
            target="_blank"
          >
            GitHub
          </a>
          <a
            className="hover:underline hover:decoration-2 hover:underline-offset-4"
            href="https://www.linkedin.com/in/harxhe"
            rel="noreferrer"
            target="_blank"
          >
            LinkedIn
          </a>
          <a
            className="hover:underline hover:decoration-2 hover:underline-offset-4"
            href="https://www.harxhe.dev"
            rel="noreferrer"
            target="_blank"
          >
            Portfolio
          </a>
        </div>
      </footer>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="flex w-full max-w-3xl flex-col border-4 border-black bg-white shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between border-b-4 border-black bg-[#ff9900] p-4">
              <h2 className="text-2xl font-black uppercase text-black">Your Links</h2>
              <button
                className="inline-flex items-center justify-center border-4 border-black bg-[#ff5e5e] p-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
                onClick={() => setIsModalOpen(false)}
                title="Close"
                type="button"
              >
                <svg className="h-6 w-6" fill="none" stroke="black" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto p-4 sm:p-6 bg-[#f4f4f4]">
              {history.length > 0 ? (
                history.map((item) => (
                  <HistoryCard item={item} key={item.id} onDelete={handleDeleteHistory} />
                ))
              ) : (
                <p className="py-8 text-center text-lg font-bold uppercase text-black/50">
                  No links shortened yet.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default App;
