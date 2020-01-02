const Koa = require('koa')
const app = new Koa()
const db = require('./db')
const parameter = require('koa-parameter')
const koaError = require('koa-json-error')
const bodyParser = require('koa-bodyparser');
const cors = require('koa-cors')

~(async () => {
  await db
  // 允许跨域
  app.use(cors())
  app.use(koaError({ //错误处理中间件
    postFormat(err, { stack, ...rest }) {
      // 生产环境=上线环境
      return process.env.NODE_ENV === 'production' ? rest : { stack, ...rest }
    }
  }))
  app.use(bodyParser());
  app.use(parameter(app)) //参数检验



  //批量注册路由
  require('./routes/index')(app)
})()

app.listen(4000, (err) => {
  if (err) throw err
  console.log('服务器启动在4000端口')
})
