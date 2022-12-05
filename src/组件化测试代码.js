import { renderer } from "./renderer"

const MyComponent = {
  name: 'MyComponent',
  render() {
    return {
      type: 'div',
      children: '我是文本内容'
    }
  }
}

// 用来描述组件的 vnode 对象， type 属性值为组件的选项对象
const CompVNode = {
  type: MyComponent
}

renderer.render(CompVNode, document.getElementById('root'))
