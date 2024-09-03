require("dotenv").config();

const fs = require("fs");
const http = require("http");
const https = require("https");
const url = require("url");
const path = require("path");
const crypto = require("crypto");
const express = require("express");
const session = require("express-session");
const { google } = require("googleapis");

const readVideosFromDataFolder = require("./src/readVideosFromDataFolder");
const readAddedToPlaylistFile = require("./src/readAddedToPlaylistFile");

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

  app.post("/insert/:playlist", async (req, res) => {
    const playlistId = req.params["playlist"];
    const startYear = parseInt(req.query.startYear);
    const endYear = parseInt(req.query.endYear);

    const videos = readVideosFromDataFolder(startYear, endYear);
    const playlistItems = readAddedToPlaylistFile(playlistId);
    console.log(`Read ${playlistItems.length} videos from playlist ${playlistId}`);

    oauth2Client.setCredentials(userCredential);
    const youtube = google.youtube({ version: "v3", auth: oauth2Client });
    for (const video of videos) {
      if (playlistItems.includes(video.videoId)) {
        console.log(`Video ${video.videoId} already added to playlist ${playlistId}. Skipping...`);
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
        playlistItems.push(video.videoId);
        console.log(`Inserted video ${video.videoId} into playlist ${playlistId}`);
      } catch (error) {
        console.error(`Failed to insert video ${video.videoId}: ${error.message}`);
        break;
      }
    }

    const statusFilePath = path.join(".", "data", "playlistFiles", `${playlistId}.json`);
    fs.writeFileSync(statusFilePath, JSON.stringify(playlistItems, null, 2));
    console.log(`${playlistItems.length} total videos inserted into playlist`);

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
