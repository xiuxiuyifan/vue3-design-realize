
// 定义一个全局变量 activeEffect 他的作用是存贮被注册的副作用函数


let activeEffect

let effectStack = [] // 存放 effect 函数的执行栈

const TriggerType = {
  SET: 'SET',
  ADD: 'ADD',
  DELETE: 'DELETE'
}

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

// map 数据类型设置 key ，并使用 keys 遍历的时候触发依赖时候的 key
const MAP_KEY_ITERATE_KEY = Symbol()

// 设置一个变量，代表是否进行跟踪，默认是 true 是可以跟踪的
let shouldTrack = true

const arrayInstrumentations = {
};

['includes', 'indexOf', 'lastIndexOf'].forEach(method => {
  const originMethod = Array.prototype[method]
  arrayInstrumentations[method] = function (...args) {
    // 先在代理数组里面查找
    let res = originMethod.apply(this, args)
    if (res === false || res === -1) {
      // 如果没找到，就到原始数组中去找
      res = originMethod.apply(this.raw, args)
    }
    return res
  }
});

// 重写数组方法
['push', 'pop', 'shift', 'unshift', 'splice'].forEach((method) => {
  const originMethod = Array.prototype[method]
  arrayInstrumentations[method] = function (...args) {
    // 调用原始方法之前先禁止跟中
    shouldTrack = false
    let res = originMethod.apply(this, args)
    // 调用完成之后 将可跟踪设置为 true
    shouldTrack = true
    return res
  }
})

// 定义对象的方法拦截器

const mutableInstrumentations = {
  add(key) {
    // 获取原始对象
    const target = this.raw
    const hasKey = target.has(key)
    const res = target.add(key)
    if (!hasKey) {
      trigger(target, key, TriggerType.ADD)
    }
    return res
  },
  delete(key) {
    // 获取原始对象
    const target = this.raw
    const hasKey = target.has(key)
    const res = target.delete(key)
    // 如果原始对象上面有 当前要删除的 key 才触发依赖收集
    if (hasKey) {
      trigger(target, key, TriggerType.DELETE)
    }
    return res
  },
  get(key) {
    // 获取原始对象
    let target = this.raw
    // 判断读取的 key 是否存在于原始对象上面
    let had = target.has(key)
    // 依赖收集
    track(target, key)
    // 如果在原始的对象上面存在，那么就取一下
    let res = target.get(key)
    if (had) {
      return typeof res === 'object' ? reactive(res) : res
    }
  },
  set(key, value) {
    let target = this.raw
    const had = target.has(key)
    // 获取老值
    let oldVal = target.get(key)
    //  如果是代理数据的话，那么他上面会有 raw 属性 ，
    // 我们把数据污染定义为：把响应式数据设置到原始数据上面的操作叫做数据污染
    let rawValue = value.raw || value
    // 设置新值
    target.set(key, rawValue)
    // 如果原来没有 则表示新增
    if (!had) {
      trigger(target, key, TriggerType.ADD)
    } else if (oldVal !== value && (oldVal === oldVal && value === value)) {
      // 如果存在并且值变了，就是设置值
      trigger(target, key, TriggerType.SET)
    }
  },
  forEach(callback, thisArgs) {
    // 取得原始数据
    const wrap = val => typeof val === 'object' ? reactive(val) : val
    const target = this.raw
    // 与 iterate_key 建立响应式联系
    track(target, ITERATE_KEY)
    // 调用原始对象的 forEach 方法
    target.forEach((v, k) => {
      callback.call(thisArgs, wrap(v), wrap(k), this)
    })
  },
  [Symbol.iterator]: iterationMethod,
  entries: iterationMethod,
  values: valuesIterationMethod,
  keys: keysIterationMethod
}

function iterationMethod() {
  // 获取原始对象
  let target = this.raw
  // 获取原始迭代器
  let ite = target[Symbol.iterator]()
  // 包裹函数
  const wrap = val => typeof val === 'object' && val !== null ? reactive(val) : val
  // map 调用 for of 进行遍历的时候也要收集依赖
  track(target, ITERATE_KEY)
  return {
    // 迭代器协议
    next() {
      // 调用原始的迭代器方法拿到 value 和 done
      const { value, done } = ite.next()
      return {
        value: value ? [wrap(value[0]), wrap(value[1])] : value,
        done
      }
    },
    // 可迭代协议
    [Symbol.iterator]() {
      return this
    }
  }
}

