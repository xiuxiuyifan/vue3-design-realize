import {
  effect,
  reactive,
  jobQueue,
  flushJob,
  trigger,
  track,
  computed,
  watch,
  shallowReactive,
  readonly,
  shallowReadonly
} from './vue.js'

// import {
//   effect,
//   reactive,
//   computed,
//   watch
// } from 'vue'



// effect(
//   () => {
//     console.log(obj.count);
//   },
//   {
//     // 调度器 scheduler 是一个函数， 被调用的时候会传入当前的 effect 函数，让用户可以在，再次触发 trigger函数的时候手动调用
//     scheduler: (fn) => {
//       // 当触发依赖的时候将副作用函数加入到  jsbQueue 中
//       jobQueue.add(fn);
//       // 同时调用刷新任务的函数， 当同步触发多次 scheduler 函数的时候，会在 flushJob 函数中消除掉多余的调用次数
//       flushJob();
//     },
//   }
// );


// const effectFn = effect(() => {
//   console.log(obj.count)
// }, {
//   lazy: true
// })

// // 手动执行返回出来的函数
// effectFn()

// 我们发现这样执行的意义并不是很大，
// 假设，我们手动执行完这个函数之后可以拿到他的返回值。是不是会更有用呢？？

// const effectFn = effect(() => {
//   return obj.count + 1
// }, {
//   lazy: true
// })

// // 手动执行返回出来的函数
// const value = effectFn()
// console.log(value)


// 下面我们就有来使用一下这个 computed 函数


// const val = computed(() => {
//   console.log('hihi')
//   return obj.count + 1
// })


// console.log(val.value)

// // 当obj.count 发生变化的时候，会重新执行 computed 里面的 getter 函数。

// obj.count = 10

// console.log(val.value)
// console.log(val.value)
// console.log(val.value)
// console.log(val.value)
// console.log(val.value)



// const data = { foo: 1, bar: 2 }
// const obj = reactive(data)
// const sumRes = computed(() => obj.foo + obj.bar)
// console.log(sumRes.value)  // 3
// console.log(sumRes.value)  // 3
// // 修改 obj.foo
// obj.foo++
// // 再次访问，得到的仍然是 3，但预期结果应该是 4
// console.log(sumRes.value)  // 3



// 它体现在当我们在另外一个 effect 中读取计算属性的值时：
// const data = { foo: 1, bar: 2 }
// const obj = reactive(data)
// const sumRes = computed(() => obj.foo + obj.bar)
// effect(() => {
//   // 在该副作用函数中读取 sumRes.value
//   console.log(sumRes.value)
// })
// // 修改 obj.foo 的值
// obj.foo++


// const data = { foo: 1, bar: 2 }
// const obj = reactive(data)


//TODO这样貌似会多执行一次
// const data = { foo: 1, bar: 2 }
// const obj = reactive(data)


// watch(obj, () => {
//   console.log('watch 到变化了1', obj.foo)
// })
// obj.foo++


// watch(() => obj.foo, () => {
//   console.log('watch 到变化了2', obj.foo)
// })

// obj.foo++


// const data = { foo: 1, bar: 2 }
// const obj = reactive(data)

// watch(() => obj.foo, (newValue, oldValue) => {
//   console.log('watch 到变化了', newValue, oldValue)
// })
// obj.foo++



// const data = { foo: 1, bar: 2 }
// const obj = reactive(data)

// watch(() => obj.foo, (newValue, oldValue) => {
//   console.log('watch 到变化了', newValue, oldValue)   // 第一次没有老值，所以 oldValue 就是 undefined
// }, {
//   immediate: true
// })



// function ajax(timer, data) {
//   return new Promise((resolve, reject) => {
//     setTimeout(() => {
//       resolve(data)
//     }, timer);
//   })
// }

// const data = { num: 3 }
// const obj = reactive(data)

