const app = getApp()
const {
  genRandomNumber
} = require('./../../util.js')

const db = wx.cloud.database({
  env: 'firsttest-qee47'
})
const $ = db.command.aggregate

// pages/index/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    rooms: []
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
    this.getRooms()
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  checkExistRoom: async function (roomid) {
    try {
      const { data } = await db.collection('rooms').where({roomid}).get()
      return data.length
    } catch (error) {
      console.error(error)
      return false
    }
  },

  createRoom: function () {
    const that = this
    const roomid = genRandomNumber(5)
    wx.showModal({
      title: '创建房间',
      content: `房间号是 ${roomid}`,
      success: async function (params) {
        if (params.cancel) {
          return 
        }

        if (!app.globalData.user.openid) {
          wx.showToast({
            title: '创建失败, 请重试',
            icon: 'none'
          })
          return
        }

        const exist = await that.checkExistRoom(roomid)
        if (exist) {
          wx.showToast({
            title: `房间存在, 请重试`,
            icon: 'none'
          })
          return
        }

        try {
          await db.collection('rooms')
            .add({
              data: {
                roomid,
                builder: app.globalData.user.openid,
                timestamp: Date.now().toString(),
                people: [
                  app.globalData.user.openid
                ]
              }
            })
          wx.showToast({
            title: `创建成功`,
            icon: 'loading'
          })

        } catch (error) {
          console.error(error)
        }
      }
    })
  },

  getRooms: async function () {
    const res = await db.collection('rooms')
      .aggregate()
      .sort({
        timestamp: -1
      })
      .end()
    this.setData({
      rooms: res.list.map(item => ({
        ...item,
        full: item.people.length >= 2
      }))
    })
  },

  intoRoom: function (ev) {
    const index = ev.currentTarget.dataset['index']
    if (this.data.rooms[index].full) {
      return
    }
    console.log(`index is ${index}`)
  }
})