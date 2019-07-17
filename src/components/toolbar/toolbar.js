// components/toolbar.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    routePath: {
      type: String,
      value: 'index'
    }
  },

  data: {
    routePath: ''
  },

  lifetimes: {
    attached: function () {
      const { routePath } = this.data
      this.setData({
        routePath: routePath.startsWith('/') ? routePath : `/${routePath}`
      }) 
    }
  },

  methods: {
    toggleRoute: function (ev) {
      const { dataset } = ev.currentTarget
      if (this.properties.routePath !== dataset.url) {
        wx.navigateTo({
          url: dataset.url,
        })
      }
    }
  }
})
