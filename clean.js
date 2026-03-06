import { readdir, rm } from "fs/promises";

const owner = "DataFlowAnalysis";
const repo = "OnlineEditor";

const branches = await fetch(
  `https://api.github.com/repos/${owner}/${repo}/branches`,
  {
    headers: {
      Authorization: `Bearer ${process.env.TOKEN}`,
      Accept: "application/vnd.github+json",
    },
  },
)
  .then((res) => res.json())
  .then((data) => data.map((b) => b.name));

const files = (await getFiles(".")).filter((p) => p.length > 0);
for (const file of files) {
  let doDelete = false;
  if (file.startsWith("branches/")) {
    if (!branches.includes(file.substring(9, file.length - 1))) {
      doDelete = true;
    }
  } else if (file.startsWith("prs/")) {
    const prNumber = Number(file.substring(4, file.length - 1));
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.TOKEN}`,
          Accept: "application/vnd.github+json",
        },
      },
    );
    if (response.status === 404) {
        doDelete = true;
        continueM
    }
    const prData = await response.json();
    if (prData.state !== "open") {
      doDelete = true;
    }
  }

  if (doDelete) {
    console.log(`Deleting ${file}`);
    await rm(file, { recursive: true });
  }
}

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
