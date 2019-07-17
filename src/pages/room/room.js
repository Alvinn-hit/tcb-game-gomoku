const db = wx.cloud.database({
  env: 'firsttest-qee47'
})
const $ = db.command.aggregate

class Drawer {
  constructor (ctx) {
    this.ctx = ctx
  }

  lines(num) {
    this.ctx.setStrokeStyle('#595959')
    for (let i = 0; i < num; ++i) {
      this.ctx.moveTo(10, 10 + i * 20)
      this.ctx.lineTo(290, 10 + i * 20)
      this.ctx.stroke()

      this.ctx.moveTo(10 + i * 20, 10)
      this.ctx.lineTo(10 + i * 20, 290)
      this.ctx.stroke()
    }
    this.ctx.draw(true)
  }

  circle(row, col, color) {
    color = color.toLocaleLowerCase()
    const y = 10 + row * 20
    const x = 10 + col * 20
    const r = 8

    this.ctx.beginPath()
    this.ctx.arc(x, y, r, 0, 2 * Math.PI)
    this.ctx.closePath()

    const grd = this.ctx.createCircularGradient(x, y, r)
    switch (color) {
      case 'black':
        grd.addColorStop(0, '#262626')
        grd.addColorStop(1, '#595959')
        break
      case 'white':
        grd.addColorStop(0, '#ffffff')
        grd.addColorStop(1, '#d9d9d9')
        break
      default:
        console.error(new Error('参数错误'))
    }

    this.ctx.setFillStyle(grd)
    this.ctx.fill()
    this.ctx.draw(true)
  }

}

function encodeArray (arr) {
  return arr.flat().join(',')
}

function decodeArray (str, shape) {
  const arr = str.split(',')
    .map(item => parseInt(item, 10))

  const [ row, col ] = shape
  const result = new Array(row)
  for (let i = 0; i < row; ++i) {
    result[i] = new Array(col)
    for (let j = 0; j < col; ++j) {
      result[i][j] = arr.shift()
    }
  }

  return result
}

function diffArray (arr1, arr2, shape) {
  const [row, col] = shape
  for (let i = 0; i < row; ++i) {
    for (let j = 0; j < col; ++j) {
      if (arr1[i][j] !== arr2[i][j]) {
        return [i, j]
      }
    }
  }
  return [-1, -1]
}

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
    docid: ''
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

  /**
   * 判断用户身份，返回 'owner' / 'player'
   */
  judgeIdentity: async function () {
    const { roomid, playerid } = this.data

    try {
      const { data } = await db.collection('rooms')
        .where({ roomid })
        .get()
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
      await db.collection('rooms')
        .doc(docid)
        .update({
          data: {
            chessmen: encodeArray(chessmen)
          }
        })
    } catch (error) {
      console.error(error)
    }
  },  

  /**
   * 玩家进入房间后
   * 用途：拉取棋盘，更新房间数据状态
   */
  playerJoinGame: async function () {
    try {
      const { docid, playerid, roomid, lines } = this.data
      await db.collection('rooms')
        .doc(docid)
        .update({
          data: {
            player: {
              color: 'white',
              id: playerid
            },
            people: 2
          }
        })
      const { data } = await db.collection('rooms')
        .where({ roomid })
        .get()
      const chessmen = decodeArray(data[0].chessmen, [lines, lines])
      this.setData({
        color: 'white',
        chessmen
      })
      console.log(this.data)
    } catch (error) {
      console.error(error)
    }
  },

  joinGame: async function () {
    const { playerid, roomid } = this.data
    try {
      const { data } = await db.collection('rooms')
        .where({ roomid })
        .get()
      const { people, _id } = data[0]
      if (people.indexOf(playerid) !== -1) {
        return
      }

      people.push(playerid)
      const res2 = await db.collection('rooms')
        .doc(_id)
        .update({data: {people}})
      console.log('res2 is', res2)
    } catch (error) {
      console.error(error)
      return
    }

  },

  putDown: function (ev) {
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
        if (chessmen[row][col]) {
          wx.showToast({
            title: '请重新落子',
            icon: 'none',
          })
          return 
        } else {
          // 黑子：1；白子：-1
          chessmen[row][col] = color === 'white' ? 1 : -1
        }

        drawer.circle(row, col, color)
        that.setData({
          color: color === 'white' ? 'black' : 'white'
        })
        that.judge(row, col)
      })
      .exec()
  },

  judge: function (x, y) {
    const { chessmen, lines } = this.data
    let num = 0, target = chessmen[x][y]
    
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
  }
})