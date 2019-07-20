const app = getApp()
const {
  genRandomNumber,
  querystring,
} = require('./../../shared/util.js')
const { 
  db,
  $,
} = require('./../../shared/database.js')

Page({
  data: {
    // 保存所有房间信息
    rooms: []
  },

  /**
   * 每次回到此页面，均需要重新刷新房间信息
   * TODO：自动轮询刷新
   */
  onShow: function () {
    this.getRooms()
  },

  /**
   * 检测房间号是否存在
   * 用途：创建房间时，避免创建重复房间
   */
  checkExistRoom: async function (roomid) {
    try {
      const { data } = await db.collection('rooms').where({roomid}).get()
      return data.length
    } catch (error) {
      console.error(error)
      return false
    }
  },

  /**
   * 创建房间，创建成功后进入
   */
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
                // 房间号
                roomid,
                // 房间主人
                owner: {
                  id: app.globalData.user.openid,
                  color: 'black'
                },
                // 房间玩家
                player: {
                  id: '',
                  color: ''
                },
                // 当前是谁下棋
                nowcolor: 'black',
                // string化后的五子棋盘
                chessmen: '', 
                // 创建时间
                timestamp: Date.now().toString(),
                // 人数
                people: 1
              }
            })
          wx.showToast({
            title: `创建成功`,
            icon: 'loading'
          })
          that.intoRoom(roomid, app.globalData.user.openid)
        } catch (error) {
          console.error(error)
        }
      }
    })
  },

  /**
   * 抓取所有房间信息
   */
  getRooms: async function () {
    const { list: rooms } = await db.collection('rooms')
      .aggregate()
      .sort({
        timestamp: -1
      })
      .end()
    this.setData({ rooms })
  },

  /**
   * 选择房间列表中的房间
   * 用途：玩家在大厅选择进入房间
   * TODO：观战模式
   */
  chooseRoom: function (ev) {
    const index = ev.currentTarget.dataset['index']
    if (this.data.rooms[index].people >= 2) {
      return
    }
    const room = this.data.rooms[index]
    this.intoRoom(room.roomid, app.globalData.user.openid)
  },

  /**
   * 进入“可进入”房间
   */
  intoRoom: function (roomid, playerid) {    
    const routerParams = { roomid, playerid }
    wx.navigateTo({
      url: '/pages/room/room?' + querystring(routerParams)
    })
  }
})