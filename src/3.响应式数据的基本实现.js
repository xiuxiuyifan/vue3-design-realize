
// 我们使用 proxy API 在  执行 effect 副作用函数的时候，将 effect 函数收集到桶中， 在设置代理对象值的时候 触发依赖
// 就是从桶中取出来依赖信息一次执行完成


// 1. 创建一个代理对象

// 2. 创建一个 桶，用来存贮副作用函数

let bucket = new Set()

// 原始数据
const data = {
  text: 'hello world'
}
const proxy = new Proxy(data, {
  get(target, key, receiver) {
    // 收集依赖函数
    bucket.add(effect)
    return target[key]
  },
  set(target, key, value, receiver) {
    //设置值
    target[key] = value
    // 触发副作用函数
    bucket.forEach(fn => fn())
    return true
  }
})

function effect() {
  root.innerHTML = proxy.text
}

// 调用副作用函数
effect()

setTimeout(() => {
  proxy.text = 'hello Vue3'
}, 1000)
