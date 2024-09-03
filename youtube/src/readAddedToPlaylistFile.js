const fs = require("fs");
const path = require("path");

const readAddedToPlaylistFile = (playlistId) => {
  const statusFilePath = path.join(".", "data", "playlistFiles", `${playlistId}.json`);
  if (fs.existsSync(statusFilePath)) {
    const fileContent = fs.readFileSync(statusFilePath, "utf-8");
    return JSON.parse(fileContent);
  }
  return [];
};

module.exports = readAddedToPlaylistFile;
