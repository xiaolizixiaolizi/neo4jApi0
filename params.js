// 
const productionDB = 'mongodb://localhost:27017/neo4jApi' //线上环境
const devDB = 'mongodb://localhost:27017/neo4jApi' //本地环境
const DB_URL = process.env.NODE_ENV === 'production' ? productionDB : devDB

module.exports = {
  DB_URL,
  secret: 'neo4jApi_secret'
}