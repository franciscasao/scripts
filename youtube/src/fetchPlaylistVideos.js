require("dotenv").config();
const axios = require("axios");

// Replace with your API key
const API_KEY = process.env.YOUTUBE_API_KEY;

const fetchPlaylistVideos = async (playlistId) => {
  let videos = [];
  let nextPageToken = "";

  do {
    const response = await axios.get("https://www.googleapis.com/youtube/v3/playlistItems", {
      params: {
        part: "snippet",
        maxResults: 50,
        playlistId: playlistId,
        pageToken: nextPageToken,
        key: API_KEY,
      },
    });

    const items = response.data.items.map((item) => ({
      title: item.snippet.title,
      videoId: item.snippet.resourceId.videoId,
      publishedAt: item.snippet.publishedAt,
    }));

    videos = videos.concat(items);
    nextPageToken = response.data.nextPageToken;
  } while (nextPageToken);

  return videos;
};

module.exports = fetchPlaylistVideos;
