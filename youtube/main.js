const fs = require("fs");
const path = require("path");

const fetchPlaylistVideos = require("./src/fetchPlaylistVideos");
const saveVideosByYear = require("./src/saveVideosByYear");
const extractPlaylistId = require("./src/extractPlaylistId");
const sortAllVideos = require("./src/sortAllVideos");
const playlistUrls = require("./data/playlistURLs");

const dataDir = path.join(__dirname, "data", "playlists");

const fileExists = (filePath) => {
  return fs.existsSync(filePath);
};

const processPlaylists = async () => {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  for (const url of playlistUrls) {
    const playlistId = extractPlaylistId(url);
    const filePath = path.join(dataDir, `${playlistId}.json`);

    let videos = [];
    if (fileExists(filePath)) {
      console.debug(`Playlist ${playlistId} already processed. Skipping...`);
      videos = JSON.parse(fs.readFileSync(filePath));
    } else {
      console.debug(`Processing playlist: ${playlistId}`);
      videos = await fetchPlaylistVideos(playlistId);
      console.debug(`Fetched ${videos.length} videos`);
      fs.writeFileSync(filePath, JSON.stringify(videos, null, 2));
      console.debug(`Saved videos to ${filePath}`);
    }

    saveVideosByYear(videos);
  }
  sortAllVideos();

  console.log("All playlists processed!");
};

processPlaylists().catch((error) => console.error(error));
