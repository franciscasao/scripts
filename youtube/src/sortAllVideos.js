const fs = require("fs");
const path = require("path");

const videosDir = path.join(".", "data", "videos");

const sortVideosByUpdatedDate = (videos) => {
  return videos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
};

const sortAllVideos = () => {
  if (!fs.existsSync(videosDir)) {
    console.error(`Directory ${videosDir} does not exist.`);
    return;
  }

  const files = fs.readdirSync(videosDir);

  files.forEach((file) => {
    const filePath = path.join(videosDir, file);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    let videos = JSON.parse(fileContent);

    videos = sortVideosByUpdatedDate(videos);

    fs.writeFileSync(filePath, JSON.stringify(videos, null, 2));
    console.log(`Sorted videos in file ${filePath}`);
  });
};

module.exports = sortAllVideos;
