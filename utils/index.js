module.exports = new class Utils {
  // '' [] ,{}
  isEmpty(value) {
    return value === '' ||
      value === undefined ||
      (typeof value === 'object' && Object.keys(value).length === 0) ||
      (typeof value === 'string' && value.trim().length === 0)
  }
  neo4jDataFormat(rawData) {
    let data = {
      nodes: [],
      links: []
    }

    rawData.forEach(e => {
      e._fields.forEach(el => {
        // 拼node
        if (el.labels) {
          data.nodes.push({
            id: el.identity.low.toString(),
            label: el.labels[0],
            ...el.properties
          })
        }
        else {
          // 拼关系
          data.links.push({
            source: el.start.low.toString(),
            target: el.end.low.toString(),
            type: el.type,
            id: el.identity.low,
            ...el.properties
          })
        }
      })
    })

    // 去除nodes重复值 对象数组去重
    let tempArr = []
    data.nodes.forEach(e => {
      if (tempArr.every(el => el.id !== e.id)) {
        tempArr.push(e)
      }
    })
    data.nodes = tempArr
    tempArr = null
    // 去重重复关系
    let tempLinkArr = []
    data.links.forEach(e => {
      if (tempLinkArr.every(el => el.id !== e.id)) {
        tempLinkArr.push(e)
      }
    })
    data.links = tempLinkArr
    tempLinkArr = null
    // 给data加一些属性category
    data.nodes.forEach(e => {
      e.category = e.label;
      e.name = e.nodeId;
    });
    return data
  }
}