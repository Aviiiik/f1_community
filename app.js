const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const mysql = require("mysql2");
const app = express();
const port = 3000;
const http = require("http");
const { Server } = require("socket.io");
const server = http.createServer(app);
const io = new Server(server);

const connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "root",
  database: "f1_community",
});

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL: " + err.stack);
    return;
  }
  console.log("Connected to MySQL as id " + connection.threadId);
});

app.use(bodyParser.urlencoded({ extended: true }));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "views")));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.render("Landing");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/signup", (req, res) => {
  const name = req.body.name;
  const dob = req.body.dob;
  const gender = req.body.gender;
  const username = req.body.username;
  const password = req.body.password;
  const email = req.body.email;

  if (!name || !dob || !gender || !username || !password || !email) {
    return res.status(400).send("All fields are required.");
  }

  const sql =
    "INSERT INTO users (name, dob, gender, username, password, email) VALUES (?, ?, ?, ?, ?, ?)";
  connection.query(
    sql,
    [name, dob, gender, username, password, email],
    (err, results) => {
      if (err) {
        console.error("Error executing MySQL query: " + err.stack);
        return res.status(500).send("Internal Server Error");
      }

      console.log("User successfully registered with ID: " + results.insertId);
      res.send(
        '<script>alert("User successfully registered!"); window.location.href="/login";</script>'
      );
    }
  );
});

app.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const roomname = req.body.roomname;

  if (!username || !password || !roomname) {
    return res
      .status(400)
      .send("Username, password, and roomname are required.");
  }

  const sql = "SELECT * FROM users WHERE username = ? AND password = ?";
  connection.query(sql, [username, password], (err, results) => {
    if (err) {
      console.error("Error executing MySQL query: " + err.stack);
      return res.status(500).send("Internal Server Error");
    }

    if (results.length === 1) {
      console.log("User successfully logged in with ID: " + results[0].id);
      res.redirect(`/chatroom?username=${username}&roomname=${roomname}`);
    } else {
      res.send(
        '<script>alert("Invalid credentials!"); window.location.href="/login";</script>'
      );
    }
  });
});

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("message", (data) => {
    io.emit("message", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

app.get("/chatroom", (req, res) => {
  const { username, roomname } = req.query;
  res.render("chatroom", { username, roomname });
});

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
