const { subscriber } = require('./shared/util.js')

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

    this.globalData = {
      user: {}
    }

    this.login()
  },

  // 登录并且拿到openid
  login () {
    const that = this
    wx.login({
      success(res) {
        console.log('临时code', res.code)
        wx.cloud
          .callFunction({
            name: 'openid',
            data: {
              code: res.code
            }
          })
          .then(res => {
            const { result } = res
            if (result.code === 0) {
              that.globalData.user.openid = result.openid
              that.getUserInfo()
              console.log('openid获取成功', result.openid)
            } else {
              wx.showToast({
                title: '获取openid失败',
                icon: 'error',
                duration: 20000
              })
            }
          })
          .catch(console.error)
      }
    })
  },

  async getHistoryUserInfo () {
    const that = this
    const db = wx.cloud.database({
      env: 'firsttest-qee47'
    })

    try {
      const res = await db.collection('users')
        .where({
          openid: that.globalData.user.openid
        })
        .get()
      if (res.data.length) {
        const user = res.data[0]
        that.globalData.user.avatarUrl = user.avatarUrl
        that.globalData.user.nickName = user.nickName
        return true
      }
    } catch (error) {
      console.log('【app.js】', '查找用户信息错误')
      return true
    }

    return false
  },

  async getUserInfo () {
    const that = this
    const hasLogin = await that.getHistoryUserInfo()
    if (hasLogin) {
      wx.showToast({
        title: '用户登录过',
        duration: 2000
      })
      subscriber.trigger('refresh-userinfo')
    } else {
      wx.navigateTo({
        url: '/pages/auth/auth',
      })
    }

    // wx.getSetting({
    //   success(res) {
    //     if (res.authSetting['scope.userInfo']) {
    //       wx.authorize({
    //         scope: 'scope.userInfo',
    //         success: wxGetUserInfo
    //       })
    //     }
    //   }
    // })
  }
})
