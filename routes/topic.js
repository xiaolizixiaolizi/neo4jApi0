const Router = require('koa-router')
const router = new Router({ prefix: '/topics' })

router.get('/', ctx => {
  let res = { url, path, query, querystring } = ctx

  ctx.body = { url, path, query, querystring }
})

module.exports = router