class Drawer {
  constructor (ctx) {
    this.ctx = ctx
  }

  background () {
    this.ctx.setFillStyle('#ffd666')
    this.ctx.fillRect(0, 0, 300, 300)
    this.ctx.draw(true)
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

module.exports = Drawer