const express = require('express')
const path = require('path')
const bcrypt = require('bcrypt')
const db = require('./db')

const app = express()
const PORT = 3000

app.use(express.static(path.join(__dirname, 'page')))
app.use(express.urlencoded({ extended: true }))

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
    res.send('<script>alert("로그인 성공!");</script>')
  } else {
    res.send(
      '<script>alert("비밀번호가 틀렸습니다."); history.back();</script>'
    )
  }
})

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
