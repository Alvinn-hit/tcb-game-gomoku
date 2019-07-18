const querystring = require('querystring')
const request = require('request')

function getOpenID(code, secret) {
  const url = 'https://api.weixin.qq.com/sns/jscode2session?' +
    querystring.encode({
      appid: 'wxe23cbe40231fcfe5',
      secret,
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

function isValidStr (str) {
  return typeof str === 'string' || str.trim().length
}

/**
 * code码
 * -1 未知错误
 * 0 成功
 * 1 request请求错误
 * 2 传入参数错误
 */
exports.main = async (event, context) => {
  let { code, secret } = event
  if (!isValidStr(code) || !isValidStr(secret)) {
    return {
      code: 2,
      msg: '传入的 code / secret参数不合法'
    }
  }

  try {
    const res = await getOpenID(code, secret)
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
    return {
      code: 1,
      msg: error.message
    }
  }
}