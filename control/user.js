const User = require('../model/User')
const bcrypt = require('bcrypt')
const jsonwebtoken = require('jsonwebtoken')
const { secret } = require('../params')
module.exports = new class UserCtl {

  // create
  async create(ctx) {
    // 1检验参数
    ctx.verifyParams({
      stu_id: { type: 'string', required: true },
      name: { type: 'string', required: true },
      password: { type: 'string', required: true },
      gender: { type: 'string', required: true },
    })

    // 2获取用户的stu_id password
    let { password, stu_id } = ctx.request.body
    //3 检验user唯一性
    let user = await User.findOne({ stu_id })
    // 服务器在完成请求时发生冲突。 服务器必须在响应中包含有关冲突的信息。
    if (user) ctx.throw(409, '该学号已经被占用')

    // 4密码加密
    ctx.request.body.password = await bcrypt.hash(password, 10)
    // 5写入数据库并返回新增对象
    ctx.body = await User.create(ctx.request.body)

  }
  // 查询所有用户
  async find(ctx) {
    ctx.body = await User.find({})
  }

  // 根据id查用户
  async findById(ctx) {
    let { fields = '' } = ctx.query
    let selectFields = '+' + fields.split(';').join(' +')
    //+locations +employments +jobs
    let user = await User.findById(ctx.params.id).select(selectFields)
    if (!user) ctx.throw(404, '没有此用户')
    ctx.body = user
  }

  // 修改用户信息
  async update(ctx) {
    // 1参数检验
    ctx.verifyParams({
      name: { type: 'string', required: false },
      password: { type: 'string', required: false },
      gender: { type: 'string', enum: ['male', 'female'], required: false },
      headLine: { type: 'string', required: false },
      locations: { type: 'array', itemType: 'string', required: false },//字符串数组
      employments: { type: 'array', itemType: 'object', required: false },//对象数组
      education: { type: 'array', itemType: 'object', required: false }////对象数组
    })
    // 获取name做唯一性检测
    let { name, password } = ctx.request.body
    let uName = await User.findOne({ name })
    if (uName) ctx.throw(409, '该用户名尚未修改或者已被占用')
    if (password) ctx.request.body.password = await bcrypt.hash(password, 10)
    const user = await User.findByIdAndUpdate(ctx.params.id, ctx.request.body, { new: true })
    if (!user) ctx.throw(404, '没有此用户')
    ctx.body = user
  }

  // 删除用户
  async del(ctx) {
    let user = await User.findByIdAndDelete(ctx.params.id)
    if (!user) ctx.throw(404, '没有此用户')
    ctx.status = 204//操作成功 不返回任何内容
  }
  //登录
  async login(ctx) {
    // 参数校验
    ctx.verifyParams({
      stu_id: { type: 'string', required: true },
      password: { type: 'string', required: true }

    })
    // 获取请求体name password
    let { stu_id, password } = ctx.request.body
    // 根据name查看user是否存在
    let user = await User.findOne({ stu_id }).select('+password')
    if (!user) ctx.throw(404, '该学号尚未注册，请注册')
    // 密码解密，验证密码正确性
    let isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) ctx.throw(404, '密码输入有误，请在输入一次')
    // name 密码正确返回token 
    let rule = { _id: user._id,stu_id,name:user.name } //
    let token = jsonwebtoken.sign(rule, secret, { expiresIn: 3600 * 24*7})
    ctx.body = { token: `Bearer ${token}` }
  }

  async auth(ctx, next) {
    // 获取请求头部的Authorization取出token
    const { authorization = '' } = ctx.request.headers
    const token = authorization.replace('Bearer ', '')
 
    // 解析token
    try {
      const user = jsonwebtoken.verify(token, secret)
      // console.log(ctx.state)是一个内置的空对象{}可以存放公共数据
      ctx.state.user = user
    } catch (error) {
      ctx.throw(401, error.message)
    }
    await next()

  }
  async checkOwner(ctx, next) {
    if (ctx.params.id !== ctx.state.user._id) ctx.throw(403, '无此操作权限')
    await next()
  }


}
