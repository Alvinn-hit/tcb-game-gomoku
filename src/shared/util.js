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

function genRandomNumber (length) {
  length = length || 5
  let str = ''
  for (let i = 0; i < length; ++i) {
    str += Math.floor(Math.random() * 10)
  }
  return str
}

function querystring (params) {
  let result = ''
  Reflect.ownKeys(params)
    .forEach(key => {
      result += `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}&`
    })
  return result.slice(0, result.length - 1)
}

function localFlat (arr) {
  return arr.reduce((arr, val) => arr.concat(val), [])
}

function encodeArray (arr) {
  return localFlat(arr).join(',')
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

module.exports = {
  subscriber,
  genRandomNumber,
  querystring,
  encodeArray,
  decodeArray,
  diffArray,
}