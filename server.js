// server.js

"use strict";

const staticServer = require("node-static");
const path = require("path");
const http = require("http");

const DEST_PATH = path.normalize("./dest");
const PORT = 3000;
const HOST_NAME = "localhost";
const HOST = `${HOST_NAME}:${PORT}`

const fileServer = new staticServer.Server(DEST_PATH, {
  indexFile: "assets/index.html"
});

http.createServer( (request, response) => {
  request.addListener("end", () => {
    fileServer.serve(request, response);
  }).resume();
}).listen(PORT, HOST_NAME, () => {
  console.log(`Start listening ${HOST}`);
});