// let finishData
// watch(obj, async (newValue, oldValue, onCleanup) => {
//   console.log('触发watch了')
//   let expired = false
//   // 调用 onCleanup 函数 注册一个 过期回调
//   onCleanup(() => {
//     expired = true
//   })

//   let res = await ajax(obj.num * 1000, obj.num * 1000)
//   console.log('res', res)
//   if (!expired) {
//     finishData = res
//   }
// })

// obj.num--
// obj.num--

// setTimeout(() => {
//   console.log('最终的结果', finishData)
// }, 5000);


// const data = {
//   foo: 1,
//   get bar() {
//     return this.foo
//   }
// }
// const p = reactive(data)

// effect(() => {
//   console.log(p.bar)   //  在访问 bar 的时候，我们也默认访问了 foo 属性
// })

// setTimeout(() => {
//   p.foo++    // 如果不使用 reflect 的话则修改的时候  修改的就是 源对象，并没有修改 代理后的 proxy 对象，所以不会触发依赖更新
// }, 2000)


// const data = {
//   foo: 1
// }

// const obj = reactive(data)

// effect(() => {
//   console.log('effect run', 'foo' in obj)  // 这样将会建立依赖关系
// })

// // 过几秒之后我们修改 foo 的值，看是否会触发依赖函数重新执行呢？
// setTimeout(() => {
//   obj.foo++
// }, 1000)


// const data = {
//   foo: 1
// }

// const obj = reactive(data)

// effect(() => {
//   // 测试 for  in 循环
//   for (let key in obj) {
//     console.log(key)
//   }
// })

// // 过一秒之后我们给响应式对象上面添加一个新的属性是否会重新触发依赖函数吗？
// setTimeout(() => {
//   obj.bar = 99
// }, 1000)


// const data = {
//   foo: 1
// }

// const obj = reactive(data)

// effect(() => {
//   // 测试 for  in 循环
//   for (let key in obj) {
//     console.log(key)
//   }
// })

// // 过一秒之后我们给响应式对象上面添加一个新的属性是否会重新触发依赖函数吗？
// setTimeout(() => {
//   obj.foo = 99
// }, 1000)


// const data = {
//   foo: 1,
//   bar: 99
// }

// const obj = reactive(data)

// effect(() => {
//   // 测试 for  in 循环
//   for (let key in obj) {
//     console.log(key)
//   }
// })

// // 过一秒之后我们给响应式对象上面添加一个新的属性是否会重新触发依赖函数吗？
// setTimeout(() => {
//   delete obj.foo
// }, 1000)


// const data = {
//   foo: NaN
// }

// const obj = reactive(data)

// effect(() => {
//   console.log(obj.foo)
// })

// // 设置一样的值的时候，不触发依赖
// setTimeout(() => {
//   obj.foo = NaN
// }, 1000)


// const obj = {}
// const proto = { bar: 1 }

// const child = reactive(obj)
// const parent = reactive(proto)

// // 让 parent 作为 child 的原型
// Object.setPrototypeOf(child, parent)

// effect(() => {
//   console.log(child.bar)
// })

// // 设置一样的值的时候，不触发依赖

// setTimeout(() => {
//   child.bar = 100
// }, 1000)



// const data = {
//   foo: {
//     bar: 1
//   }
// }

// const obj = reactive(data)

// effect(() => {
//   console.log(obj.foo.bar)
// })

// // 设置一样的值的时候，不触发依赖

// setTimeout(() => {
//   obj.foo.bar = 99
// }, 1000)


// const data = {
//   foo: {
//     bar: 1
//   }
// }
// const data1 = {
//   foo: {
//     bar: 1
//   }
// }

// const obj = reactive(data)
// const shallowObj = shallowReactive(data1)

// effect(() => {
//   console.log(obj.foo.bar)
// })

// effect(() => {
//   console.log(shallowObj.foo.bar)
// })

// // 设置一样的值的时候，不触发依赖

// setTimeout(() => {
//   obj.foo.bar = 99
//   shallowObj.foo.bar = 100
// }, 1000)


// const data = {
//   foo: 1
// }

