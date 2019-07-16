const querystring = require('querystring')
const request = require('request')

function getOpenID(code) {
  const url = 'https://api.weixin.qq.com/sns/jscode2session?' +
    querystring.encode({
      appid: 'wxe23cbe40231fcfe5',
      secret: '8b8269317bc3d1182f64148ead4419cc',
      js_code: code,
      grant_type: 'authorization_code'
    })

  return new Promise((resolve, reject) => {
    request({
      url,
      json: true
    }, function (err, res, body) {
      if (err) {
        reject(err)
      }
      resolve(body)
    })
  })
}

/**
 * code码
 * -1 未知错误
 * 0 成功
 * 1 request请求错误
 * 2 传入参数错误
 */
exports.main = async (event, context) => {
  let { code } = event
  if (typeof code !== 'string' || !code.trim().length) {
    return {
      code: 2,
      msg: '客户端传入的code有误'
    }
  }

  console.log(`code is ${code}`)

  try {
    const res = await getOpenID(code)
    console.log('res is', res)
    if (res.openid) {
      return {
        code: 0,
        openid: res.openid
      }
    } else if (res.errmsg) {
      console.log()
      return {
        code: 1,
        msg: res.errmsg
      }
    } else {
      return {
        code: 2,
        msg: '未知错误'
      }
    }
  } catch (error) {
    console.log('error is', error)
    return {
      code: 1,
      msg: error.message
    }
  }
}