const app = getApp()
const { db } = require('./../../shared/database.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    clicked: false
  },

  getUserInfo: async function (res) {
    if (this.data.clicked) {
      return
    }
    this.setData({ clicked: true})

    const { detail } = res
    const {
      nickName,
      avatarUrl
    } = JSON.parse(detail.rawData)
    
    app.globalData.user.nickName = nickName
    app.globalData.user.avatarUrl = avatarUrl

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
      this.setData({ clicked: false })
      console.error(error)
    }
  }
})