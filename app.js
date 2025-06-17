const express = require('express')
const path = require('path')
const bcrypt = require('bcryptjs')
const db = require('./db')
const session = require('express-session')
const dotenv = require('dotenv')

dotenv.config()

const app = express()
const PORT = 3000

app.use(express.static(path.join(__dirname, 'page')))
app.use(express.urlencoded({ extended: true }))
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
)

app.get('/', (req, res) => {
  res.redirect('/login.html')
})

app.post('/signup', async (req, res) => {
  const { id, pw } = req.body
  const hash = await bcrypt.hash(pw, 10)
  try {
    await db.query('INSERT INTO users (username, password) VALUES (?, ?)', [
      id,
      hash,
    ])
    res.send(
      '<script>alert("회원가입 완료!"); location.href="/login.html";</script>'
    )
  } catch (err) {
    res.send(
      '<script>alert("회원가입 실패: 중복 아이디일 수 있음"); history.back();</script>'
    )
  }
})

app.post('/login', async (req, res) => {
  const { id, pw } = req.body
  const [[user]] = await db.query('SELECT * FROM users WHERE username = ?', [
    id,
  ])

  if (!user) {
    return res.send(
      '<script>alert("존재하지 않는 사용자입니다."); history.back();</script>'
    )
  }

  const match = await bcrypt.compare(pw, user.password)
  if (match) {
    req.session.user = {
      id: user.username,
      joined: user.created_at,
      lastLogin: new Date(),
    }
    await db.query('UPDATE users SET last_login = NOW() WHERE username = ?', [
      id,
    ])
    res.redirect('/mypage')
  } else {
    res.send(
      '<script>alert("비밀번호가 틀렸습니다."); history.back();</script>'
    )
  }
})

app.get('/mypage', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login.html')
  }
  const { id, joined, lastLogin } = req.session.user
  res.send(`
    <h2>[정보]</h2>
    <div>아이디 : ${id}</div>
    <div>가입일 : ${joined ? joined : '-'}</div>
    <div>마지막 로그인 : ${lastLogin ? lastLogin : '-'}</div>
    <br>
    <a href="/logout">[로그아웃]</a> | <a href="/change-id">[아이디바꾸기]</a>
  `)
})

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login.html')
  })
})

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
