const { subscriber } = require('./util.js')

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
      console.error(error)
    }

    return false
  },

  async getUserInfo () {
    const that = this
    const hasLogin = await that.getHistoryUserInfo()
    if (hasLogin) {
      console.log('此用户之前登录过')
      subscriber.trigger('refresh-userinfo')
      return
    }

    wx.getUserInfo({
      success (res) {
        const { nickName, avatarUrl } = res.userInfo
        that.globalData.user.nickName = nickName
        that.globalData.user.avatarUrl = avatarUrl

        const db = wx.cloud.database({
          env: 'firsttest-qee47'
        })
        db.collection('users')
          .add({
            data: {
              openid: that.globalData.user.openid,
              nickName,
              avatarUrl
            }
          })
          .then(res => {
            console.log(res)
          })
          .catch(console.error) 
      }
    })
  }

})
