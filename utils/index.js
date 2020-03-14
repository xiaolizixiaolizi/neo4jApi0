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
          let condition=''
          if(el.labels[0]=='化学方程'){
             condition=el.properties['反应条件']=='无'?'':el.properties['反应条件']
            //  console.log('condition: ', condition);
          }
          data.nodes.push({
            id: el.identity.low.toString(),
            label: el.labels[0],
            ...el.properties,
            category: index,
            name:el.labels[0]=='化学式'? el.properties["化学式"]:condition, //name就是前端页面的节点标签
            isActive: false,
            symbolSize: el.labels[0]=='化学式'?25:35,
          });
        } else {
          // 拼关系
          data.links.push({
            source: el.start.low.toString(),
            target: el.end.low.toString(),
            type: el.type,
            id: el.identity.low,
            ...el.properties,
            lineStyle: {
              normal: {
                  color: el.type=='反应物'? 'blue':'green'
              }
          }
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
            index == -1 &&
            el.properties["离子符号"] &&
            el.properties["离子符号"].slice(-1) == "+"
          ) {
            index = 2;
          }
          if (
            index == -1 &&
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

  // find总的知识图谱下面各条语句对应的逻辑
  findAll100(rawData) {
    let data = {
      nodes: [],
      links: [],
      categories: [
        { name: "单质" },
        { name: "氧化物" },
        { name: "酸" },
        { name: "碱" },
        { name: "盐" },
        { name: "单质实例" },
        { name: "氧化物实例" },
        { name: "酸实例" },
        { name: "碱实例" },
        { name: "盐实例" }
      ]
    };

    rawData.forEach(e => {
      e._fields.forEach(el => {
        if (typeof el !== "object") return;
        // 拼node
        if (el.labels) {
          let index = data.categories.findIndex(
            item => item.name == el.properties["name"]
          );
          if (index == -1 && el.properties["物质类型"] == "单质") index = 5;
          else if (index == -1 && el.properties["物质类型"] == "氧化物")
            index = 6;
          else if (index == -1 && el.properties["物质类型"] == "酸") index = 7;
          else if (index == -1 && el.properties["物质类型"] == "碱") index = 8;
          else if (index == -1 && el.properties["物质类型"] == "盐") index = 9;

          data.nodes.push({
            id: el.identity.low.toString(),
            label: el.labels[0],
            ...el.properties,
            category: index,
            name:
              el.labels[0] == "化学式"
                ? el.properties["化学式"]
                : el.properties.name
          });
        } else {
          // 拼关系
          data.links.push({
            source: el.start.low.toString(),
            target: el.end.low.toString(),
            type: el.type,
            id: el.identity.low //每个边的id都是唯一的 在后面的去重中有用
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

  findAll200(rawData) {
    let data = {
      nodes: [],
      links: [],
      categories: [
        { name: "单质" },
        { name: "氧化物" },
        { name: "酸" },
        { name: "碱" },
        { name: "盐" },
        { name: "原子" },
        { name: "离子" }
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

          if (index == -1 && el.labels[0] == "离子") index = 6;
          else if (index == -1 && el.labels[0] == "元素") index = 5;
          let node;
          // 化学式类node
          if (el.labels[0] == "化学式") {
            node = {
              id: el.identity.low.toString(),
              label: el.labels[0],
              ...el.properties,
              category: index,
              name: el.properties["化学式"]
            };
          } else if (el.labels[0] == "物质类型") {
            node = {
              id: el.identity.low.toString(),
              label: el.labels[0],
              ...el.properties,
              category: index,
              name: el.properties["物质类型"]
            };
          } else if (el.labels[0] == "离子") {
            node = {
              id: el.identity.low.toString(),
              label: el.labels[0],
              ...el.properties,
              category: index,
              name: el.properties["name"]
            };
          } else if (el.labels[0] == "元素") {
            node = {
              id: el.identity.low.toString(),
              label: el.labels[0],
              ...el.properties,
              category: index,
              name: el.properties["元素符号"]
            };
          }
          data.nodes.push(node);
        } else {
          // 拼关系
          data.links.push({
            source: el.start.low.toString(),
            target: el.end.low.toString(),
            type: el.type == "化学式的构成成分" ? "构成" : el.type,
            id: el.identity.low, //每个边的id都是唯一的 在后面的去重中有用
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

  findAll300(rawData) {
    let data = {
      nodes: [],
      links: [],
      categories: [{ name: "化学式" }, { name: "化学方程" }]
    };

    rawData.forEach(e => {
      e._fields.forEach(el => {
        if (typeof el !== "object") return;
        // 拼node
        if (el.labels) {
          let index = data.categories.findIndex(
            item => item.name == el.labels[0]
          );
          let node;
          // 化学式类node
          if (el.labels[0] == "化学式") {
            node = {
              id: el.identity.low.toString(),
              label: el.labels[0],
              ...el.properties,
              category: index,
              name: el.properties["化学式"]
            }; //化学方程node
          } else if (el.labels[0] == "化学方程") {
            node = {
              id: el.identity.low.toString(),
              label: el.labels[0],
              ...el.properties,
              category: index,
              name: el.properties.name
            };
          }
          data.nodes.push(node);
        } else {
          // 拼关系
          data.links.push({
            source: el.start.low.toString(),
            target: el.end.low.toString(),
            type: el.type,
            id: el.identity.low, //每个边的id都是唯一的 在后面的去重中有用
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

  findAll500(rawData) {
    let data = {
      nodes: [],
      links: [],
      categories: [
        { name: "原子" },
        { name: "离子" },
        { name: "化学式" },
        { name: "化学方程" }
      ]
    };

    rawData.forEach(e => {
      e._fields.forEach(el => {
        if (typeof el !== "object") return;
        // 拼node
        if (el.labels) {
          let index = data.categories.findIndex(
            item => item.name == el.labels[0]
          );

          if (index == -1 && el.labels[0] == "元素") index = 0;
          // else if (index == -1 && el.labels[0] == "元素") index = 5;
          let node = null;
          // 化学式类node
          if (el.labels[0] == "化学式") {
            node = {
              id: el.identity.low.toString(),
              label: el.labels[0],
              ...el.properties,
              category: index,
              name: el.properties["化学式"]
            };
          } else if (el.labels[0] == "化学方程") {
            node = {
              id: el.identity.low.toString(),
              label: el.labels[0],
              ...el.properties,
              category: index,
              name: el.properties.name
            };
          } else if (el.labels[0] == "离子") {
            node = {
              id: el.identity.low.toString(),
              label: el.labels[0],
              ...el.properties,
              category: index,
              name: el.properties["name"]
            };
          } else if (el.labels[0] == "元素") {
            node = {
              id: el.identity.low.toString(),
              label: el.labels[0],
              ...el.properties,
              category: index,
              name: el.properties["元素符号"]
            };
          }
          node && data.nodes.push(node);
        } else {
          // 拼关系
          data.links.push({
            source: el.start.low.toString(),
            target: el.end.low.toString(),
            type: el.type == "化学式的构成成分" ? "构成" : el.type,
            id: el.identity.low, //每个边的id都是唯一的 在后面的去重中有用
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
})();
