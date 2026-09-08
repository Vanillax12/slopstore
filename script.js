const APP_DIRECTORY = "apps";

// The site figures out its GitHub owner/repository from the GitHub Pages URL.
// Example: https://vanillax12.github.io/slop-store/
// becomes owner = vanillax12, repo = slop-store.
function getRepository() {
  const host = location.hostname;
  const match = host.match(/^([^.]+)\.github\.io$/i);

  if (!match) {
    throw new Error(
      "this page needs to be hosted on GitHub Pages (or configure getRepository() manually)"
    );
  }

  const owner = match[1];
  const pathParts = location.pathname.split("/").filter(Boolean);
  const repo = pathParts[0];

  if (!repo) {
    throw new Error("couldn't detect the GitHub repository name");
  }

  return { owner, repo };
}

const searchBox = document.querySelector("#search");
const appsElement = document.querySelector("#apps");
const statusElement = document.querySelector("#status");
const countElement = document.querySelector("#count");
const githubLink = document.querySelector("#githubLink");

let allApps = [];

function displayName(filename) {
  return filename
    .replace(/\.apk$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}

function rawUrl(owner, repo, path) {
  return `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/main/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

function githubFileUrl(owner, repo, path) {
  return `https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/blob/main/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

async function getDescription(owner, repo, txtFile) {
  if (!txtFile) return "";

  const response = await fetch(rawUrl(owner, repo, txtFile.path), {
    cache: "no-store"
  });

  if (!response.ok) return "";
  return (await response.text()).trim();
}

async function getFiles(owner, repo) {
  const url =
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}` +
    `/contents/${APP_DIRECTORY}`;

  const response = await fetch(url, {
    headers: { Accept: "application/vnd.github+json" }
  });

  if (!response.ok) {
    throw new Error(`GitHub API returned ${response.status}`);
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    throw new Error(`${APP_DIRECTORY}/ is not a directory`);
  }

  return data;
}

async function makeAppList(files, owner, repo) {
  const fileByName = new Map(
    files
      .filter(file => file.type === "file")
      .map(file => [file.name.toLowerCase(), file])
  );

  const apks = files.filter(
    file => file.type === "file" && file.name.toLowerCase().endsWith(".apk")
  );

  return Promise.all(apks.map(async apk => {
    const baseName = apk.name.slice(0, -4);
    const icon = fileByName.get(`${baseName}.png`.toLowerCase());
    const txtFile = fileByName.get(`${baseName}.txt`.toLowerCase());
    const description = await getDescription(owner, repo, txtFile);

    return {
      name: displayName(apk.name),
      filename: apk.name,
      path: `${APP_DIRECTORY}/${apk.name}`,
      description,
      iconUrl: icon ? rawUrl(owner, repo, icon.path) : null,
      apkUrl: rawUrl(owner, repo, apk.path),
      githubUrl: githubFileUrl(owner, repo, apk.path)
    };
  }));
}

function render(apps) {
  appsElement.innerHTML = "";
  countElement.textContent = `${apps.length} app${apps.length === 1 ? "" : "s"}`;

  if (!apps.length) {
    appsElement.innerHTML = `<div class="empty">no slop found. add some .apk files to ${APP_DIRECTORY}/</div>`;
    return;
  }

  for (const app of apps) {
    const card = document.createElement("article");
    card.className = "app";

    const icon = document.createElement("img");
    icon.className = "icon";
    icon.alt = `${app.name} icon`;
    icon.src = app.iconUrl || "";
    icon.onerror = () => {
      icon.removeAttribute("src");
    };

    const info = document.createElement("div");
    info.className = "app-info";
    info.innerHTML = `
      <h2 class="app-name"></h2>
      <div class="app-file"></div>
    `;
    info.querySelector(".app-name").textContent = app.name;
    info.querySelector(".app-file").textContent = app.filename;

    const download = document.createElement("a");
    download.className = "download";
    download.href = app.apkUrl;
    download.download = app.filename;
    download.textContent = "download";
    download.setAttribute("aria-label", `Download ${app.name}`);

    card.append(icon, info, download);
    appsElement.appendChild(card);
  }
}

async function start() {
  try {
    const { owner, repo } = getRepository();
    githubLink.href = `https://github.com/${owner}/${repo}`;

    const files = await getFiles(owner, repo);
    allApps = await makeAppList(files, owner, repo);

    statusElement.hidden = true;
    render(allApps);
  } catch (error) {
    console.error(error);
    statusElement.className = "status error";
    statusElement.textContent =
      `couldn't detect the slop: ${error.message}. ` +
      `make sure the repository is public and ${APP_DIRECTORY}/ exists.`;
    countElement.textContent = "";
  }
}

searchBox.addEventListener("input", () => {
  const query = searchBox.value.trim().toLowerCase();

  render(
    allApps.filter(app =>
      app.name.toLowerCase().includes(query) ||
      app.filename.toLowerCase().includes(query)
    )
  );
});

start();
