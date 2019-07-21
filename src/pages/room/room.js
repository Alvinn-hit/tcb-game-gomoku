const Drawer = require('./../../shared/drawer.js')
const {
  encodeArray,
  decodeArray,
  diffArray,
} = require('./../../shared/util.js')

const { db } = require('./../../shared/database.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    drawer: null,
    // 棋子颜色：black / white
    color: '',
    // 行数 / 列数
    lines: 15,
    // 棋盘：黑子(-1)；白子(1)
    chessmen: [],
    // 房间号
    roomid: '',
    // 当前玩家id
    playerid: '',
    // room记录的id
    docid: '',
    // 能不能走棋子
    canRun: false,
    // 判定输赢后，finished为true
    finished: false
  },

  onLoad: function (option) {
    const { roomid, playerid } = option
    this.setData({ roomid, playerid })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: async function () {
    // 识别玩家身份
    const identity = await this.judgeIdentity()
    if (!identity) {
      console.log('玩家身份无法标识')
      return 
    }
    // 初始化棋盘数据
    const { lines } = this.data
    const chessmen = new Array(lines)
    for (let i = 0; i < lines; ++i) {
      chessmen[i] = new Array(lines)
      for (let j = 0; j < lines; ++j) {
        chessmen[i][j] = 0
      }
    }
    // 初始化画布
    const ctx = wx.createCanvasContext('checkerboard')
    const drawer = new Drawer(ctx)
    drawer.background()
    drawer.lines(lines)
    // 更新数据
    const that = this
    this.setData({
      drawer,
      chessmen
    }, async function () {
      await that[`${identity}JoinGame`]()
    })
  },

  onUnload: function () {
    const { interval, finished, roomid } = this.data
    // 不加分号，这里会有编译bug
    // 会被编译成 interval && clearInterval(interval)(!finished) && this.forceLogScore(false)
    // BUG单地址：https://developers.weixin.qq.com/community/develop/doc/000082047e81e03815e8c500551c00?fromCreate=1
    interval && clearInterval(interval);
    (!finished) && this.forceLogScore(false)
    wx.cloud.callFunction({
      name: 'clear_room',
      data: {
        roomid
      }
    })
  },

  /**
   * 判断用户身份，返回 'owner' / 'player'
   */
  judgeIdentity: async function () {
    const { roomid, playerid } = this.data

    try {
      const { data } = await db.collection('rooms')
        .where({ roomid })
        .get()
      if (!data.length) {
        wx.showToast({
          title: '房间已失效',
          icon: 'none'
        })
        wx.navigateBack({
          delta: 100
        })
        return ''
      }
      this.setData({docid: data[0]._id})
      if (data[0].owner.id === playerid) {
        return 'owner'
      } else {
        return 'player'
      }       
    } catch (error) {
      console.error(error)
      return ''
    }
  },

  /**
   * 房间主人创建后，进入房间
   * 用途：更新远程棋盘
   */
  ownerJoinGame: async function () {
    this.setData({
      color: 'black'
    })
    try {
      const { docid, chessmen } = this.data
      await wx.cloud.callFunction({
        name: 'update_doc',
        data: {
          collection: 'rooms',
          docid,
          data: {
            chessmen: encodeArray(chessmen),
            nowcolor: 'black'
          }
        }
      })
      this.ownerWaitPlayer()
    } catch (error) {
      console.error(error)
    }
  },

  /**
   * 房间主人等待玩家进入
   * 用途：通过监听 people 来实现
   */
  ownerWaitPlayer: function () {
    const { roomid } = this.data
    const that = this
    const interval = setInterval(function () {
      db.collection('rooms')
        .where({ roomid })
        .get()
        .then(res => {
          const { data } = res
          if (data[0].people === 2) {
            that.setData({
              canRun: true
            })
            that.listenRemoteRefresh()
            clearInterval(interval)
          }
        })
        .catch(error => {
          console.error(error)
          clearInterval(interval)
        })
    }, 5000)
  },

  /**
   * 用户监听远程棋盘刷新
   */
  listenRemoteRefresh: function () {
    const that = this
    const { roomid, lines, drawer } = this.data
    const interval = setInterval(function () {
      const { chessmen } = that.data
      db.collection('rooms')
        .where({ roomid })
        .get()
        .then(res => {
          const { data } = res
          // 没有数据，说明对方退出了
          if (!data.length) {
            clearInterval(interval)
            that.forceLogScore(true)
            wx.navigateBack({
              delta: 100
            })
            return
          }
          // 和本机的棋盘状态进行比较
          if (encodeArray(chessmen) === data[0].chessmen) {
            return 
          }
          // 远程棋盘发生更新, 本地绘制棋子
          const decoded = decodeArray(data[0].chessmen, [lines, lines])
          const [x, y] = diffArray(decoded, chessmen, [lines, lines])
          console.log('远程更新的坐标(x, y):', x, y, '; 玩家颜色: ', decoded[x][y] === 1 ? 'black' : 'white')
          drawer.circle(x, y, decoded[x][y] === 1 ? 'black' : 'white')
          // 判断新棋盘是否有胜利
          const win = that.judge(x, y, decoded)
          if (win) {
            console.log('胜利的棋子是：', decoded[x][y])
            wx.showToast({
              title: decoded[x][y] === 1 ? '黑子胜利' : '白子胜利',
            })
            that.setData({
              finished: true
            })
            that.logScore(x, y, decoded)
          }
          // 更新数据
          that.setData({
            canRun: true,
            chessmen: decoded
          })
        })
    }, 10000)

    this.setData({
      interval
    })
  },

  /**
   * 玩家进入房间后
   * 用途：拉取棋盘，更新房间数据状态
   */
  playerJoinGame: async function () {
    try {
      const { docid, playerid, roomid, lines } = this.data
      await wx.cloud.callFunction({
        name: 'update_doc',
        data: {
          collection: 'rooms',
          docid,
          data: {
            player: {
              color: 'white',
              id: playerid
            },
            people: 2
          }
        }
      })
      const { data } = await db.collection('rooms')
        .where({ roomid })
        .get()
      const chessmen = decodeArray(data[0].chessmen, [lines, lines])
      this.setData({
        color: 'white',
        chessmen,
        canRun: false
      }, this.listenRemoteRefresh)
      // console.log(this.data)
    } catch (error) {
      console.error(error)
    }
  },

  /**
   * 房间主人 / 玩家落子
   */
  putDown: function (ev) {
    if (!this.data.canRun) {
      wx.showToast({
        title: '请等待其他玩家',
        icon: 'none'
      })
      return
    }
    const that = this
    const { x, y } = ev.detail
    const query = wx.createSelectorQuery()
    query.select('#checkerboard')
      .boundingClientRect(function (rect) {
        const { left, top } = rect
        const offsetX = x - left,
          offsetY = y - top

        let col = Math.floor((offsetX - 10) / 20),
          row = Math.floor((offsetY - 10) / 20)

        console.log(col, row)
        col = col < 0 ? 0 : col
        row = row < 0 ? 0 : row

        const { color, drawer, chessmen } = that.data
        if (chessmen[row][col] !== 0) {
          wx.showToast({
            title: '请重新落子',
            icon: 'none',
          })
          return 
        } else {
          // 黑子：1；白子：-1
          chessmen[row][col] = color === 'black' ? 1 : -1
        }

        drawer.circle(row, col, color)
        that.setData({ canRun: false })
        that.updateRemoteChessmen(row, col)
      })
      .exec()
  },

  /**
   * 更新远程棋盘
   */
  updateRemoteChessmen: async function (row, col) {
    const { chessmen, docid, color } = this.data
    try {
      await wx.cloud.callFunction({
        name: 'update_doc',
        data: {
          collection: 'rooms',
          docid,
          data: {
            chessmen: encodeArray(chessmen),
            nowcolor: color === 'white' ? 'black' : 'white'
          }
        }
      })
      const win = this.judge(row, col)
      if (!win) {
        return
      }
      wx.showToast({
        title: chessmen[row][col] === 1 ? '黑子胜利' : '白子胜利',
      })
      this.logScore(row, col)
      this.setData({
        finished: true
      })
    } catch (error) {
      console.error(error)
    }
  },

  /**
   * 判断输赢
   */
  judge: function (x, y, chessmen) {
    if (!Array.isArray(chessmen)) {
      chessmen = this.data.chessmen
    }
    const { lines } = this.data
    let num = 0, target = chessmen[x][y]
    if (!target) {
      return false
    }

    console.log('target is', target, '; chessmen', chessmen)
    
    // 垂直方向
    num = 0
    for (let i = y - 1; i >= 0 && target === chessmen[x][i]; --i) {
      ++num
    }
    for (let i = y + 1; i < lines && target === chessmen[x][i]; ++i) {
      ++num
    }
    if (num >= 4) {
      console.log('垂直方向，胜利')
      return true
    }
    
    // 水平方向
    num = 0
    for (let i = x - 1; i >= 0 && target === chessmen[i][y]; --i) {
      ++num
    }
    for (let i = x + 1; i < lines && target === chessmen[i][y]; ++i) {
      ++num
    }
    if (num >= 4) {
      console.log('水平方向，胜利')
      return true
    }

    // 左倾斜方向
    num = 0
    for (
      let i = x - 1, j = y - 1;
      i >= 0 && j >= 0 && target === chessmen[i][j];
      --i, --j
    ) {
      ++num
    }
    for (
      let i = x + 1, j = y + 1;
      i < lines && j < lines && target === chessmen[i][j];
      ++i, ++j
    ) {
      ++num
    }
    if (num >= 4) {
      console.log('左倾斜方向，胜利')
      return true
    }

    // 右倾斜方向
    num = 0
    for (
      let i = x - 1, j = y + 1;
      i >= 0 && j < lines && target === chessmen[i][j];
      --i, ++j
    ) {
      ++num
    }
    for (
      let i = x + 1, j = y - 1;
      i < lines && j >= 0 && target === chessmen[i][j];
      ++i, --j
    ) {
      ++num
    }
    if (num >= 4) {
      console.log('右倾斜方向，胜利')
      return true
    }

    return false
  },
  
  /**
   * 记录玩家成绩，并且返回首页
   */
  logScore: async function (x, y, chessmen) {
    if (!Array.isArray(chessmen)) {
      chessmen = this.data.chessmen
    }
    const { color, playerid } = this.data

    const { data } = await db.collection('scores')
      .where({
        openid: playerid
      })
      .get()
    if (!data.length) {
      wx.showToast({
        title: '用户成绩丢失',
        icon: 'none'
      })
    }

    const target = data[0]
    // 胜利
    if (
      (color === 'black' && chessmen[x][y] === 1) ||
      (color === 'white' && chessmen[x][y] === -1)
    ) {
      await db.collection('scores')
        .doc(target._id)
        .update({
          data: {
            win: target.win + 1
          }
        })
    // 失败
    } else {
      await db.collection('scores')
        .doc(target._id)
        .update({
          data: {
            fail: target.fail + 1
          }
        })
    }

    wx.navigateBack({
      delta: 100
    })
  },

  /**
   * 强制退出
   * 用途：更新成绩
   */
  forceLogScore: async function (win) {
    const { playerid } = this.data
    win = !!win

    const { data } = await db.collection('scores')
      .where({
        openid: playerid
      })
      .get()
    if (!data.length) {
      return
    }

    const target = data[0]
    await db.collection('scores')
      .doc(target._id)
      .update({
        data: win ? { win: target.win + 1} : { fail: target.fail + 1 }
      })
  }
})