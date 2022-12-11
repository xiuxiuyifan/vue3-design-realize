import { h, ref } from 'vue'
import { Text } from 'vue'
import { onMounted } from 'vue'
// 实现 函数组件
// 实现功能有 动态加载组件
// loading 功能
// 组件显示前延时，如果组件则设定的延时事件之前显示出来，则不显示 loading
// 失败的时候显示的组件
// 组件重试

function defineAsyncComponent(options) {
  // 检测传入的参数类型
  if (typeof options === 'function') {
    // 说明传入的是一个函数, 将 options 重新赋值
    options = {
      loader: options
    }
  }
  // 取出 loader 函数
  const { loader } = options
  let InnerComp = null

  return {
    name: 'AsyncComponentWrapper',
    setup() {
      // 定义一个响应式数据，改变它来触发组件的渲染
      const loaded = ref(false)
      // 代表是否超时， 默认为 false ，既没有超时
      const timeout = ref(false)
      // 调用 loader 函数进行加载
      loader()
        .then(c => {
          // 加载完成，改变响应式数据触发冲新渲染
          InnerComp = c.default
          loaded.value = true
        })

      let timer = null
      // 如果指定了超时时间
      if (options.timeout) {
        // 则开启一个定时器
        setTimeout(() => {
          // 将超时的状态设置为 true
          console.log('超时了')
          timeout.value = true
        }, options.timeout)
      }
      // 组件销毁时清除定时器
      onMounted(() => {
        clearTimeout(timer)
      })


      // 设置一个占位的组件
      const placeholder = {
        type: Text,
        children: '',
        shapeFlag: 8
      }
      return () => {
        if (loaded.value) {
          return {
            type: InnerComp,
            shapeFlag: 4
          }
        } else if (timeout.value) {
          // 如果超时了，
          return options.errorComponent ? {
            type: options.errorComponent,
            shapeFlag: 4
          } : placeholder
        } else {
          return placeholder
        }
      }
    }
  }
}

export default defineAsyncComponent
