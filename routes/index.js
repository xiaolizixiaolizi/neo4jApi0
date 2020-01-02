const fs = require('fs')
const fileArr = fs.readdirSync(__dirname).filter(item => item !== 'index.js') //[ 'topic.js', 'user.js' ]
module.exports = (app) => {
  fileArr.forEach(item => {
    const router = require('./' + item)
    app.use(router.routes())
    app.use(router.allowedMethods())  //路由结束自动添加状态等
  })
}

