const app = getApp()
const { subscriber } = require('./../../util.js')

const db = wx.cloud.database({
  env: 'firsttest-qee47'
})
const $ = db.command.aggregate

// pages/rank/rank.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    nickName: 'LOADING...', // 用户昵称
    avatarUrl: '', // 用户头像
    win: 0, // 胜利场次
    fail: 0, // 失败场次
    scores: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    const { user } = app.globalData
    this.setData({
      nickName: user.nickName || 'LOADING...',
      avatarUrl: user.avatarUrl || '',
      win: user.win || 0,
      fail: user.fail || 0
    })
    subscriber.listen('refresh-userinfo', this.refreshUserInfo)
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    subscriber.remove('refresh-userinfo', this.refreshUserInfo)
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    subscriber.remove('refresh-userinfo', this.refreshUserInfo)
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    console.log('触底下拉')
  },

  /**
   * 监听 + 响应：全局拉取用户信息
   */
  refreshUserInfo: function () {
    this.setData({
      nickName: app.globalData.user.nickName,
      avatarUrl: app.globalData.user.avatarUrl
    })
    this.getUserScore()
    this.getRankScores()
  },

  /**
   * 获取用户的胜负信息
   */
  getUserScore: function () {
    const that = this

    db.collection('scores')
      .where({
        openid: app.globalData.user.openid
      })
      .get()
      .then(res => {
        const data = res.data[0]
        app.globalData.user.win = data.win
        app.globalData.user.fail = data.fail
        that.setData({
          win: data.win,
          fail: data.fail
        })
      })
      .catch(console.error)
  },

  getRankScores: async function () {
    const { list: scores } = await db.collection('scores')
      .aggregate()
      .addFields({
        realFail: $.multiply(['$fail', -1]),
        total: $.add(['$fail', '$win'])
      })
      .match({
        total: $.gt(0)
      })
      .addFields({
        realTotal: $.add(['$realFail', '$win'])
      })
      .addFields({
        rate: $.divide(['$realTotal', '$total'])
      })
      .sort({
        rate: -1
      })
      .limit(10)
      .end()
    
    this.setData({
      scores: scores.map(item => ({
        ...item,
        rate: Number.parseFloat(item.rate).toFixed(4) * 100
      }))
    })
  }
})