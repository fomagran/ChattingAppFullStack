import express from "express";
import { Message } from "./models/Message";
import chatRouter from "./routers/ChatRouter";

const app = express();
app.use(express.json());
let http = require("http").Server(app);
let io = require("socket.io")(http);

app.use("/api", chatRouter);

const chat = io.of("/chat");

chat.on("connection", function (socket: any) {
  socket.on("welcome", (message: Message) => {
    socket.join(message.room);
    chat.in(message.room).emit("welcome", message);
  });

  socket.on("message", (message: Message) => {
    chat.in(message.room).emit("message", message);
  });

  socket.on("leave", (message: Message) => {
    socket.leave(message.room);
    chat.in(message.room).emit("leave", message);
  });
});

http.listen(3001, function () {
  console.log("listening on:3001");
});
