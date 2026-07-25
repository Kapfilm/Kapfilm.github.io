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
