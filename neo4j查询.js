// //导入语句

// CREATE INDEX ON :Resource(uri)
// CREATE INDEX ON :Uri(uri)
// CREATE INDEX ON :BNode(uri)
// CREATE INDEX ON :Class(uri)
// CALL semantics.importRDF("E:/bishe/huaxue.rdf","RDF/XML",{shortenUrls:false,typeToLabels:true,commitSize:9000})

// //查询单个物质的化学构成和属性


// MATCH (a:`化学式`)-[r]-(b)--(c:元素) where a.化学式='NaCl'and not type(r)=~ '.*物.*' RETURN a,b,c

// //查询某类物质
// MATCH (a:`物质类型`)--(b)-[r:化学式的构成成分]-(c) where a.物质类型='氧化物' return a,b,c

// // 查反应类型 分解反应
// MATCH (n:化学方程)-[r]-(m) WHERE n.name='分解反应' RETURN  m,n,r,type(r)

// // 查询与某种物质一类的所有物质
// MATCH (a:`化学式`)-[r]->(b:化学方程)-[r1]-(c) where a.化学式='C' RETURN a,b,c,r,r1,type(r),type(r1)
// // 三角反应
// MATCH (a:`化学式`)-[r:反应物]->(x:化学方程)-->(b:化学式)-->(y:化学方程)-->(c:化学式)-->(z:化学方程)-->(a:化学式)where a.化学式="NaOH" RETURN a,b,c,x,y,z
// // 物质推断
// MATCH (a:`化学式`)-[r]->(x:化学方程)-[r1]->(b:化学式)-[r2]->(y:化学方程)-[r3]->(a:化学式)where a.name="氯化镁" and b.name contains "镁" and b.水溶液状态="沉淀" RETURN a,b, x, y,r,r1,r2,r3,type(r),type(r1),type(r2),type(r3)

// // 物质推断2
// MATCH (a:`化学式`)-[r]->(x:化学方程)-[r1]->(b:化学式)-[r2]->(y:化学方程)-[r3]->(c:化学式)where a.水溶液状态="固体" and b.颜色 contains "蓝色" and c.化学式 in ["AgCl","BaSO4"] RETURN a,b,c, x, y,r,r1,r2,r3,type(r),type(r1),type(r2),type(r3)

// MATCH (n) WHERE EXISTS(n.`反应类型`) RETURN DISTINCT "node" as entity, n.`反应类型` AS `反应类型` LIMIT 25 UNION ALL MATCH ()-[r]-() WHERE EXISTS(r.`反应类型`) RETURN DISTINCT "relationship" AS entity, r.`反应类型` AS `反应类型` LIMIT 25