function valuesIterationMethod() {
  // 获取原始对象
  let target = this.raw
  // 获取原始迭代器 方法
  let ite = target.keys()
  // 包裹函数
  const wrap = val => typeof val === 'object' ? reactive(val) : val
  // map 调用 for of 进行遍历的时候也要收集依赖
  track(target, ITERATE_KEY)
  return {
    // 迭代器协议
    next() {
      // 调用原始的迭代器方法拿到 value 和 done
      const { value, done } = ite.next()
      return {
        value: wrap(value),
        done
      }
    },
    // 可迭代协议
    [Symbol.iterator]() {
      return this
    }
  }
}

function keysIterationMethod() {
  // 获取原始对象
  let target = this.raw
  // 获取原始迭代器 方法
  let ite = target.keys()
  // 包裹函数
  const wrap = val => typeof val === 'object' ? reactive(val) : val
  // map 调用 for of 进行遍历的时候也要收集依赖
  track(target, MAP_KEY_ITERATE_KEY)
  return {
    // 迭代器协议
    next() {
      // 调用原始的迭代器方法拿到 value 和 done
      const { value, done } = ite.next()
      return {
        value: wrap(value),
        done
      }
    },
    // 可迭代协议
    [Symbol.iterator]() {
      return this
    }
  }
}

// 接受第二个参数，表示是否是浅的， 默认不是浅的，是深层的
// 添加第三个参数，表示是否是只读的，默认不是只读的，默认是可读可写
function createReactive(data, isShallow = false, isReadonly = false) {
  const proxy = new Proxy(data, {
    get(target, key, receiver) {
      // 代理对象可以通过raw属性访问原始数据
      if (key === 'raw') {
        return target
      }
      // 处理 set 和 map
      if (target instanceof Set || target instanceof Map) {
        if (key === 'size') {
          // 如果读取的是 size 属性，那么将内部的 this 修改为 原始对象
          track(target, ITERATE_KEY)
          return Reflect.get(target, key, target)
        }
        return mutableInstrumentations[key]
      }
      // 如果操作的目标对象是数组，
      if (Array.isArray(target) && arrayInstrumentations.hasOwnProperty(key)) {
        return Reflect.get(arrayInstrumentations, key, receiver)
      }
      // 触发依赖收集
      let res = Reflect.get(target, key, receiver)
      // 非只读的时候才需要进行依赖收集
      // 不收集 for of 时候触发读取 symbol 属性
      if (!isReadonly && typeof key !== 'symbol') {
        track(target, key)
      }
      // 如果是浅的，则直接 return 掉
      if (isShallow) {
        return res
      }
      // 判断获取到的属性值的类型
      if (typeof res === 'object' && typeof res !== null) {
        // 如果是对象，则需要递归访问返回结果下面的属性，让其进行依赖收集
        // 如果是只读的，调用 readonly 函数处理返回结果
        return isReadonly ? readonly(res) : reactive(res)
      }
      return res
    },
    set(target, key, value, receiver) {
      // 如果是只读的，则打印警告信息，并且直接返回
      if (isReadonly) {
        console.warn(`属性${key}是只读的，不能进行修改！`)
        return true
      }
      // 先获取老值
      let oldVal = target[key]
      // set 之前先区分是 新增还是修改
      // 代理对象如果是数组
      // 如果 设置的 下标小于数组的长度，那么则表示修改，否则表示新增
      let type = Array.isArray(target)
        ? Number(key) < target.length ? TriggerType.SET : TriggerType.ADD
        : Object.prototype.hasOwnProperty.call(target, key) ? TriggerType.SET : TriggerType.ADD
      // 先设置属性
      let result = Reflect.set(target, key, value, receiver)
      // 如果 target === receiver.raw 则说明  receiver 就是 target 的代理对象，而非原型上属性触发的 set
      if (receiver.raw === target) {
        // 后触发依赖
        if (oldVal !== value && (oldVal === oldVal || value === value)) {
          // 添加第四个参数， 既触发响应式时候的新值
          trigger(target, key, type, value)
        }
      }
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
      track(target, Array.isArray(target) ? 'length' : ITERATE_KEY)
      return Reflect.ownKeys(target)
    },
    deleteProperty(target, key) {
      // 如果是只读的，则打印警告信息，并且直接返回
      if (isReadonly) {
        console.warn(`属性${key}是只读的，不能进行修改！`)
        return true
      }
      let hadKey = Object.prototype.hasOwnProperty.call(target, key)

      let res = Reflect.deleteProperty(target, key)

      // 必须是自身上的 key  并且删除成功了 才能触发更新
      if (hadKey && res) {
        trigger(target, key, TriggerType.DELETE)
      }
      return res
    }
  })
  return proxy
}

