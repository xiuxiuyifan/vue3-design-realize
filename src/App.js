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
      delay: 200,
      timeout: 10000,  // 超时时间  单位为 ms
      errorComponent: errorComp,  // 指定加载出错时要渲染的组件
      onError(retry, fail, retries) {
        console.log('重试次数' + retries)
        retry()
      }
    })
    return h(t2)
  }
}

export default App

function fetch() {
  return new Promise((resolve, reject) => {
    // 模拟请求会在 1 秒之后失败
    setTimeout(() => {
      console.log('发送请求 ')
      reject('err')
    }, 1000)
  })
}

function load(onError) {
  const p = fetch()
  return p.catch(err => {
    return new Promise((resolve, reject) => {
      const retry = () => resolve(load(onError))
      const fail = () => reject(err)
      onError(retry, fail)
    })
    // 我猜这里用返回一个新的 promise 的意义是，是为了决定后面  .then 链的执行结果
    // const retry = () => load(onError)
    // const fail = () => { }
    // onError(retry, fail)
  })
}

load((retry, fail) => {
  // 失败后调用重试
  // retry()
  // fail()
})
  .then((res) => {
    console.log(res)
  })
  .catch((err) => {
    console.log(err)
  })
