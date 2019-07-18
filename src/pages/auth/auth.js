const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {},

  getUserInfo: async function (res) {
    const { detail } = res
    const {
      nickName,
      avatarUrl
    } = JSON.parse(detail.rawData)
    
    app.globalData.user.nickName = nickName
    app.globalData.user.avatarUrl = avatarUrl

    const db = wx.cloud.database({
      env: 'firsttest-qee47'
    })
    wx.showLoading({
      title: '用户信息创建中',
    })
    try {
      await db.collection('scores')
        .add({
          data: {
            openid: app.globalData.user.openid,
            win: 0,
            fail: 0
          }
        })
        
      await db.collection('users')
        .add({
          data: {
            openid: app.globalData.user.openid,
            nickName,
            avatarUrl
          }
        })
      
      wx.hideLoading()
      wx.navigateBack({
        delta: 1
      })
    } catch (error) {
      wx.showLoading({
        title: '用户信息创建失败',
      })
      console.error(error)
    }
  }
})