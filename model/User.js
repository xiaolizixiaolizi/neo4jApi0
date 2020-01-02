const { Schema, model } = require('mongoose')
const userSchema = new Schema({
  stu_id: { type: String, required: true },
  name: { type: String, required: true },
  password: { type: String, required: true, select: false },
  gender: { type: String, enum: ['male', 'female'], default: 'male' },
  huaXue: {
    // [{},{},{}]对象数组
    // startNode, startNodeLabel, startNodeTitle,
    // endNode, endNodeLabel, endNodeTitle, actionType, message
    type: [
      {
        startNode: { type: String, required: true },
        startNodeLabel: { type: String, required: true },
        startNodeTitle: { type: String, required: true },
        endNode: { type: String, required: true },
        endNodeLabel: { type: String, required: true },
        endNodeTitle: { type: String, required: true },
        actionType: { type: String, required: true },
        message: { type: String, required: false, default: '' }

      }
    ],

  }


}, { versionKey: false })
module.exports = model('user', userSchema)