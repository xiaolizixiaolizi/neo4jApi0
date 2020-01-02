
const mongoose = require('mongoose')
const {DB_URL}=require('../params')
module.exports = new Promise((resolve, reject) => {
  mongoose.connect(DB_URL, { useNewUrlParser: true,useUnifiedTopology: true ,useFindAndModify: false})
  mongoose.connection.on('open', err => {
    if (err) return reject(err)
    console.log('数据库链接成功')
    resolve()
  })
})