const express = require("express"); // Express 라이브러리를 가져옴
const mysql = require("mysql2"); // MySQL 데이터베이스와의 통신을 위한 라이브러리
const dotenv = require("dotenv"); // 환경 변수를 로드하기 위한 라이브러리
const cors = require("cors"); // CORS 미들웨어를 가져옴

dotenv.config(); // .env 파일에서 환경 변수를 로드하여 process.env에 설정

const app = express(); // Express 애플리케이션을 생성
const port = process.env.PORT; // 환경 변수에서 서버 포트 번호를 가져옴

// MySQL 데이터베이스 연결 설정
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to the database:", err); // 데이터베이스 연결 오류 처리
    return;
  }
  console.log("Connected to the database"); // 데이터베이스 연결 성공 메시지
});

app.use(cors()); // CORS 미들웨어를 사용하여 다른 도메인에서의 요청을 허용
app.use(express.json()); // 요청 본문을 JSON 형식으로 파싱

// 모든 게시글을 가져오는 엔드포인트
app.get("/posts", (req, res) => {
  db.query("SELECT * FROM posts ORDER BY date DESC", (err, results) => {
    if (err) {
      console.error("Error fetching posts:", err); // 게시글 가져오기 오류 처리
      res.status(500).json({ error: err.message }); // 오류 응답
      return;
    }
    res.json(results); // 게시글 목록을 JSON 형식으로 응답
  });
});

// 특정 ID의 게시글을 가져오는 엔드포인트
app.get("/posts/:id", (req, res) => {
  const postId = req.params.id;
  db.query("SELECT * FROM posts WHERE id = ?", [postId], (err, results) => {
    if (err) {
      console.error("Error fetching post by ID:", err); // 게시글 가져오기 오류 처리
      res.status(500).json({ error: err.message }); // 오류 응답
      return;
    }
    if (results.length === 0) {
      res.status(404).json({ error: "Post not found" }); // 게시글이 없을 경우 404 응답
      return;
    }
    res.json(results[0]); // 게시글을 JSON 형식으로 응답
  });
});

// 특정 게시글의 댓글을 가져오는 엔드포인트
app.get("/posts/:id/comments", (req, res) => {
  const postId = req.params.id;
  db.query(
    "SELECT * FROM comments WHERE post_id = ? ORDER BY date DESC",
    [postId],
    (err, results) => {
      if (err) {
        console.error("Error fetching comments:", err); // 댓글 가져오기 오류 처리
        res.status(500).json({ error: err.message }); // 오류 응답
        return;
      }
      res.json(results); // 댓글 목록을 JSON 형식으로 응답
    }
  );
});

// 새로운 게시글을 생성하는 엔드포인트
app.post("/posts", (req, res) => {
  const { title, content, author, userId, date } = req.body;
  const query =
    "INSERT INTO posts (title, content, author, userId, date) VALUES (?, ?, ?, ?, ?)";

  db.query(query, [title, content, author, userId, date], (err, results) => {
    if (err) {
      console.error("Error inserting new post:", err); // 게시글 삽입 오류 처리
      res.status(500).json({ error: err.message }); // 오류 응답
      return;
    }
    res
      .status(201)
      .json({ id: results.insertId, title, content, author, userId, date }); // 생성된 게시글의 정보를 응답
  });
});

// 게시글을 수정하는 엔드포인트
app.put("/posts/:id", (req, res) => {
  const postId = req.params.id;
  const { title, content, date } = req.body;
  const query =
    "UPDATE posts SET title = ?, content = ?, date = ? WHERE id = ?";
  db.query(query, [title, content, date, postId], (err, results) => {
    if (err) {
      console.error("Error updating post:", err); // 게시글 수정 오류 처리
      res.status(500).json({ error: err.message }); // 오류 응답
      return;
    }
    res.status(200).json({ message: "Post updated successfully" }); // 성공 메시지 응답
  });
});

// 게시글을 삭제하는 엔드포인트
app.delete("/posts/:id", (req, res) => {
  const postId = req.params.id;
  const query = "DELETE FROM posts WHERE id = ?";
  db.query(query, [postId], (err, results) => {
    if (err) {
      console.error("Error deleting post:", err); // 게시글 삭제 오류 처리
      res.status(500).json({ error: err.message }); // 오류 응답
      return;
    }
    res.status(200).json({ message: "Post deleted successfully" }); // 성공 메시지 응답
  });
});

// 새로운 댓글을 생성하는 엔드포인트
app.post("/posts/:id/comments", (req, res) => {
  const { author, userId, date, content } = req.body;
  const postId = req.params.id;
  const query =
    "INSERT INTO comments (post_id, author, userId, date, content) VALUES (?, ?, ?, ?, ?)";

  db.query(query, [postId, author, userId, date, content], (err, results) => {
    if (err) {
      console.error("Error inserting new comment:", err); // 댓글 삽입 오류 처리
      res.status(500).json({ error: err.message }); // 오류 응답
      return;
    }
    res
      .status(201)
      .json({ id: results.insertId, postId, author, userId, date, content }); // 생성된 댓글의 정보를 응답
  });
});

// 서버를 지정된 포트에서 실행
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
