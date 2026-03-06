import { readdir, writeFile, readFile } from "fs/promises";

const owner = "DataFlowAnalysis";
const repo = "OnlineEditor";

// p.length > 0 filters out the root index.html file
const files = (await getFiles(".")).filter((p) => p.length > 0).sort();
const branchLinks = files
  .filter((p) => p.startsWith("branches/"))
  .map((p) => `<li><a href="${p}">${p.substring(9, p.length - 1)}</a></li>`)
  .join("");
const prLinks = await Promise.all(
  files
    .filter((p) => p.startsWith("prs/"))
    .map(async (p) => {
      const prNumber = Number(p.substring(4, p.length - 1));
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.TOKEN}`,
            Accept: "application/vnd.github+json",
          },
        },
      );
      const prData = await response.json();
      return `<li><a href="${p}">#${prNumber} - ${prData.title}</a></li>`;
    }),
);
const tagLinks = files
  .filter((p) => p.startsWith("tags/"))
  .map((p) => `<li><a href="${p}">${p.substring(5, p.length - 1)}</a></li>`)
  .join("");

let indexHtml = await readFile("./index.html", "utf-8");
const bodyContent = `<body>
<h1>Online Editor Staging</h1>
<h2>Staged PRs/Branches</h2>
<div id="branch-container">
<ul>
${prLinks.join("")}
${branchLinks}
</ul>
</div>
<h2>Staged Tags</h2>
<div id="tag-container">
<ul>
${tagLinks}
</ul>
</div>
</body>`;
indexHtml = indexHtml.replace(/<body>.*<\/body>/ms, bodyContent);

await writeFile("./index.html", indexHtml);

async function getFiles(dir) {
  const files = [];

  async function step(_dir) {
    const dirFiles = await readdir(_dir, { withFileTypes: true });
    for (const file of dirFiles) {
      if (file.isDirectory()) {
        await step(`${_dir}/${file.name}`);
      } else if (file.name.endsWith("index.html")) {
        files.push(`${_dir}/`);
      }
    }
  }

  await step(dir);

  return files.map((f) => f.substring(2));
}
