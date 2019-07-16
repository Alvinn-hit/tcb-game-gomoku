const subscriber = {
  clientList: {},

  listen(key, fn) {
    if (!this.clientList[key]) {
      this.clientList[key] = [];
    }
    this.clientList[key].push(fn);
    return true;
  },

  // 触发对应事件
  trigger() {
    const key = Array.prototype.shift.apply(arguments),
      fns = this.clientList[key];

    if (!fns || fns.length === 0) {
      return false;
    }

    for (let fn of fns) {
      fn.apply(null, arguments);
    }

    return true;
  },

  // 移除相关事件
  remove(key, fn) {
    let fns = this.clientList[key];

    // 如果之前没有绑定事件
    // 或者没有指明要移除的事件
    // 直接返回
    if (!fns || !fn) {
      return false;
    }

    // 反向遍历移除置指定事件函数
    for (let l = fns.length - 1; l >= 0; l--) {
      let _fn = fns[l];
      if (_fn === fn) {
        fns.splice(l, 1);
      }
    }

    return true;
  }
};

module.exports = {
  subscriber
}