import {
  effect,
  reactive,
  jobQueue,
  flushJob,
  trigger,
  track,
  computed,
  watch
} from './vue'

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


const data = {
  foo: NaN
}

const obj = reactive(data)

effect(() => {
  console.log(obj.foo)
})

// 设置一样的值的时候，不触发依赖
setTimeout(() => {
  obj.foo = NaN
}, 1000)


