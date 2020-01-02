
const Router = require('koa-router')
const koa_jwt = require('koa-jwt')
const router = new Router({ prefix: '/users' })
const { create, find, findById, update, del,
  login, checkOwner
} = require('../control/user.js')
const { secret } = require('../params.js')
const auth = koa_jwt({ secret })

// 新建用户 返回当前用户
router.post('/', create)
// 查询所有用户返回用户列表
router.get('/', find)

// 根据id查特定用户
router.get('/:id', findById)

// 在登录态下修改用户
router.patch('/:id', auth, checkOwner, update)
// 载登陆态下删除用户
router.delete('/:id', auth, checkOwner, del)
// 登录
router.post('/login', login)
module.exports = router