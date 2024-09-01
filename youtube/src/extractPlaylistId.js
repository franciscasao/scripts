const extractPlaylistId = (url) => {
  const urlObj = new URL(url);
  return urlObj.searchParams.get("list");
};

module.exports = extractPlaylistId;
