module.exports = new (class Utils {
  // '' [] ,{}
  isEmpty(value) {
    return (
      value === "" ||
      value === undefined ||
      (typeof value === "object" && Object.keys(value).length === 0) ||
      (typeof value === "string" && value.trim().length === 0)
    );
  }
  neo4jDataFormat(rawData) {
    let data = {
      nodes: [],
      links: [],
      categories: [
        { name: "化学方程" },
        { name: "单质" },
        { name: "氧化物" },
        { name: "酸" },
        { name: "碱" },
        { name: "盐" }
      ]
    };

    rawData.forEach(e => {
      e._fields.forEach(el => {
        if (typeof el !== "object") return;
        // 拼node
        if (el.labels) {
          let index = data.categories.findIndex(
            item => item.name == el.properties["物质类型"]
          );
          index = index == -1 ? 0 : index;
          data.nodes.push({
            id: el.identity.low.toString(),
            label: el.labels[0],
            ...el.properties,
            category: index,
            name: el.properties["化学式"],
            isActive: false
          });
        } else {
          // 拼关系
          data.links.push({
            source: el.start.low.toString(),
            target: el.end.low.toString(),
            type: el.type,
            id: el.identity.low,
            ...el.properties
          });
        }
      });
    });

    // 去除nodes重复值 对象数组去重
    let tempArr = [];
    data.nodes.forEach(e => {
      if (tempArr.every(el => el.id !== e.id)) {
        tempArr.push(e);
      }
    });
    data.nodes = tempArr;
    tempArr = null;
    // 去重重复关系
    let tempLinkArr = [];
    data.links.forEach(e => {
      if (tempLinkArr.every(el => el.id !== e.id)) {
        tempLinkArr.push(e);
      }
    });
    data.links = tempLinkArr;
    tempLinkArr = null;

    return data;
  }

  neo4jGuoChengFormat(rawData) {
    let data = {
      nodes: [],
      links: [],
      categories: [{ name: "化学式" }, { name: "离子" }, { name: "原子" }]
    };

    rawData.forEach(e => {
      e._fields.forEach(el => {
        if (typeof el !== "object") return;
        // 拼node
        if (el.labels) {
          let index = data.categories.findIndex(
            item => item.name == el.labels[0]
          );
          index = index == -1 ? 2 : index;
          data.nodes.push({
            id: el.identity.low.toString(),
            label: el.labels[0],
            ...el.properties,
            category: index,
            name: el.properties["name"],
            isActive: false
          });
        } else {
          // 拼关系
          data.links.push({
            source: el.start.low.toString(),
            target: el.end.low.toString(),
            type: el.type,
            id: el.identity.low,
            ...el.properties
          });
        }
      });
    });

    // 去除nodes重复值 对象数组去重
    let tempArr = [];
    data.nodes.forEach(e => {
      if (tempArr.every(el => el.id !== e.id)) {
        tempArr.push(e);
      }
    });
    data.nodes = tempArr;
    tempArr = null;
    // 去重重复关系
    let tempLinkArr = [];
    data.links.forEach(e => {
      if (tempLinkArr.every(el => el.id !== e.id)) {
        tempLinkArr.push(e);
      }
    });
    data.links = tempLinkArr;
    tempLinkArr = null;
    return data;
  }
  //清理化学式如所有氧化物的逻辑
  neo4jCategoryFormat(rawData, category) {
    let data = {
      nodes: [],
      links: [],
      categories: [{ name: category }, { name: "化学式" }]
    };

    rawData.forEach(e => {
      e._fields.forEach(el => {
        if (typeof el !== "object") return;
        // 拼node
        if (el.labels) {
          let index = data.categories.findIndex(
            item => item.name == el.properties.name
          );
          index = index == -1 ? 1 : index;
          data.nodes.push({
            id: el.identity.low.toString(),
            label: el.labels[0],
            ...el.properties,
            category: index,
            name: el.properties.name,
            isActive: false
          });
        } else {
          // 拼关系
          data.links.push({
            source: el.start.low.toString(),
            target: el.end.low.toString(),
            type: el.type,
            id: el.identity.low,
            value: "属于"
          });
        }
      });
    });

    // 去除nodes重复值 对象数组去重
    let tempArr = [];
    data.nodes.forEach(e => {
      if (tempArr.every(el => el.id !== e.id)) {
        tempArr.push(e);
      }
    });
    data.nodes = tempArr;
    tempArr = null;
    // 去重重复关系
    let tempLinkArr = [];
    data.links.forEach(e => {
      if (tempLinkArr.every(el => el.id !== e.id)) {
        tempLinkArr.push(e);
      }
    });
    data.links = tempLinkArr;
    tempLinkArr = null;
    return data;
  }
  // 清理离子分类的逻辑
  neo4jCategoryFormat1(rawData) {
    let data = {
      nodes: [],
      links: [],
      categories: [
        { name: "阳离子" },
        { name: "阴离子" },
        { name: "阳离子实例" },
        { name: "阴离子实例" }
      ]
    };

    rawData.forEach(e => {
      e._fields.forEach(el => {
        if (typeof el !== "object") return;
        // 拼node
        if (el.labels) {
          let index = data.categories.findIndex(
            item => item.name == el.properties.name
          );
          if (
            index==-1&&
            el.properties["离子符号"] &&
            el.properties["离子符号"].slice(-1) == "+"
          ) {
            index = 2;
          }
          if (
            index==-1&&
            el.properties["离子符号"] &&
            el.properties["离子符号"].slice(-1) == "-"
          ) {
            index = 3;
          }

          data.nodes.push({
            id: el.identity.low.toString(),
            label: el.labels[0],
            ...el.properties,
            category: index,
            name: el.properties.name,
            isActive: false
          });
        } else {
          // 拼关系
          data.links.push({
            source: el.start.low.toString(),
            target: el.end.low.toString(),
            type: "属于",
            id: el.identity.low
          });
        }
      });
    });

    // 去除nodes重复值 对象数组去重
    let tempArr = [];
    data.nodes.forEach(e => {
      if (tempArr.every(el => el.id !== e.id)) {
        tempArr.push(e);
      }
    });
    data.nodes = tempArr;
    tempArr = null;
    // 去重重复关系
    let tempLinkArr = [];
    data.links.forEach(e => {
      if (tempLinkArr.every(el => el.id !== e.id)) {
        tempLinkArr.push(e);
      }
    });
    data.links = tempLinkArr;
    tempLinkArr = null;
    return data;
  }
})();
