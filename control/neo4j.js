const fs = require('fs')
const path = require('path')
const neo4j = require('neo4j-driver').v1;
const User = require('../model/User.js')
const { neo4jDataFormat } = require('../utils/index')

const driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "1991112230li"));

const session = driver.session()
module.exports = new class Neo4jCtl {
  async findHuaXueTable(ctx) {
    ctx.body = await new Promise((resolve, reject) => {
      fs.readFile(path.join(__dirname, '../data/huaxueTable.json'), 'utf8', (err, data) => {
        resolve(JSON.parse(data))
      })
    })
  }

  // create节点和关系
  async create(ctx) {
    // 获取参数 节点 关系和反应类型 说明
    /*
    startNode 开始节点元素 必选
    endNode 结束元素  必选
    startNodeLabel 所属类型 必选
     endNodeLabel 结束所属类型 必选
    startNodeTitle 属性 必选
    endNodeTitle 属性 必选
    actionType 反应类型 必选
    message 反应类型说明 可选
    */
    //  ${end_time ? '&end_time='+end_time : ''}

    let { startNode, startNodeLabel, startNodeTitle,
      endNode, endNodeLabel, endNodeTitle, actionType, message = '' } = ctx.request.body
    let statement = `MERGE (${startNode}:${startNodeLabel} {title:'${startNodeTitle}'})
    MERGE (${endNode}:${endNodeLabel} {title:'${endNodeTitle}'})
    CREATE
      (${startNode})-[:${actionType}${message ? " { message: ['" + message + "'] }" : ''}]->(${endNode})`

    await session.run(statement)

    session.close()
    // 登陆态下找到用户
    // const user = await User.findById(ctx.state.user._id)
    // 更新数据 push是错的
    await User.findByIdAndUpdate(
      ctx.state.user._id,
      { $push: { "huaXue": ctx.request.body } },
      { safe: true, upsert: true })
    ctx.body = { status: 200, message: '节点和关系插入成功' }
  }
  // 查所有数据
  async find(ctx) {
    let statement = 'MATCH (m)-[r]->(n) RETURN m ,n,r,type(r),m.title,labels(m),labels(n)'
    let data = await session.run(statement)
    session.close()
    ctx.body = data.records
  }
  // 根据特定物质查数据
  async findByName(ctx) {
    let { huaXueShi } = ctx.params
    let { type } = ctx.query
    let statement = `match (n)-[r]-(m) where n.huaXueShi="${huaXueShi}" return n,m,r`
    // o2作为反应物
    let statement1 = `match (n)-[r]->(m) where n.huaXueShi="${huaXueShi}" return n,m,r`
    // o2作为生成物
    let statement2 = `match (n)<-[r]-(m) where n.huaXueShi="${huaXueShi}" return n,m,r`
    let oneStatement = type === '全部' ? statement : (type === '反应物' ? statement1 : statement2)
    let response = await session.run(oneStatement)
    const data = neo4jDataFormat(response.records)
    session.close()
    ctx.body = data
  }
  // 查某一类化学反应
  async findByType(ctx) {
    let { type } = ctx.query
    let statement = `MATCH (a)-[r]->(b) where type(r)="${type}" and a:单质  RETURN a,b,r`
    ctx.body = { type: type }
    let response = await session.run(statement)
    const data = neo4jDataFormat(response.records)
    session.close()
    ctx.body = data
  }

  // 查三角反应关系
  async findSanJiaoByName(ctx) {
    let { huaXueShi } = ctx.params
    let statement = `match (a)-[r1]-(b)-[r2]-(c)-[r3]-(a) where a.huaXueShi='${huaXueShi}' return a,b,c,r1,r2,r3`
    let response = await session.run(statement)
    const data = neo4jDataFormat(response.records)
    session.close()
    ctx.body = data

  }
  //推断
  async duiTuan(ctx) {
    let { info } = ctx.query;
    let tempArr = info.split(' ').filter(e => e !== '\n')
    function fn(arr, str) {
      let index = arr.indexOf(str)
      return [arr[index + 1], arr[index + 2], arr[index + 3]]
    }
    let qishiArr = fn(tempArr, '起始物质')
    let zhongArr = fn(tempArr, '中间物质')
    let jieshuArr = fn(tempArr, '结束物质')

    let qishiStr = `a.color="${qishiArr[0]}" and a.status="${qishiArr[1]}" and a.title contains "${qishiArr[2].replace('\n', '')}"`
    qishiStr = qishiStr.split('and').filter(e => !(e.includes('=""') || e.includes('="不选颜色"') || e.includes('="不选状态"') || e.includes('contains ""'))).join('and')

    let zhongStr = `b.color="${zhongArr[0]}" and b.status="${zhongArr[1]}" and b.title contains "${zhongArr[2].replace('\n', '')}"`
    zhongStr = zhongStr.split('and').filter(e => !(e.includes('=""') || e.includes('="不选颜色"') || e.includes('="不选状态"') || e.includes('contains ""'))).join('and')
    zhongStr = zhongStr == '' ? "" : (qishiStr == '' ? `${zhongStr}` : `and ${zhongStr}`)

    let jieShuStr = `c.color="${jieshuArr[0]}" and c.status="${jieshuArr[1]}" and c.title contains "${jieshuArr[2].replace('\n', '')}"`
    jieShuStr = jieShuStr.split('and').filter(e => !(e.includes('=""') || e.includes('="不选颜色"') || e.includes('="不选状态"') || e.includes('contains ""'))).join('and')
    jieShuStr = jieShuStr == '' ? '' : (qishiStr == '' && zhongStr == '' ? `${jieShuStr}` : `and ${jieShuStr}`)
    let statement = `match (a)-[r1]->(b)-[r2]->(c) where ${qishiStr} ${zhongStr} ${jieShuStr} return a,b,c,r1,r2`

    let response = await session.run(statement)
    const data = neo4jDataFormat(response.records)
    session.close()
    ctx.body = data;
  }


}