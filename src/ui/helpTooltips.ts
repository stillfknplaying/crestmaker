export function initHelpTooltips() {
  if ((window as any).__cmHelpTipsInit) return;
  (window as any).__cmHelpTipsInit = true;

  const closeAll = () => {
    document.querySelectorAll<HTMLElement>(".helpwrap.open").forEach((el) => el.classList.remove("open"));
  };

  document.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement | null)?.closest?.(".helpbtn") as HTMLElement | null;
    if (btn) {
      e.preventDefault();
      e.stopPropagation();
      const wrap = btn.closest(".helpwrap") as HTMLElement | null;
      if (!wrap) return;
      const isOpen = wrap.classList.contains("open");
      closeAll();
      if (!isOpen) wrap.classList.add("open");
      return;
    }
    if (!(e.target as HTMLElement | null)?.closest?.(".helpwrap")) closeAll();
  });

  document.addEventListener("keydown", (e) => {
    if ((e as KeyboardEvent).key === "Escape") closeAll();
  });
}