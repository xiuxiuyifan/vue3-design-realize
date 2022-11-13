
// 定义一个全局变量 activeEffect 他的作用是存贮被注册的副作用函数

let activeEffect

let effectStack = [] // 存放 effect 函数的执行栈

export function effect(fn, options = {}) {
  const effectFn = () => {
    // 在触发 get 之前先清除
    cleanup(effectFn)
    activeEffect = effectFn
    // 在调用真实 的 effect 函数之前 将 effectFn压入栈中
    effectStack.push(effectFn)
    // 调用 effect 函数
    const res = fn()
    // 当调用完 effect 函数之后，载把 activeEffect 还原
    effectStack.pop()  // 丢掉上一次的 effectFn
    // 取栈顶的 effectFn赋值给 activeEffect
    activeEffect = effectStack[effectStack.length - 1]
    return res
  }

  // 将 options 挂载到 effectFn 身上
  effectFn.options = options
  // 用来存贮包含所有副作用的集合。
  effectFn.deps = []
  // 当 lazy 参数为 true 的时候不执行 effectFn 函数
  if (!options.lazy) {
    // 执行副作用函数
    effectFn()
  }
  // 将副作用函数作为返回值 返回
  return effectFn
}


const weakmap = new WeakMap()

export function reactive(data) {
  const proxy = new Proxy(data, {
    get(target, key, receiver) {
      // 触发依赖收集
      track(target, key)
      return Reflect.get(target, key, receiver)
    },
    set(target, key, value, receiver) {
      // 先设置属性
      let result = Reflect.set(target, key, value, receiver)
      // 后触发依赖
      trigger(target, key)
      return result
    }
  })
  return proxy
}

// {
//   obj: {
//     name: [effect1, effect2]
//   }
// }

export function track(target, key) {
  // 如果没有 activeEffect 则直接 return 可能是直接访问的
  if (!activeEffect) return
  // 查找对象是否在依赖中出现过
  let targetMap = weakmap.get(target)
  // 如果不存在 targetMap 则新建一个 map 赋值给 targetMap 并与 target 关联 ，并且把 其存放到 weakmap中去
  if (!targetMap) {
    weakmap.set(target, targetMap = new Map())
  }

  // 再从targetMap中找对应 key 的 effect
  let deps = targetMap.get(key)
  // 如果没有找到 dep ，先创建一个空的 set ，和当前 key 进行关联， 并把其放在 targetMap中
  if (!deps) {
    targetMap.set(key, deps = new Set())
  }
  // 将真实的依赖信息添加到 deps中去
  deps.add(activeEffect)
  // 让effect 记录所有的依赖集合
  activeEffect.deps.push(deps)
}

// 触发依赖
export function trigger(target, key) {
  // 从weakmap中找出target的依赖信息

  let targetMap = weakmap.get(target)
  // 如果没有找到则 return 掉
  if (!targetMap) return

  // 再找 键对应 的 set 里面存放的就是 effect
  let effects = targetMap.get(key)

  // 新构造一个 set 用来遍历
  let effectToRun = new Set()
  // 遍历effect 并执行
  effects && effects.forEach(effectFn => {
    if (activeEffect !== effectFn) {
      effectToRun.add(effectFn)
    }
  })
  effectToRun.forEach(effectFn => {
    //如果一个副作用函数存在调度器参数，那么则调用这个调度器函数，并将副作用函数作为参数进行传递
    if (effectFn.options.scheduler) {
      effectFn.options.scheduler(effectFn)
    } else {
      // 否则还是执行副作用函数
      effectFn()
    }
  })
}

export function cleanup(effectFn) {
  // 遍历 effectFn.deps数组
  for (let i = 0; i < effectFn.deps.length; i++) {
    const deps = effectFn.deps[i]
    deps.delete(effectFn)
  }
  // 最后重置 deps数组的长度
  effectFn.deps.length = 0
}

// 通过调度器控制effect函数的执行次数

export const jobQueue = new Set()

const p = Promise.resolve()
// 表示是否正在刷新队列
let isFlushing = false

export function flushJob() {
  // 如果当前队列正在刷新，则什么都不做
  if (isFlushing) return
  isFlushing = true
  // 在微任务队列中刷新任务
  p.then(() => {
    jobQueue.forEach((job) => {
      job()
    })
  })
    .finally(() => {
      isFlushing = false
    })
}

// 让用户传递一个 getter 函数进来
export function computed(getter) {

  // value 用来缓存上一次的值
  let value
  // dirty 表示 脏的 ，当只有脏的的时候，才会从新计算，否则直接返回上一次的值
  let dirty = true
  const effectFn = effect(getter, {
    lazy: true,
    scheduler: () => {
      // 当数据发生变化的时候，再把标识符设置为 脏的，表示要重新执行 effect 函数
      dirty = true
    }
  })

  const obj = {
    // 当用户读取  .value 属性的时候 自动帮我们执行 effectFn 函数 ，并且将返回值返回
    get value() {
      if (dirty) {
        value = effectFn()
        dirty = false
      }
      return value
    }
  }
  return obj
}













// 解决的问题，

// effect 添加一个参数来实现调度执行，把 effect 执行的控制权，可以交给开发者。

// 一定要记住是设置响应式数据的时候才触发依赖
// 在effect 函数里面触发的 get 才会执行   obj.count 虽然也触发了 get 但是此时的 activeEffect为 undefined
