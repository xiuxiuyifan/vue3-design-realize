import { Fragment, h } from 'vue'
// import { defineAsyncComponent } from 'vue'
import defineAsyncComponent from './defineAsyncComponent'

const App = {
  setup() {

  },
  render() {
    // const t = {
    //   shapeFlag: 4,
    //   type: Foo
    // }
    // return t
    const loading = {
      render() {
        return 'loading'
      }
    }

    const error = {
      setup(props) {
      },
      render() {
        console.log(this)
        return 'error'
      }
    }

    const errorComp = error

    const loadingComp = loading


    const t2 = defineAsyncComponent({
      loader: () => import('./Foo.js'),  // 要动态加载的组价
      loadingComponent: loadingComp, // loading 组件
      timeout: 10000,  // 超时时间  单位为 ms
      errorComponent: errorComp  // 指定加载出错时要渲染的组件
    })
    return h(t2)
  }
}

export default App
