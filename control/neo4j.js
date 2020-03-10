const fs = require("fs");
const path = require("path");
const neo4j = require("neo4j-driver").v1;
const User = require("../model/User.js");
const {
  neo4jDataFormat,
  neo4jCategoryFormat,
  neo4jGuoChengFormat,
  neo4jCategoryFormat1,
  isEmpty
} = require("../utils/index");
// bolt://47.96.137.151:7687
const driver = neo4j.driver(
  "bolt://localhost:7687",
  neo4j.auth.basic("neo4j", "1991112230li")
);

const session = driver.session();

module.exports = new (class Neo4jCtl {
  async findHuaXueTable(ctx) {
    ctx.body = await new Promise((resolve, reject) => {
      fs.readFile(
        path.join(__dirname, "../data/huaxueTable.json"),
        "utf8",
        (err, data) => {
          resolve(JSON.parse(data));
        }
      );
    });
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

    let {
      startNode,
      startNodeLabel,
      startNodeTitle,
      endNode,
      endNodeLabel,
      endNodeTitle,
      actionType,
      message = ""
    } = ctx.request.body;
    let statement = `MERGE (${startNode}:${startNodeLabel} {title:'${startNodeTitle}'})
    MERGE (${endNode}:${endNodeLabel} {title:'${endNodeTitle}'})
    CREATE
      (${startNode})-[:${actionType}${
      message ? " { message: ['" + message + "'] }" : ""
    }]->(${endNode})`;

    await session.run(statement);

    session.close();
    // 登陆态下找到用户
    // const user = await User.findById(ctx.state.user._id)
    // 更新数据 push是错的
    await User.findByIdAndUpdate(
      ctx.state.user._id,
      { $push: { huaXue: ctx.request.body } },
      { safe: true, upsert: true }
    );
    ctx.body = { status: 200, message: "节点和关系插入成功" };
  }
  // 查所有数据
  async find(ctx) {
    let statement =
      "MATCH (m)-[r]->(n) RETURN m ,n,r,type(r),m.title,labels(m),labels(n)";
    let data = await session.run(statement);
    session.close();
    ctx.body = data.records;
  }

  //查化学式的构成成分
  async findByGouCheng(ctx) {
    let { goucheng } = ctx.params;
    const statement = `MATCH (a:化学式)-[r]-(b)-[r1]-(c:元素) where a.化学式='${goucheng}'and not type(r)=~ '.*物.*' RETURN a, b , c,r,r1`;
    const response = await session.run(statement);
    const data = neo4jGuoChengFormat(response.records);
    session.close();
    // ctx.body = response.records;
    ctx.body = data;
  }

  // 查所有的化学式-》做成tree
  async findTree(ctx) {
    let statement =
      "MATCH (n) WHERE EXISTS(n.`化学式`)   RETURN DISTINCT n ORDER BY n.物质类型";
    let statement_yuansu =
      "MATCH (n) WHERE EXISTS(n.`元素名称`)   RETURN DISTINCT n";
    let statement_lizi = "MATCH (n:`离子`) RETURN n";
    let res = await session.run(statement);
    let data = res.records.map(e => e._fields[0].properties);

    let res_yuansu = await session.run(statement_yuansu);
    let data_yuansu = res_yuansu.records.map(e => e._fields[0].properties);

    let res_lizi = await session.run(statement_lizi);
    let data_lizi = res_lizi.records.map(e => e._fields[0].properties);
    const treeData = [
      { id: 100, label: "元素", children: [] },
      { id: 101, label: "离子", children: [] },
      { id: 102, label: "化学式", children: [] }
    ];
    //化学式
    data.forEach((e, i) => {
      e.id = 1000 + i;
      e.label = e["化学式"];
    });
    const type = ["单质", "氧化物", "酸", "碱", "盐"];
    type.forEach((e, i) => {
      let obj = {};
      obj.id = 10 + i;
      obj.label = e;
      obj.children = data.filter(obj => obj["物质类型"] == e);
      treeData[2].children.push(obj);
    });
    // 收集元素
    data_yuansu.forEach((e, i) => {
      e.id = 2000 + i;
      e.label = e["元素符号"];
    });
    const type_yuansu = ["非金属", "过渡元素", "金属"];
    type_yuansu.forEach((e, i) => {
      let obj = {};
      obj.id = 30 + i;
      obj.label = e;
      obj.children = data_yuansu.filter(obj => obj["元素类别"] == e);
      treeData[0].children.push(obj);
    });
    // 收集离子
    data_lizi.forEach((e, i) => {
      e.id = 3000 + i;
      e.label = e["离子符号"];
      e.type = e["离子符号"].includes("+") ? "阳离子" : "阴离子";
    });
    const type_lizi = ["阳离子", "阴离子"];
    type_lizi.forEach((e, i) => {
      let obj = {};
      obj.id = 40 + i;
      obj.label = e;
      obj.children = data_lizi.filter(obj => obj.type == e);
      treeData[1].children.push(obj);
    });

    session.close();
    ctx.body = treeData;
  }
  // 根据特定物质查数据
  async findByName(ctx) {
    let { huaXueShi } = ctx.params;
    let { type } = ctx.query;
    let statement = `match (n)-[r]-(m) where n.huaXueShi="${huaXueShi}" return n,m,r`;
    // o2作为反应物
    let statement1 = `match (n)-[r]->(m) where n.huaXueShi="${huaXueShi}" return n,m,r`;
    // o2作为生成物
    let statement2 = `match (n)<-[r]-(m) where n.huaXueShi="${huaXueShi}" return n,m,r`;
    let oneStatement =
      type === "全部" ? statement : type === "反应物" ? statement1 : statement2;
    let response = await session.run(oneStatement);
    const data = neo4jDataFormat(response.records);
    session.close();
    ctx.body = data;
  }
  //查询某一类型物质
  async findByCategory(ctx) {
    let { category, handler } = ctx.params;
    if (handler == 0) {
      // 走查询化学式的一类语句
      let statement = `MATCH (a:物质类型)-[r]-(b)where a.物质类型='${category}' return a,b,r`;
      const response = await session.run(statement);
      session.close();
      const data = neo4jCategoryFormat(response.records, category);
      ctx.body = data;
    } else if (handler == 1) {
      let data = [];
      // 走查询离子的一类语句
      if (category == "所有离子") {
        let statement1 = `MATCH (a:离子)-[r]->(b)where b:离子电性  RETURN a,b,r`;
        const response = await session.run(statement1);
        session.close();
        data = neo4jCategoryFormat1(response.records);
      } else {
        let statement2 = `MATCH (a:离子)-[r]->(b)where b.离子电性='${category}'  RETURN a,b,r`;
        const response = await session.run(statement2);
        session.close();
        data = neo4jCategoryFormat1(response.records);
      }
      ctx.body = data;
    }
  }
  // 查某一类化学反应
  async findByType(ctx) {
    let { type } = ctx.params;
    let statement = `MATCH (n:化学方程)-[r]-(m) WHERE n.name='${type}' RETURN  m,n,r,type(r)`;
    let response = await session.run(statement);
    const data = neo4jDataFormat(response.records);
    session.close();
    // ctx.body = response.records
    ctx.body = data;
  }
  //查一个物质所能发生的所有化学方程，并且返回化学方程id数组
  async findFangChengId(ctx) {
    let { huaxueshi } = ctx.params;
    const statement = `MATCH (a:化学式)-[r]-(b:化学方程) where a.化学式='${huaxueshi}'return collect(id(b))`;
    let response = await session.run(statement);
    let res = response.records[0]._fields[0].map(e => e.low).map(String);
    ctx.body = res;
    session.close();
  }
  //one to all 最新
  async findOneTOall(ctx) {
    let { huaxueshi } = ctx.params;
    const statement = `MATCH (a:化学式)-[r]-(b:化学方程)-[r1]-(c) where a.化学式='${huaxueshi}' RETURN a,b,c,r,r1,type(r),type(r1)`;
    const response = await session.run(statement);
    const data = neo4jDataFormat(response.records);
    ctx.body = data;
    session.close();
  }

  // 查三角反应关系
  async findSanJiaoByName(ctx) {
    let { sanjiao } = ctx.params;
    // console.log('sanjiao: ', sanjiao);
    let statement = `MATCH (a:化学式)-[r:反应物]->(x:化学方程)-[r1]->(b:化学式)-[r2]->(y:化学方程)-[r3]->(c:化学式)-[r4]->(z:化学方程)-[r5]->(a:化学式)where a.化学式="${sanjiao}" RETURN a,b,c,x,y,z,r,r1,r2,r3,r4,r5`;
    let response = await session.run(statement);
    const data = neo4jDataFormat(response.records);
    session.close();
    ctx.body = data;
    // ctx.body=response.records
  }
  // 新的推断
  async xinDuiTuan(ctx) {
    let { firstObj, secondObj, thirdObj } = ctx.request.body;
    let totalStatement = `MATCH (a:化学式)-[r]->(x:化学方程)-[r1]->(b:化学式)-[r2]->(y:化学方程)-[r3]->(c:化学式) where `;
    // let statement = `MATCH (a:化学式)-[r]->(x:化学方程)-[r1]->(b:化学式)-[r2]->(y:化学方程)-[r3]->(a:化学式)
    // where a.化学式 in ["MgCl2"] and b.化学式 contains "Mg" and b.水溶液状态="沉淀" RETURN a, b, x, y, r, r1, r2, r3`;

    // let statement1 = `MATCH (a:化学式)-[r]->(x:化学方程)-[r1]->(b:化学式)-[r2]->(y:化学方程)-[r3]->(c:化学式)
    // where a.水溶液状态="固体" and b.颜色 contains "蓝色" and c.化学式 in ["AgCl","BaSO4"] RETURN a,b,c, x, y,r,r1,r2,r3`;

    let fn = object => {
      let str = "";
      for (const key in object) {
        if (object.hasOwnProperty(key)) {
          const element = object[key];
          if (object.label == "反应物") {
            if (key == "wuzhi" && !isEmpty(element)) {
              let temp1 = element.map(e => `"${e}"`).join(",");
              str += `and a.化学式 in [${temp1}] `;
            } else if (key == "color" && !isEmpty(element)) {
              str += `and a.颜色 contains "${element}" `;
            } else if (key == "status" && !isEmpty(element)) {
              str += `and a.水溶液状态 = "${element}" `;
            } else if (key == "yuansu" && !isEmpty(element)) {
              str += `and a.化学式 contains "${element}" `;
            }
          } else if (object.label == "中间产物") {
            if (key == "wuzhi" && !isEmpty(element)) {
              let temp2 = element.map(e => `"${e}"`).join(",");
              str += `and b.化学式 in [${temp2}] `;
            } else if (key == "color" && !isEmpty(element)) {
              str += `and b.颜色 contains "${element}" `;
            } else if (key == "status" && !isEmpty(element)) {
              str += `and b.水溶液状态 = "${element}" `;
            } else if (key == "yuansu" && !isEmpty(element)) {
              str += `and b.化学式 contains "${element}" `;
            }
          } else if (object.label == "生成物") {
            if (key == "wuzhi" && !isEmpty(element)) {
              let temp3 = element.map(e => `"${e}"`).join(",");
              str += `and c.化学式 in [${temp3}] `;
            } else if (key == "color" && !isEmpty(element)) {
              str += `and c.颜色 contains "${element}" `;
            } else if (key == "status" && !isEmpty(element)) {
              str += `and c.水溶液状态 = "${element}" `;
            } else if (key == "yuansu" && !isEmpty(element)) {
              str += `and c.化学式 contains "${element}" `;
            }
          }
        }
      }
      return str;
    };

    let firstStr = fn(firstObj);
    let secondStr = fn(secondObj);
    let thirdStr = fn(thirdObj);
    totalStatement = totalStatement + firstStr + secondStr + thirdStr;
    totalStatement = totalStatement.replace("where and", "where");
    totalStatement+=` RETURN a,b,c, x, y,r,r1,r2,r3`
    console.log('totalStatement: ', totalStatement);
    let response = await session.run(totalStatement);
    const data = neo4jDataFormat(response.records);
    session.close();
    ctx.body = data;
 
  }
  //推断
  async duiTuan(ctx) {
    let { info } = ctx.query;
    let tempArr = info.split(" ").filter(e => e !== "\n");
    function fn(arr, str) {
      let index = arr.indexOf(str);
      return [arr[index + 1], arr[index + 2], arr[index + 3]];
    }
    let qishiArr = fn(tempArr, "起始物质");
    let zhongArr = fn(tempArr, "中间物质");
    let jieshuArr = fn(tempArr, "结束物质");

    let qishiStr = `a.color="${qishiArr[0]}" and a.status="${
      qishiArr[1]
    }" and a.title contains "${qishiArr[2].replace("\n", "")}"`;
    qishiStr = qishiStr
      .split("and")
      .filter(
        e =>
          !(
            e.includes('=""') ||
            e.includes('="不选颜色"') ||
            e.includes('="不选状态"') ||
            e.includes('contains ""')
          )
      )
      .join("and");

    let zhongStr = `b.color="${zhongArr[0]}" and b.status="${
      zhongArr[1]
    }" and b.title contains "${zhongArr[2].replace("\n", "")}"`;
    zhongStr = zhongStr
      .split("and")
      .filter(
        e =>
          !(
            e.includes('=""') ||
            e.includes('="不选颜色"') ||
            e.includes('="不选状态"') ||
            e.includes('contains ""')
          )
      )
      .join("and");
    zhongStr =
      zhongStr == "" ? "" : qishiStr == "" ? `${zhongStr}` : `and ${zhongStr}`;

    let jieShuStr = `c.color="${jieshuArr[0]}" and c.status="${
      jieshuArr[1]
    }" and c.title contains "${jieshuArr[2].replace("\n", "")}"`;
    jieShuStr = jieShuStr
      .split("and")
      .filter(
        e =>
          !(
            e.includes('=""') ||
            e.includes('="不选颜色"') ||
            e.includes('="不选状态"') ||
            e.includes('contains ""')
          )
      )
      .join("and");
    jieShuStr =
      jieShuStr == ""
        ? ""
        : qishiStr == "" && zhongStr == ""
        ? `${jieShuStr}`
        : `and ${jieShuStr}`;
    let statement = `match (a)-[r1]->(b)-[r2]->(c) where ${qishiStr} ${zhongStr} ${jieShuStr} return a,b,c,r1,r2`;

    let response = await session.run(statement);
    const data = neo4jDataFormat(response.records);
    session.close();
    ctx.body = data;
  }
})();
