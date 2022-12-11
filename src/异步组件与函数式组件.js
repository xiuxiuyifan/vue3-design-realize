
// import App from './App.js'
// import { Fragment, onMounted, renderer } from "./renderer"
import { createApp } from 'vue'
import App from './App'



// // renderer.render(App, document.getElementById('root'))  // 同步事件组建的渲染



// // 演示加载

// setTimeout(() => {
//   // 下面展示异步实现

//   const loader = () => import('./App.js')

//   // 异步加载组件
//   loader()
//     .then((App) => {
//       renderer.render(App.default, document.getElementById('root'))
//     })
// }, 1000);

createApp(App).mount(document.getElementById('root'))
