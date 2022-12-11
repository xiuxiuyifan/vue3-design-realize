import { h, ref, render, shallowRef } from 'vue'
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
      // 存储发生 error 时候的错误
      const error = shallowRef(null)
      // 定义一个辨识，代表是否正在加载， 默认为 false
      const loading = ref(false)

      let loadingTimer = null

      // 检查配置项中是否有 delay 选项
      if (options.delay) {
        loadingTimer = setTimeout(() => {
          // 在设置的 延时时间后才能显示 loading组件
          loading.value = true
        }, options.delay)
      } else {
        loading.value = true
      }

      // 调用 loader 函数进行加载
      loader()
        .then(c => {
          // 加载完成，改变响应式数据触发冲新渲染
          InnerComp = c.default
          loaded.value = true
        })
        // 在 catch 里面获取错误信息
        .catch(err => {
          error.value = err
        })
        .finally(() => {
          // 组件加载成功则，取消 loading
          loading.value = false
          // 加载完毕后，无论成功与否都要清除定时器
          clearTimeout(loadingTimer)
        })

      let timer = null
      // 如果指定了超时时间
      if (options.timeout) {
        // 则开启一个定时器
        setTimeout(() => {
          // 将超时的状态设置为 true
          // 超时后也创建一个错误对象，赋值给 error.value
          const err = new Error(`异步组件加载超时了 ${options.timeout}`)
          error.value = err
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
        } else if (error.value && options.errorComponent) {
          // 有错误，并且用户配置了 错误时候要展示的组件的时候，同时把错误信息传递给用户
          return {
            type: options.errorComponent,
            shapeFlag: 4,
            props: {
              error: error.value
            }
          }
        } else if (loading.value && options.loadingComponent) {
          // 如果可以 loading 了，并且用户有传入 loading 的组件
          return {
            type: options.loadingComponent,
            shapeFlag: 4
          }
        } else {
          return placeholder
        }
      }
    }
  }
}

export default defineAsyncComponent
