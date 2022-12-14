
// 定义一个全局变量 activeEffect 他的作用是存贮被注册的副作用函数

let activeEffect

let effectStack = [] // 存放 effect 函数的执行栈

function effect(fn) {
  const effectFn = () => {
    // 在触发 get 之前先清除
    cleanup(effectFn)
    activeEffect = effectFn
    // 在调用真实 的 effect 函数之前 将 effectFn压入栈中
    effectStack.push(effectFn)
    // 调用 effect 函数
    fn()
    // 当调用完 effect 函数之后，载把 activeEffect 还原
    effectStack.pop()  // 丢掉上一次的 effectFn
    // 取栈顶的 effectFn赋值给 activeEffect
    activeEffect = effectStack[effectStack.length - 1]
  }
  // 用来存贮包含所有副作用的集合。
  effectFn.deps = []
  // 执行副作用函数6
  effectFn()
}


const weakmap = new WeakMap()

const data = {
  ok: true,
  text: 'hello world'
}

const obj = new Proxy(data, {
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

// {
//   obj: {
//     name: [effect1, effect2]
//   }
// }

function track(target, key) {
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
function trigger(target, key) {
  // 从weakmap中找出target的依赖信息

  let targetMap = weakmap.get(target)
  // 如果没有找到则 return 掉
  if (!targetMap) return

  // 再找 键对应 的 set 里面存放的就是 effect
  let effects = targetMap.get(key)

  // 新构造一个 set 用来遍历
  let effectToRun = new Set(effects)
  // 遍历effect 并执行
  effectToRun && effectToRun.forEach(effect => {
    effect()
  })
}

function cleanup(effectFn) {
  // 遍历 effectFn.deps数组
  for (let i = 0; i < effectFn.deps.length; i++) {
    const deps = effectFn.deps[i]
    deps.delete(effectFn)
  }
  // 最后重置 deps数组的长度
  effectFn.deps.length = 0
}


let temp1
let temp2
effect(function effect1() {
  console.log('effect1 执行了')
  effect(function effect2() {
    temp2 = obj.ok
    console.log('effect2 执行了')
  })
  temp1 = obj.text
})


console.log(weakmap)

setTimeout(() => {
  obj.text = 'hello vue3'
}, 2000)


// 解决的问题，
// 当 effect 嵌套执行的时候，内层 effect 函数执行完成之后  activeEffect 不会还原的问题
// 解决思路

// 利用一个栈，来存放  effect 的执行过程
