const { env } = require('./../config.js')

const db = wx.cloud.database({ env })

const $ = db.command.aggregate

module.exports = {
  db,
  $,
}