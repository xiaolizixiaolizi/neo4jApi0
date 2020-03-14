const Router = require('koa-router')
const koa_jwt = require('koa-jwt')
const router = new Router({ prefix: '/neo4j' })
const { findAll, findByName, findTree,findByCategory,findOneTOall,
  findByGouCheng,
  findFangChengId,findHuaXueTable, 
  create, findSanJiaoByName, findAllName,
  findByType ,duiTuan,xinDuiTuan,
  creatNode,creatLinks,fingFCid} = require('../control/neo4j')
const { secret } = require('../params.js')
const auth = koa_jwt({ secret })


// 获取化学table信息数据
router.get('/hxTable', auth, findHuaXueTable)
router.get('/findall/name',auth,findAllName)

//  查所有图数据库信息
router.get('/findAll/:number', auth, findAll)

//  查所有查所有的化学式-》做成tree
router.get('/tree', auth, findTree)
//查询某一类型物质构成
router.get('/goucheng/:goucheng',auth,findByGouCheng)
 
//查询某一类型物质比如说氧化物
router.get('/category/:category/:handler',auth,findByCategory)

// 查反应类型 eg 化合反应
router.get('/type/:type', auth, findByType)
//onetoall最新版本
router.get('/onetoall/:huaxueshi',auth,findOneTOall)
// 根据方程id获取此方程的所有信息
router.get('/fangcheng/:id',auth,fingFCid)
router.get('/fangchengid/:huaxueshi',auth,findFangChengId)

// 根据huaXueShi查相关数据 一对多
router.get('/:huaXueShi', auth, findByName)

// router.post('/', auth, create)
// 增加节点
router.post('/',auth,creatNode)

// 添加化学方程节点
router.post('/create/fcs',auth,creatLinks)
// 物质推断
router.post('/tuiduan/three',xinDuiTuan)
// 查三角
router.get('/sanjiao/:sanjiao', findSanJiaoByName)


module.exports = router

