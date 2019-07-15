//app.js
App({
  onLaunch: function () {
    
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        traceUser: true,
      })
    }

    this.globalData = {}

    wx.login({
      success(res) {
        console.log(res.code)
        // wx.request({
        //   url: 'https://api.weixin.qq.com/sns/jscode2session',
        //   data: {
        //     appid: 'wxe23cbe40231fcfe5',
        //     secret: '8b8269317bc3d1182f64148ead4419cc',
        //     js_code: res.code,
        //     grant_type: 'authorization_code'
        //   },
        //   method: 'GET',
        //   success(wxRes) {
        //     console.log(wxRes)
        //   }
        // })      
      }
    })
  },

})
