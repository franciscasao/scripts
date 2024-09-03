const fs = require("fs");
const path = require("path");

const readVideosFromDataFolder = (startYear, endYear) => {
  const dataDir = path.join(".", "data", "videos");
  let videos = [];

  if (!fs.existsSync(dataDir)) {
    console.error(`Directory ${dataDir} does not exist.`);
    return videos;
  }

  const files = fs.readdirSync(dataDir);

  files.forEach((file) => {
    const filePath = path.join(dataDir, file);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const fileVideos = JSON.parse(fileContent);

    fileVideos.forEach((video) => {
      const year = new Date(video.publishedAt).getFullYear();
      if (year >= startYear && year <= endYear) {
        videos.push(video);
      }
    });
  });

  return videos;
};

module.exports = readVideosFromDataFolder;
