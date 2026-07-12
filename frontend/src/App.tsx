import { FormEvent, useState } from "react";

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

function App() {
  const [url, setUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/api/shorten", {
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
    } catch (error) {
      console.error("Error shortening URL:", error);
    }
  };

  const handleCopy = async () => {
    if (!shortUrl) {
      return;
    }

    await navigator.clipboard.writeText(shortUrl);
    setIsCopied(true);
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10 text-black">
      <section className="w-full max-w-4xl">
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
              className="min-w-0 flex-1 border-4 border-black bg-white px-5 py-4 text-base font-bold outline-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] placeholder:text-black/55 focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://really-long-link-you-want-to-shrink.com"
              type="url"
              value={url}
            />
            <button
              className="border-4 border-black bg-[#00a6ff] px-8 py-4 text-lg font-black uppercase transition-transform duration-100 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none"
              type="submit"
            >
              Shorten
            </button>
          </form>

          {shortUrl ? (
            <div className="mt-8 border-4 border-black bg-[#a4f58c] p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.18em]">Your short link</p>
                  <a
                    className="mt-2 block break-all text-2xl font-black underline decoration-4 underline-offset-4"
                    href={shortUrl}
                  >
                    {shortUrl}
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
    </main>
  );
}

export default App;
