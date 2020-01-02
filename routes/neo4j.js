const Router = require('koa-router')
const koa_jwt = require('koa-jwt')
const router = new Router({ prefix: '/neo4j' })
const { find, findByName, findHuaXueTable, create, findSanJiaoByName, findByType ,duiTuan} = require('../control/neo4j')
const { secret } = require('../params.js')
const auth = koa_jwt({ secret })

// 获取化学table信息数据
router.get('/hxTable', auth, findHuaXueTable)
//  查所有图数据库信息
router.get('/', auth, find)

// 查反应类型
router.get('/type', auth, findByType)
// 根据huaXueShi查相关数据 一对多
router.get('/:huaXueShi', auth, findByName)
// 增加节点和关系
router.post('/', auth, create)
// 物质推断
router.get('/tuiduan/three',duiTuan)
// 查三角
router.get('/sanjiao/:huaXueShi', findSanJiaoByName)


module.exports = router