// 定义一个对象，存贮原始对象和代理对象之间的映射关系
const reactiveMap = new Map()
export function reactive(data) {
  let existProxy = reactiveMap.get(data)
  if (existProxy) return existProxy
  let proxy = createReactive(data)
  reactiveMap.set(data, proxy)
  return proxy
}

export function shallowReactive(data) {
  return createReactive(data, true)
}

export function readonly(data) {
  return createReactive(data, false, true)
}

// 浅的只读属性
export function shallowReadonly(data) {
  return createReactive(data, true, true)
}

// {
//   obj: {
//     name: [effect1, effect2]
//   }
// }

export function track(target, key) {
  // 如果没有 activeEffect 则直接 return 可能是直接访问的
  if (!activeEffect || !shouldTrack) return
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
export function trigger(target, key, type, newVal) {
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
  // 如果是添加或者删除，并且类型是 map 的时候
  if ((type === TriggerType.ADD || type === TriggerType.DELETE) && (Object.prototype.toString.call(target) === '[object Map]')) {
    // 取出相关 map_iterate_key 想管的 effect 执行
    const iterateEffect = targetMap.get(MAP_KEY_ITERATE_KEY)
    iterateEffect && iterateEffect.forEach((effectFn) => {
      if (activeEffect !== effectFn) {
        effectToRun.add(effectFn)
      }
    })
  }
  // 只有新增的时候触发 iterateEffect
  if (
    type === TriggerType.ADD ||
    type === TriggerType.DELETE ||
    // 如果 类型是 SET 并且原始对象是 Map 的时候也应该触发依赖
    (type === TriggerType.SET && Object.prototype.toString.call(target) === '[object Map]')
  ) {
    // 取出对象的 iterateEffect
    let iterateEffect = targetMap.get(ITERATE_KEY)
    // 把 iterate_key 相关的 effect 函数也拿出来
    iterateEffect && iterateEffect.forEach(effectFn => {
      if (activeEffect !== effectFn) {
        effectToRun.add(effectFn)
      }
    })
  }
  // 取数组 length 的 effect 函数
  // {
  //   length: set[fn, fn, fn]
  // }
  if (type === TriggerType.ADD && Array.isArray(target)) {
    let lengthEffect = targetMap.get('length')
    lengthEffect && lengthEffect.forEach(effectFn => {
      if (activeEffect !== effectFn) {
        // 将 length 的依赖函数 添加到要触发的 effect 函数中中
        effectToRun.add(effectFn)
      }
    })
  }

  // 如果目标是数组，并且修改了 数组的 length 属性
  if (Array.isArray(target) && key === 'length') {
    targetMap.forEach((effects, key) => {
      // 找到依赖中 大于等于新 length 的元素
      if (key >= newVal) {
        // 再遍历每个元素的依赖，把他们加入到 要运行的 effect 队列中
        effects.forEach(effectFn => {
          if (activeEffect !== effectFn) {
            effectToRun.add(effectFn)
          }
        })
      }
    })
  }

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


export function ref(val) {
  const wrapper = {
    value: val
  }
  // 在对象身上定义一个不可枚举的属性，用来区分是不是 ref 类型
  Object.defineProperty(wrapper, '__v_isRef', {
    value: true
  })
  return reactive(wrapper)
}










// 解决的问题，

// effect 添加一个参数来实现调度执行，把 effect 执行的控制权，可以交给开发者。

// 一定要记住是设置响应式数据的时候才触发依赖
// 在effect 函数里面触发的 get 才会执行   obj.count 虽然也触发了 get 但是此时的 activeEffect为 undefined
