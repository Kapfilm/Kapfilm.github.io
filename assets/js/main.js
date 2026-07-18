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
