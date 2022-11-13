import {
  effect,
  reactive,
  jobQueue,
  flushJob,
  trigger,
  track
} from './vue'


const obj = reactive({ count: 1 })

effect(
  function effect1() {
    console.log(obj.count);
  },
  {
    // 调度器 scheduler 是一个函数， 被调用的时候会传入当前的 effect 函数，让用户可以在，再次触发 trigger函数的时候手动调用
    scheduler: (fn) => {
      // 当触发依赖的时候将副作用函数加入到  jsbQueue 中
      jobQueue.add(fn);
      // 同时调用刷新任务的函数， 当同步触发多次 scheduler 函数的时候，会在 flushJob 函数中消除掉多余的调用次数
      flushJob();
    },
  }
);


