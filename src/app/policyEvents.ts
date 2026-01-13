// Binds language buttons on policy pages (Privacy/Terms/GDPR/About).
// Uses event delegation so it survives re-renders and avoids duplicate listeners.

export type Lang = "en" | "ru" | "ua";

type Deps = {
  routeRoot: HTMLElement;
  setLang: (lang: Lang) => void;
};

let inited = false;

export function initPolicyLangEvents({ routeRoot, setLang }: Deps) {
  if (inited) return;
  inited = true;

  routeRoot.addEventListener("click", (e) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    const btn = target.closest("button[data-lang]") as HTMLButtonElement | null;
    if (!btn) return;

    const lang = (btn.dataset.lang || "").toLowerCase() as Lang;
    if (lang !== "en" && lang !== "ru" && lang !== "ua") return;

    e.preventDefault();
    setLang(lang);
  });
}