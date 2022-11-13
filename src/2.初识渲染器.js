

/**
 *
 * @param {虚拟节点} obj
 * @param {根元素} root
 */
function render(obj, root) {
  // 根据 tag 创建一个真实节点
  const el = document.createElement(obj.tag)
  // 遍历 props  属性
  for (let key in obj.props) {
    if (/^on/.test(key)) {
      // 如果是以  on 开头， 说明是事件
      const eventName = key.substring(2).toLowerCase()
      el.addEventListener(eventName, obj.props[key])
    }
  }
  // 判断子节点的类型
  if (typeof obj.children === 'string') {
    // 如果是字符串，创建出一个文本节点
    const text = document.createTextNode(obj.children)
    el.appendChild(text)
  } else if (Array.isArray(obj.children)) {
    // 如果 子节点是数组，则遍历子节点， 使用 el 作为 root 参数 递归创建
    // 用刚才创建出来的节点作为 父节点
    obj.children.forEach(child => {
      render(child, el)
    })
  }
  // 将创建出来的元素添加到 root 中
  root.appendChild(el)
}


let obj = {
  tag: 'div',
  props: {
    onClick: () => {
      alert('hello')
    }
  },
  children: [
    {
      tag: 'span', children: 'hello world'
    }
  ]
}


render(obj, root)