// const obj = readonly(data)

// obj.foo = 100


// const data = {
//   foo: 1
// }

// const obj = readonly(data)

// effect(() => {
//   console.log(obj.foo)
// })


// const data = {
//   foo: {
//     bar: 1
//   }
// }

// const obj = readonly(data)

// obj.foo.bar = 99
// console.log(obj.foo.bar)

// const data = {
//   num: 1,
//   foo: {
//     bar: 1
//   }
// }

// const obj = shallowReadonly(data)

// obj.num = 100
// obj.foo.bar = 99
// console.log(obj.foo.bar)


// const data = ['foo']

// const arr = reactive(data)

// effect(() => {
//   console.log(arr[0])
// })

// arr[0] = 'bar'


// const data = ['foo']

// const arr = reactive(data)

// effect(() => {
//   console.log(arr.length)
// })

// arr[1] = 'bar'


// const data = [1, 2]

// const arr = reactive(data)

// effect(() => {
//   // 访问数组的 第 0 个元素
//   console.log(arr[0], arr[1])
// })

// // 将数组的长度改为 0
// arr.length = 0


// const data = [1, 2]

// const arr = reactive(data)

// effect(() => {
//   for (const key in arr) {
//     console.log(key) //
//   }
// })

// // arr[2] = 3
// setTimeout(() => {
//   arr.length = 1
// }, 1000)



// const data = [1, 2]

// const arr = reactive(data)

// effect(() => {
//   for (const val of arr) {
//     console.log(val) //
//   }
// })

// setTimeout(() => {
//   arr[2] = 3
// }, 1000)


// const obj = {}

// const arr = reactive([obj])

// console.log(arr.includes(arr[0]))   //  得到的两个代理对象是不同的，所以会返回 false


// const obj = {}

// const arr = reactive([obj])

// console.log(arr.includes(obj))   //  那原始对象去 代理对象里面找肯定找不见  我们需要重写 includes方法


// const obj = {}

// const arr = reactive([obj])

// console.log(arr.indexOf(obj))   //  那原始对象去 代理对象里面找肯定找不见  我们需要重写 includes方法


// const arr = reactive([])

// // 第一个副作用函数
// effect(() => {
//   arr.push(1)
// })

// // 调用第二个副作用函数

// effect(() => {
//   arr.push(1)
// })


// console.log(arr)

// const obj = reactive(new Set([1, 2, 3]))
// console.log(obj.delete(1))


// const obj = reactive(new Set([1, 2, 3]))

// effect(() => {
//   console.log(obj.size)
// })

// // setTimeout(() => {
// //   obj.add(4)
// // }, 1000);

// setTimeout(() => {
//   obj.delete(3)
// }, 1000);


// const obj = reactive(new Map([['key', 1]]))
// effect(() => {
//   console.log(obj.get('key'))
// })

// setTimeout(() => {
//   obj.set('key', 2)
// }, 1000);

// const m = new Map()

// const p1 = reactive(m)

// const p2 = reactive(new Map())

// // 给 p1 设置一个键值对 p2  值是 p2

// p1.set('p2', p2)

// console.log(p1)
// effect(() => {
//   console.log(m.get('p2').size)
// })


// // 通过原来的值 也可以触发响应式数据 这样就显得有点混乱了
// setTimeout(() => {
//   m.get('p2').set('foo', 1)
// }, 1000);


// const p = reactive(new Map([
//   [{ key: 1 }, { value: 1 }]
// ]))

// effect(() => {
//   p.forEach((value, key) => {
//     console.log(value, key)
//   })
// })

// setTimeout(() => {
//   p.set({ key: 2 }, { value: 2 })
// }, 1000)

const key = { key: 1 }
const value = new Set([1, 2, 3])

const p = reactive(new Map([
  [key, value]
]))

effect(() => {
  p.forEach(function (value, key) {
    console.log(value.size)
  })
})

setTimeout(() => {
  p.get(key).delete(1)
}, 1000)

