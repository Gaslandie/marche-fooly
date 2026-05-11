document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".main-header");

  const updateHeader = () => {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 12);
  };

  updateHeader();
  window.addEventListener("scroll", updateHeader);

  const revealItems = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  revealItems.forEach(item => observer.observe(item));

  const countdown = {
    days: document.querySelector("[data-countdown='days']"),
    hours: document.querySelector("[data-countdown='hours']"),
    minutes: document.querySelector("[data-countdown='minutes']")
  };

  if (countdown.days && countdown.hours && countdown.minutes) {
    const end = Date.now() + 1000 * 60 * 60 * 48 + 1000 * 60 * 32;

    setInterval(() => {
      const diff = Math.max(0, end - Date.now());
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);

      countdown.days.textContent = String(days).padStart(2, "0");
      countdown.hours.textContent = String(hours).padStart(2, "0");
      countdown.minutes.textContent = String(minutes).padStart(2, "0");
    }, 1000);
  }
});