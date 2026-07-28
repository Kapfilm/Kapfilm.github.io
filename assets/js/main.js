const themeToggle = document.querySelector(".theme-toggle");

themeToggle.addEventListener("click", () => {
  const currentTheme = document.documentElement.dataset.theme;
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const nextTheme = currentTheme
    ? (currentTheme === "dark" ? "light" : "dark")
    : (systemPrefersDark ? "light" : "dark");

  document.documentElement.dataset.theme = nextTheme;
  localStorage.setItem("theme", nextTheme);
});

document.querySelector("#year").textContent = new Date().getFullYear();

const heroCarousel = document.querySelector(".hero-visual");
const heroSlides = [...document.querySelectorAll(".hero-slide")];
const carouselDots = [...document.querySelectorAll(".carousel-dot")];
const carouselTitle = document.querySelector(".carousel-title");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let activeSlide = 0;
let carouselTimer;

function showHeroSlide(index) {
  activeSlide = (index + heroSlides.length) % heroSlides.length;

  heroSlides.forEach((slide, slideIndex) => {
    const isActive = slideIndex === activeSlide;
    slide.classList.toggle("is-active", isActive);
    slide.setAttribute("aria-hidden", String(!isActive));
    slide.tabIndex = isActive ? 0 : -1;
  });

  carouselDots.forEach((dot, dotIndex) => {
    const isActive = dotIndex === activeSlide;
    dot.classList.toggle("is-active", isActive);
    dot.setAttribute("aria-pressed", String(isActive));
  });

  carouselTitle.textContent = heroSlides[activeSlide].dataset.title;
}

function stopHeroCarousel() {
  window.clearInterval(carouselTimer);
}

function startHeroCarousel() {
  stopHeroCarousel();
  if (!reduceMotion.matches) {
    carouselTimer = window.setInterval(() => showHeroSlide(activeSlide + 1), 4500);
  }
}

carouselDots.forEach((dot) => {
  dot.addEventListener("click", () => {
    showHeroSlide(Number(dot.dataset.slide));
    startHeroCarousel();
  });
});

heroCarousel.addEventListener("mouseenter", stopHeroCarousel);
heroCarousel.addEventListener("mouseleave", startHeroCarousel);
heroCarousel.addEventListener("focusin", stopHeroCarousel);
heroCarousel.addEventListener("focusout", (event) => {
  if (!heroCarousel.contains(event.relatedTarget)) startHeroCarousel();
});
reduceMotion.addEventListener("change", startHeroCarousel);
startHeroCarousel();

document.querySelectorAll(".screenshot-disclosure").forEach((details) => {
  const label = details.querySelector("summary > span:first-child");
  details.addEventListener("toggle", () => {
    label.textContent = details.open ? "Скрыть скриншоты" : "Показать скриншоты";
  });
});

const latestReleaseRequests = new Map();

function latestReleaseAsset(repository, extension) {
  if (!latestReleaseRequests.has(repository)) {
    const request = fetch(`https://api.github.com/repos/${repository}/releases/latest`, {
      headers: { Accept: "application/vnd.github+json" },
    })
      .then((response) => {
        if (!response.ok) throw new Error(`GitHub API returned ${response.status}`);
        return response.json();
      });

    latestReleaseRequests.set(repository, request);
  }

  return latestReleaseRequests.get(repository).then((release) => {
    const asset = release.assets.find(({ name }) =>
      name.toLowerCase().endsWith(extension.toLowerCase())
    );

    if (!asset) throw new Error(`Release asset ${extension} was not found`);
    return asset.browser_download_url;
  });
}

document.querySelectorAll("[data-latest-release]").forEach((link) => {
  const repository = link.dataset.latestRelease;
  const extension = link.dataset.assetExtension;
  const releaseAsset = latestReleaseAsset(repository, extension);

  releaseAsset
    .then((downloadUrl) => {
      link.href = downloadUrl;
      link.dataset.latestReleaseResolved = "true";
    })
    .catch(() => {
      // The original link remains a reliable fallback to the latest release page.
    });

  link.addEventListener("click", async (event) => {
    if (link.dataset.latestReleaseResolved === "true") return;

    event.preventDefault();
    link.setAttribute("aria-busy", "true");

    try {
      window.location.assign(await releaseAsset);
    } catch {
      window.location.assign(link.href);
    } finally {
      link.removeAttribute("aria-busy");
    }
  });
});
