import { renderer } from "./renderer"

// const MyComponent = {
//   name: 'MyComponent',
//   render() {
//     return {
//       type: 'div',
//       children: '我是文本内容'
//     }
//   }
// }

// // 用来描述组件的 vnode 对象， type 属性值为组件的选项对象
// const CompVNode = {
//   type: MyComponent
// }

// renderer.render(CompVNode, document.getElementById('root'))



//  组件状态
const MyComponent = {
  name: 'MyComponent',
  data() {
    return {
      foo: 'hello world'
    }
  },
  render() {
    return {
      type: 'div',
      children: `foo 的值是 ${this.foo}`  //  在 render 函数内部使用 组价状态
    }
  }
}

// 用来描述组件的 vnode 对象， type 属性值为组件的选项对象
const CompVNode = {
  type: MyComponent
}

renderer.render(CompVNode, document.getElementById('root'))
