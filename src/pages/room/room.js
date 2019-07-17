// pages/room/room.js

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

Page({

  /**
   * 页面的初始数据
   */
  data: {
    drawer: null,
    color: 'black',
    lines: -1,
    chessmen: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    const lines = 15
    const chessmen = new Array(lines)
    for (let i = 0; i < lines; ++i) {
      chessmen[i] = new Array(lines)
      for (let j = 0; j < lines; ++j) {
        chessmen[i][j] = 0 
      }
    }

    const ctx = wx.createCanvasContext('checkerboard')
    const drawer = new Drawer(ctx)

    this.setData({
      drawer,
      lines,
      chessmen
    })
    drawer.lines(lines)
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

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

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