import {
  effect,
  reactive,
  jobQueue,
  flushJob,
  trigger,
  track,
  computed
} from './vue'



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
const data = { foo: 1, bar: 2 }
const obj = reactive(data)
const sumRes = computed(() => obj.foo + obj.bar)
effect(() => {
  // 在该副作用函数中读取 sumRes.value
  console.log(sumRes.value)
})
// 修改 obj.foo 的值
obj.foo++
