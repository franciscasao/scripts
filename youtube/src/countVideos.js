const fs = require("fs");
const path = require("path");

const countVideos = () => {
  const dataDir = path.join(".", "data", "videos");
  const videoCounts = {};

  if (!fs.existsSync(dataDir)) {
    console.error(`Directory ${dataDir} does not exist.`);
    return videoCounts;
  }

  const files = fs.readdirSync(dataDir);

  files.forEach((file) => {
    const filePath = path.join(dataDir, file);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const videos = JSON.parse(fileContent);

    videos.forEach((video) => {
      const year = new Date(video.publishedAt).getFullYear();

      if (!videoCounts[year]) {
        videoCounts[year] = 0;
      }

      videoCounts[year]++;
    });
  });

  return videoCounts;
};

const counts = countVideos();
console.log(counts);
