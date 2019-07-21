const app = getApp()

const { 
  db,
  $,
} = require('./../../shared/database.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    nickName: 'LOADING...', // 用户昵称
    avatarUrl: '', // 用户头像
    win: 0, // 胜利场次
    fail: 0, // 失败场次
    scores: [] // 胜率排行前50的用户
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.getUserScore()
    this.getRankScores()
    // 单独开发此页面需要打开，开发环境网络并不稳定
    // TODO：结合生命周期实现更兼容的方法
    // subscriber.listen('refresh-userinfo', this.refreshUserInfo)
  },

  // 单独开发此页面需要打开，开发环境网络并不稳定
  // TODO：结合生命周期实现更兼容的方法
  // onHide: function () {
  //   subscriber.remove('refresh-userinfo', this.refreshUserInfo)
  // },
  // onUnload: function () {
  //   subscriber.remove('refresh-userinfo', this.refreshUserInfo)
  // },
  // /**
  //  * 监听 + 响应：全局拉取用户信息
  //  */
  // refreshUserInfo: function () {
  //   this.setData({
  //     nickName: app.globalData.user.nickName,
  //     avatarUrl: app.globalData.user.avatarUrl
  //   })
  //   this.getUserScore()
  //   this.getRankScores()
  // },

  /**
   * 获取用户的胜负信息
   */
  getUserScore: function () {
    const that = this

    this.setData({
      nickName: app.globalData.user.nickName,
      avatarUrl: app.globalData.user.avatarUrl
    })

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

  /**
   * 获取排名前50的用户的信息
   */
  getRankScores: async function () {
    const { list: scores } = await db.collection('scores')
      .aggregate()
      .addFields({
        total: $.add(['$fail', '$win'])
      })
      .match({
        total: $.gt(0)
      })
      .addFields({
        rate: $.divide(['$win', '$total'])
      })
      .sort({
        rate: -1
      })
      .limit(50)
      .end()

    this.setData({
      scores: scores.map(item => ({
        ...item,
        rate: (Number.parseFloat(item.rate) * 100).toFixed(2)
      }))
    })
  }
})