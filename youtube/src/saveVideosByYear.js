const fs = require("fs");
const path = require("path");

const videosDir = path.join(".", "data", "videos");

const saveVideosByYear = (videos) => {
  const videosByYear = {};

  let filteredVideos = videos.filter((video) => video.title !== "Private video");
  filteredVideos.forEach((video) => {
    const year = new Date(video.publishedAt).getFullYear();

    if (!videosByYear[year]) videosByYear[year] = [];
    videosByYear[year].push(video);
  });

  if (!fs.existsSync(videosDir)) fs.mkdirSync(videosDir);

  Object.keys(videosByYear).forEach((year) => {
    const filePath = path.join(videosDir, `${year}.json`);
    let existingVideos = [];

    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      existingVideos = JSON.parse(fileContent);
    }

    const newVideos = videosByYear[year].filter(
      (newVideo) => !existingVideos.some((existingVideo) => existingVideo.videoId === newVideo.videoId)
    );

    if (newVideos.length > 0) {
      const updatedVideos = existingVideos.concat(newVideos);

      fs.writeFileSync(filePath, JSON.stringify(updatedVideos, null, 2));
      console.log(`Saved ${newVideos.length} new videos for year ${year} to ${filePath}`);
    } else console.log(`No new videos to save for year ${year}`);
  });
};

module.exports = saveVideosByYear;
