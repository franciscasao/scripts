require("dotenv").config();

const http = require("http");
const https = require("https");
const url = require("url");
const { google } = require("googleapis");
const crypto = require("crypto");
const express = require("express");
const session = require("express-session");
const readVideosFromDataFolder = require("./src/readVideosFromDataFolder");

const oauth2Client = new google.auth.OAuth2(process.env.CLIENT_ID, process.env.CLIENT_SECRET, process.env.REDIRECT_URI);

// Access scopes for read-only Drive activity.
const scopes = ["https://www.googleapis.com/auth/youtube"];
let userCredential = null;

async function main() {
  const app = express();

  app.use(
    session({
      secret: "your_secure_secret_key", // Replace with a strong secret
      resave: false,
      saveUninitialized: false,
    })
  );

  app.get("/", async (req, res) => {
    const state = crypto.randomBytes(32).toString("hex");
    req.session.state = state;

    const authorizationUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      include_granted_scopes: true,
      state: state,
    });

    res.redirect(authorizationUrl);
  });

  app.get("/oauth2callback", async (req, res) => {
    let q = url.parse(req.url, true).query;

    if (q.error) console.log("Error:" + q.error);
    else if (q.state !== req.session.state) {
      console.log("State mismatch. Possible CSRF attack");
      res.end("State mismatch. Possible CSRF attack");
    } else {
      let { tokens } = await oauth2Client.getToken(q.code);
      userCredential = tokens;
    }

    res.end("Authentication successful! You can close this tab now.");
  });

  const readStatusFile = () => {
    const statusFilePath = path.join(__dirname, "data", "status.json");
    if (fs.existsSync(statusFilePath)) {
      const fileContent = fs.readFileSync(statusFilePath, "utf-8");
      return JSON.parse(fileContent);
    }
    return {};
  };

  const saveStatusFile = (status) => {
    const statusFilePath = path.join(__dirname, "data", "status.json");
    fs.writeFileSync(statusFilePath, JSON.stringify(status, null, 2));
  };

  const insertVideoToPlaylist = async (playlistId, video) => {
    try {
      await axios.post(
        "https://www.googleapis.com/youtube/v3/playlistItems",
        {
          snippet: {
            playlistId: playlistId,
            position: 0,
            resourceId: {
              kind: "youtube#video",
              videoId: video.videoId,
            },
          },
        },
        {
          params: {
            part: "snippet",
            key: API_KEY,
          },
        }
      );
      console.log(`Inserted video ${video.videoId} into playlist ${playlistId}`);
      return true;
    } catch (error) {
      console.error(`Failed to insert video ${video.videoId}: ${error.message}`);
      return false;
    }
  };

  app.post("/insert/:playlist", async (req, res) => {
    const playlistId = req.params["playlist"];
    const startYear = parseInt(req.query.startYear);
    const endYear = parseInt(req.query.endYear);

    const videos = readVideosFromDataFolder(startYear, endYear);
    const status = readStatusFile();

    for (const video of videos) {
      if (status[video.videoId] && status[video.videoId].addedToPlaylist) {
        console.log(`Video ${video.videoId} already added to playlist ${playlistId}`);
        continue;
      }

      const added = await insertVideoToPlaylist(playlistId, video);
      if (added) {
        status[video.videoId] = { addedToPlaylist: true };
      }
    }

    saveStatusFile(status);

    res.end(`${videos.length} videos processed for playlist ${playlistId}`);
  });

  app.post("/insert/:playlist", async (req, res) => {
    const playlistId = req.params["playlist"];
    const startYear = parseInt(req.query.startYear);
    const endYear = parseInt(req.query.endYear);

    const videos = readVideosFromDataFolder(startYear, endYear);
    const status = readStatusFile();

    oauth2Client.setCredentials(userCredential);
    const youtube = google.youtube({ version: "v3", auth: oauth2Client });
    for (const video of videos) {
      if (status[video.videoId] && status[video.videoId].addedToPlaylist) {
        console.log(`Video ${video.videoId} already added to playlist ${playlistId}`);
        continue;
      }

      try {
        await youtube.playlistItems.insert({
          part: "snippet",
          resource: {
            snippet: {
              playlistId: playlistId,
              resourceId: {
                kind: "youtube#video",
                videoId: video.videoId,
              },
            },
          },
        });
        console.log(`Inserted video ${video.videoId} into playlist ${playlistId}`);
      } catch (error) {
        console.error(`Failed to insert video ${video.videoId}: ${error.message}`);
      }
    }

    res.end(`${videos.length} videos inserted into playlist`);
  });

  app.get("/revoke", async (req, res) => {
    let postData = "token=" + userCredential.access_token;

    // Options for POST request to Google's OAuth 2.0 server to revoke a token
    let postOptions = {
      host: "oauth2.googleapis.com",
      port: "443",
      path: "/revoke",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    // Set up the request
    const postReq = https.request(postOptions, function (res) {
      res.setEncoding("utf8");
      res.on("data", (d) => {
        console.log("Response: " + d);
      });
    });

    postReq.on("error", (error) => {
      console.log(error);
    });

    // Post the request with data
    postReq.write(postData);
    postReq.end();
  });

  const server = http.createServer(app);
  server.listen(3000);
  console.log("Server listening on port 3000");
}
main().catch(console.error);
