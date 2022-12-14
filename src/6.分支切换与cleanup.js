
// 定义一个全局变量 activeEffect 他的作用是存贮被注册的副作用函数

let activeEffect


function effect(fn) {
  const effectFn = () => {
    // 在触发 get 之前先清除
    cleanup(effectFn)
    activeEffect = effectFn
    // 调用 effect 函数
    fn()
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

effect(() => {
  console.log('run effect')
  root.innerHTML = obj.ok ? obj.text : 'not'
})

setTimeout(() => {
  obj.ok = false
}, 2000)

setTimeout(() => {
  obj.text = 'hello Vue3'
}, 3000);

console.log(weakmap)


// 记录要点， 如果我们不做依赖的清理，那么 deps 里面就会被收集多次，
