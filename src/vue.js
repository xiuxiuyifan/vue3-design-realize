
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

// ownKeys 获取的是一个对象的所有属于自己的键值  for in 不像是 操作对象的某个 key ，所以要进行单独区分开
const ITERATE_KEY = Symbol()

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
    },
    // 我们再来添加 has, 用来检测在 effect 中 in 的操作
    has(target, key, receiver) {
      // 收集依赖
      track(target, key)
      return Reflect.has(target, key, receiver)
    },
    // 收集 for in 循环
    ownKeys(target) {
      track(target, ITERATE_KEY)
      return Reflect.ownKeys(target)
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

  // 取出对象的 iterateEffect
  let iterateEffect = targetMap.get(ITERATE_KEY)

  // 新构造一个 set 用来遍历
  let effectToRun = new Set()
  // 遍历effect 并执行
  effects && effects.forEach(effectFn => {
    if (activeEffect !== effectFn) {
      effectToRun.add(effectFn)
    }
  })
  // 把 iterate_key 相关的 effect 函数也拿出来
  iterateEffect && iterateEffect.forEach(effectFn => {
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
      // 当计算属性依赖的响应式数据变化的时候 ，手动 调用 trigger函数进行 依赖的触发
      // 感知到 计算属性依赖的值发生了变化，
      trigger(obj, 'value')
    }
  })

  const obj = {
    // 当用户读取  .value 属性的时候 自动帮我们执行 effectFn 函数 ，并且将返回值返回
    get value() {
      if (dirty) {
        value = effectFn()
        dirty = false
      }
      // 当读取 value 属性的时候，手动调用 track 函数进行追踪
      track(obj, 'value')
      return value
    }
  }
  return obj
}

// 实现 watch
export function watch(source, cb, options = {}) {
  let getter
  // 监测 watch 传进来的第一个参数是  function 还是对象？？
  if (typeof source === 'function') {
    getter = source
  } else {
    // 如果是对象就用函数重新包一下
    getter = () => traverse(source)
  }
  // 定义新值和老值
  let oldValue, newValue

  let onCleanup
  function onInvalidate(fn) {
    onCleanup = fn
  }

  // 提取 scheduler 函数为单独的一个函数
  // 因为 scheduler 函数的执行只会发生在数据变化之后，第一次是不会默认执行的
  const job = () => {
    // 当数据发生变化的时候，会重新执行 scheduler 函数
    newValue = effectFn()
    // 调用回调函数之前，先调用之前存贮下来的清理函数
    if (onCleanup) {
      onCleanup()
    }
    // 当数据变化的时候，触发回调函数
    // 将新值和老值，传递给回调函数
    cb(newValue, oldValue, onInvalidate)
    // 当回调函数执行完成之后，当前的新值也就变成老值了
    oldValue = newValue
  }
  const effectFn = effect(() => getter(), {
    lazy: true,
    scheduler: () => {
      // 判断参数中 options 中是否含有 flush
      if (options.flush) {
        // 在 DOM 更新之后
        const p = Promise.resolve()
        p.then(job)
      } else {
        job()
      }
    }
  })
  // 在后序进行判断
  if (options.immediate) {
    job()
  } else {
    // 第一次执行先记录一下初次的值
    // 手动调用effectFn 函数
    oldValue = effectFn()
  }
}

// 用来递归访问对象上的属性
export function traverse(value, seen = new Set()) {
  // 判断传进来的值的类型 , 如果不符合要求，则直接 return
  if (typeof value !== 'object' || typeof value === null || seen.has(value)) return
  seen.add(value)
  //说明是对象, 就遍历这个对象 使用 for in
  for (let key in value) {
    // 递归遍历
    traverse(value[key], seen)
  }
  // 把传进来的值 返回
  return value
}











// 解决的问题，

// effect 添加一个参数来实现调度执行，把 effect 执行的控制权，可以交给开发者。

// 一定要记住是设置响应式数据的时候才触发依赖
// 在effect 函数里面触发的 get 才会执行   obj.count 虽然也触发了 get 但是此时的 activeEffect为 undefined
