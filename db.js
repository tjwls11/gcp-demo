require('dotenv').config()
const mysql = require('mysql2/promise')

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'test1234',
  database: 'database_name',
})

module.exports = db
