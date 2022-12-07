import { effect, reactive, shallowReactive } from './reactivity'

// 文本节点类型
export const Text = Symbol()
// 注释接单类型
export const Comment = Symbol()

// Fragment 类型
export const Fragment = Symbol()

// 获取一个数组中最长的递增子序列
function getSequence(arr) {
  const p = arr.slice()
  const result = [0]
  let i, j, u, v, c
  const len = arr.length
  for (i = 0; i < len; i++) {
    const arrI = arr[i]
    if (arrI !== 0) {
      j = result[result.length - 1]
      if (arr[j] < arrI) {
        p[i] = j
        result.push(i)
        continue
      }
      u = 0
      v = result.length - 1
      while (u < v) {
        c = ((u + v) / 2) | 0
        if (arr[result[c]] < arrI) {
          u = c + 1
        } else {
          v = c
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1]
        }
        result[u] = i
      }
    }
  }
  u = result.length
  v = result[u - 1]
  while (u-- > 0) {
    result[u] = v
    v = p[v]
  }
  return result
}

// 缓存 effect 函数中的 副作用函数
const queue = new Set()
// 定义一个标识，标识当前是否正在刷新任务队列
let isFlushing = false
// 创建一个立即 resolve 的 Promise 实例
const p = Promise.resolve()
// 调度器的主函数，将一个任务添加到缓冲队列中，并开始刷新
function queueJob(job) {
  // 将任务添加到队列中
  queue.add(job)
  // 如果任务还没有开始刷线，则开始刷新
  if (!isFlushing) {   // 只有第一次会进来，后面同步的代码就进不来了
    // 将该值标记为 true， 以避免重复刷新
    isFlushing = true
    // 在任务队列中刷新缓冲队列
    p.then(() => {
      try {
        queue.forEach(job => job())
      } finally {
        isFlushing = false
        queue.clear()
      }
    })
  }
}
function createRenderer(options) {

  const {
    createElement,
    insert,
    setElementText,
    patchProps,
    createText,
    setText
  } = options


  function mountElement(vnode, container, anchor) {
    // 根据虚拟节点的 type 创建出真实节点
    // 让虚拟节点与真实 DOM 之间建立联系
    const el = vnode.el = createElement(vnode.type)
    // 如果当前节点存在 props
    if (vnode.props) {
      // 遍历 props
      for (const key in vnode.props) {
        patchProps(el, key, null, vnode.props[key])
      }
    }
    // 判断 vnode 孩子的类型
    if (typeof vnode.children === 'string') {
      setElementText(el, vnode.children)
    } else if (Array.isArray(vnode.children)) {
      // 判断当 子 vnode 是数组的时候, 就需要循环遍历子节点，然后将子节点插入到刚才新建的
      vnode.children.forEach(child => {
        // 用 patch 函数把子节点挂载到父节点上面
        patch(null, child, el)
      })
    }
    // 将新创建的元素挂载到容器下面
    insert(el, container, anchor)
  }

  function patchElement(n1, n2) {
    // 老的真实DOM的复用
    const el = n2.el = n1.el
    const oldProps = n1.props
    const newProps = n2.props

    // 更新 props
    // 先用 遍历 新的 props 用新的 props 替换老的 props 里面的属性
    for (const key in newProps) {
      // 如果新旧 props 的值不相等
      if (newProps[key] !== oldProps[key]) {
        patchProps(el, key, oldProps[key], newProps[key])
      }
    }
    // 再遍历老的 props 删除新的中没有的属性
    for (const key in oldProps) {
      // 老属性中有 ，新属性中没有的，将其删除
      if (!(key in newProps)) {
        patchProps(el, key, oldProps[key], null)
      }
    }

    // 更新 children
    patchChildren(n1, n2, el)
  }

  function patchChildren(n1, n2, container) {
    // 先判断新子节点的类型
    if (typeof n2.children === 'string') {
      // 如果新节点的类型是 字符串
      if (Array.isArray(n1.children)) {
        // 如果老节点是一个数组
        // 则需要逐个卸载
        n1.children.forEach(c => unmount(c))
      }
      // 当卸载完成之后将新的文本节点设置给容器元素
      setElementText(container, n2.children)
    } else if (Array.isArray(n2.children)) {
      // 新的虚拟节点是数组
      if (Array.isArray(n1.children)) {
        // 如果老节点也是一组 数组
        // 则进入核心的 Diff 算法
        patchKeyedChildren(n1, n2, container)
      } else {
        // 旧节点 要么是 字符串 要么没有 ， 我们只需要挂载新的节点，并清除老的节点即可
        setElementText(container, '')
        // 创建新的节点
        n2.children.forEach(c => patch(null, c, container))
      }
    } else {
      // 代码运行到这里，就是新子节点不存在
      if (Array.isArray(n1.children)) {
        // 如果老节点是数组，则逐一卸载
        n1.children.forEach(c => unmount(c))
      } else if (typeof n1.children === 'string') {
        // 旧节点是文本，则只需要清空旧节点即可
        setElementText(container, '')
      }
      // 新老节点 都是 null 则什么都不需要做
    }
  }

  /**
   * 采用双端对比算法 找到要移动的节点
   * @param {老 vnode} n1
   * @param {新 vnode} n2
   * @param {容器} container
   */
  function patchKeyedChildren(n1, n2, container) {
    const oldChildren = n1.children
    const newChildren = n2.children
    // 处理相同的前置节点
    let j = 0   // 索引指向新旧节点的开头节点
    let oldVNode = oldChildren[j]
    let newVNode = newChildren[j]
    // 然后从开头开始判断
    while (oldVNode.key === newVNode.key) {
      // 进行打补丁
      patch(oldVNode, newVNode, container)
      // 如果相等，则移动 j
      j++
      oldVNode = oldChildren[j]
      newVNode = newChildren[j]
    }

    // 从后开始网上找  相同的节点
    // 因为新老 虚拟节点的长度有可能不同，所以要用两个索引来实现
    let oldEnd = oldChildren.length - 1
    let newEnd = newChildren.length - 1

    // 取出 尾部节点
    oldVNode = oldChildren[oldEnd]
    newVNode = newChildren[newEnd]
    // 从后开始对比，
    while (oldVNode.key === newVNode.key) {
      // 打补丁
      patch(oldVNode, newVNode, container)
      // 如果尾部节点相同，则往上移动索引
      oldEnd--
      newEnd--
      oldVNode = oldChildren[oldEnd]
      newVNode = newChildren[newEnd]
    }
    // 当头部相同的节点 和尾部相同的节点处理完毕之后
    //  老节点已经处理完成了，新节点还没有处理完成
    if (j > oldEnd && j <= newEnd) {
      // 此时应该把新节点没有处理完成的都 进行插入
      // 计算锚点的索引
      let anchorIndex = newEnd + 1   // 用最后一个匹配到的新元素 作为参考节点，
      // 如果 当前索引小于 新 children 的长度，则说明 参考节点在新的元素中，否则说明参考节点已经是最后一个元素了，直接追加即可
      let anchor = anchorIndex < newChildren.length ? newChildren[anchorIndex].el : null
      while (j <= newEnd) {
        patch(null, newChildren[j++], container, anchor)
      }
    } else if (j > newEnd && j <= oldEnd) {
      // j 到 oldEnd 直接的元素都婴孩被卸载
      while (j <= oldEnd) {
        unmount(oldChildren[j++])
      }
    } else {
      // 当头部节点和尾部节点都对比完成之后，新老节点都还有剩余的时候
      // 先定义一个 source 数组
      let count = newEnd - j + 1
      // 这个数组用来存储新新子节点在旧子节点中的位置位置索引，后续用它计算出一个递增子序列，并用于辅助完成 DOM 移动的操作
      let source = new Array(count)
      source.fill(-1)

      // oldStart 和 endStart 的值都从 j 开始
      let oldStart = j
      let newStart = j
      // 新增两个变量
      let moved = false  // 代表是否需要移动节点
      let pos = 0     // 代表遍历一组节点中遇到的最大索引

      // 构建新节点的索引表
      const keyIndex = {}
      for (let i = newStart; i <= newEnd; i++) {
        keyIndex[newChildren[i].key] = i   // 记录新节点  key 和索引位置
      }
      // 新增 patched 代表新增过的节点数量
      let patched = 0
      // 循环老节点，记录新节点在老节点中的位置
      for (let i = oldStart; i <= oldEnd; i++) {
        oldVNode = oldChildren[i]
        // 如果如果更新过的节点数量小于等于需要更新的节点数量，则执行更新
        if (patched <= count) {
          // 通过老节点的 key 找到新节点中具有相同 key 元素的位置
          const k = keyIndex[oldVNode.key]
          if (typeof k !== 'undefined') {
            // 找出新节点
            newVNode = newChildren[k]
            patch(oldVNode, newVNode, container)
            // 每更新一个节点，都将 patched + 1
            patched++
            // 填充 source 数组
            source[k - newStart] = i
            // 判断节点是否移动
            if (k < pos) {
              // 新的节点如果一旦不是升序，则说明要移动节点
              // 老节点中是按 顺序遍历的
              moved = true
            } else {
              pos = k
            }
          } else {
            // 如果在新子节点中没有找到，则说明是需要 卸载的元素
            unmount(oldVNode)
          }
        } else {
          // 如果更新过的节点数量大于要更新节点的数量，则说明老节点有多余的需要卸载
          unmount(oldVNode)
        }
      }
      if (moved) {
        // 如果有要移动的节点
        const seq = getSequence(source)
        let s = seq.length - 1  // 指向最长新增子序列的最后一个节点
        let i = count - 1 // 指向新一组节点的最后一个元素
        for (i; i >= 0; i--) {  // 从后往前开始遍历
          if (source[i] === -1) {
            // 表示全新的节点，需要进行挂载
            // 找到该节点在真实 vnode 中的位置
            let pos = i + newStart
            let newVNode = newChildren[pos]

            // 该节点的下一个位置
            let nextPos = pos + 1
            // 找到 锚点
            let anchor = nextPos < newChildren.length ? newChildren[nextPos].el : null
            // 挂载
            patch(null, newVNode, container, anchor)
          }
          else if (i !== seq[s]) {
            // 不在最长子序列的数组中，则说明需要移动
            let pos = i + newStart
            let newVNode = newChildren[pos]

            // 该节点的下一个位置
            let nextPos = pos + 1
            // 找到 锚点
            let anchor = nextPos < newChildren.length ? newChildren[nextPos].el : null
            // 移动
            insert(newVNode.el, container, anchor)
          } else { // 此时不需要移动，只需要 s 指向下一个位置
            s--
          }
        }
      }
    }
  }

  /**
   * 接受一个虚拟节点，根据虚拟节点找到 真实节点 并根据真实节点 的 parent 将其移除
   * @param {*} vnode
   */
  function unmount(vnode) {
    // 卸载的时候如果发现vnode 的类型是 Fragment 的话，则需要卸载 children
    if (vnode.type === Fragment) {
      // 逐一卸载 Fragment 的真实子节点
      vnode.children.forEach(c => unmount(c))
      return
    }
    // 获取真实 DOM 的父元素
    const parent = vnode.el.parentNode
    if (parent) {
      // 移除真实 DOM
      parent.removeChild(vnode.el)
    }
  }


  function mountComponent(vnode, container, anchor) {
    // 通过 vnode 获取组建的选项对象
    const componentOptions = vnode.type
    // 从组件对象的属性上 拿到 render 函数
    const { render, data, beforeCreate, created, beforeMount, mounted, beforeUpdate, updated, props: propsOptions } = componentOptions
    // 在数据初始化之前 调用 beforeCreate
    beforeCreate && beforeCreate()
    // 执行 data 函数，拿到返回的对象，调用 reactive 函数将对象进行响应式代理
    const state = reactive(data())
    // 调用 resolveProps 函数解析出 props 和 attrs 的数据
    const [props, attrs] = resolveProps(propsOptions, vnode.props)
    // 定义一个组件实例，它本身就是一个对象，包含与组件有关的状态信息
    const instance = {
      // 组件数据
      state,
      // 将解析出来的 props 数据包装为 shallowReactive 并定义到组件实例上
      props: shallowReactive(props),
      // 表示组件是否已经挂载，初始值是 false
      isMounted: false,
      // 组件渲染的内容，既子树
      subTree: null
    }
    // 这点也比较重要，将组件实例设置到 vnode 上面用于后序更新
    vnode.component = instance
    // 创建渲染上下文， 本质上是组件实例的代理
    const renderContext = new Proxy(instance, {
      get(t, k, r) {
        // 从 instance 上面取得  props data
        const { props, state } = t
        // 先在 自身的 state 上面查找
        if (state && k in state) {
          return state[k]
        } else if (k in props) {
          // 再从 props 上面读取
          return props[k]
        } else {
          console.log('不存在')
        }
      },
      set(t, k, v, r) {
        // 这里是，假设用户通过 this 来修改 instance 上的属性会走到这里
        const { props, state } = t
        // 先在 自身的 state 上面查找
        if (state && k in state) {
          state[k] = v
        } else if (k in props) {  // 修改 props
          console.log(`props ${k} 不能修改`)
        } else {
          console.log('不存在')
        }
      }
    })
    // 在这里调用 created
    created && created.call(renderContext)
    // 执行 render 函数 拿到子组件的虚拟节点树
    // 使用 call 将 函数内部 this 绑定为 state
    effect(() => {
      // 调用组件的 渲染函数 获得子树
      const subTree = render.call(renderContext, state)
      // 其实这里利用了闭包， 拿到外部的 instance 实例
      // 判断组件实例是否已经挂载完成了
      if (!instance.isMounted) {
        // 执行挂载逻辑
        // patch 之前调用
        beforeMount && beforeMount.call(renderContext)
        // 最后调用 patch 函数来挂载 子树  既 subTree
        patch(null, subTree, container, anchor)
        // 当挂载完成之后，将组件是否挂载的变量设置成 true
        instance.isMounted = true
        // patch 之后调用 mounted
        mounted && mounted.call(renderContext)
      } else {
        // 打补丁之前
        beforeUpdate && beforeUpdate.call(renderContext)
        // 当 isMounted = true 的时候，执行更新操作，使用最新的 子树 和 上一次的子树 进行打补丁
        patch(instance.subTree, subTree, container, anchor)
        // 在 patch 之后调用 updated
        updated && updated.call(renderContext)
      }
      // 记录上一次的 子树内容
      instance.subTree = subTree
    }, {
      scheduler: queueJob
    })
  }

  function patchComponent(n1, n2, container) {
    // 获取组件实例 , 同时让新 组件的虚拟节点 的 component 属性指向 老的组件实例
    const instance = (n2.component = n1.component)
    // 获取当前组件的 props
    const { props } = instance
    // 检测传递给子组件的 props 是否发生了变化，如果没有发生变化，则不需要更新
    if (hasPropsChanged(n1.props, n2.props)) {
      // 获取新的 props
      const [nextProps] = resolveProps(n2.type.props, n2.props)
      // 更新 props
      for (const key in nextProps) {
        // 重新赋值
        props[key] = nextProps[key]
      }
      // 删除不存在的 props // 遍历老的 props
      for (const key in props) {
        // 在新的里面没有
        if (!key in nextProps) {
          delete props[key]
        }
      }
    }
  }

  function hasPropsChanged(prevProps, nextProps) {
    // 如果两者的 长度不一样则不相同  说明有变化
    const nextKeys = Object.keys(nextProps)
    if (nextKeys.length !== Object.keys(prevProps).length) {
      return true
    }
    // 遍历新的 props
    for (let i = 0; i < nextKeys.length; i++) {
      const key = nextKeys[i]
      // 如果老的 props 和新的 props 的值不相同，则说明 新老的 props 值有变化
      if (nextProps[key] !== prevProps[key]) return true
    }
    return false
  }


  /**
   *
   * @param {*} 组件内部用户声明的 props
   * @param {*} 传递下来的 props  vnode.props
   */
  function resolveProps(options, propsData) {
    const props = {}
    const attrs = {}
    // 遍历用户组件中定义的 props
    for (let key in propsData) {
      // 如果在用户定义的 props 里面，则将其收集到 props 里面 去
      if (key in options) {
        props[key] = propsData[key]
      } else {
        // 否则将其收集到 attrs 里面其
        attrs[key] = propsData[key]
      }
    }
    return [props, attrs]
  }

  /**
   *
   * @param {*} n1 老 vnode
   * @param {*} n2 新 vnode
   * @param {*} container  容器
   * @param {*} anchor  参考节点
   */
  function patch(n1, n2, container, anchor) {
    // 如果新老节点的 类型不一样，则移除老节点
    if (n1 && n1.type !== n2.type) {
      unmount(n1)
      n1 = null
    }
    // 以下表示 新旧 虚拟节点描述的内容是一样的
    const { type } = n2
    if (typeof type === 'string') {
      // 如果 vnode 的类型是 字符串则说明要渲染 的是普通标签
      if (!n1) {
        // 如果没有老节点则表示需要挂载元素
        mountElement(n2, container, anchor)
      } else {
        // 新旧虚拟节点打补丁
        patchElement(n1, n2)
      }
    } else if (type === Text) {
      // 如果 new vnode 的类型是文本节点
      if (!n1) {
        // 如果没有老节点
        // 创建新的文本节点挂载到容器上面
        const el = n2.el = createText(n2.children)
        insert(el, container)
      } else {
        // 如果有 vnode
        // 则把老的节点更新成新的即可
        const el = n2.el = n1.el  // 复用 DOM 元素
        if (n1.children !== n2.children) {
          setText(el, n2.children)
        }
      }
    } else if (type === Fragment) {
      if (!n1) {
        // 如果不存在 老虚拟节点， 则需要挂载新节点
        n2.children.forEach(c => patch(null, c, container))
      } else {
        // 如果有老节点，则需要更新 Fragment 的 children 即可
        patchChildren(n1, n2, container)
      }
    } else if (typeof type === 'object') {
      // 如果 vnode 的类型是 对象则说明要渲染 组件
      if (!n1) {
        // 没有老节点，则说明是挂载
        mountComponent(n2, container, anchor)
      } else {
        // 否则，说明是组件更新
        patchComponent()
      }
    }
  }

  function render(vnode, container) {
    // 如果有新的 vnode
    if (vnode) {
      // 把挂载到 DOM 节点上的 vnode 当做老的 vnode 传递给 patch 函数
      patch(container._vnode, vnode, container)
    } else {
      // 如果没有新的 vnode
      // 如果有老的 vnode
      if (container._vnode) {
        // 调用卸载函数，移除真实 DOM
        unmount(container._vnode)
      }
    }
    // 每次挂载或者更新完成之后就把老的 vnode 保存在容器身上
    container._vnode = vnode
  }

  return {
    render
  }
}

/**
 *
 * @param {*} el DOM 元素
 * @param {*} key props key 属性名
 * @param {*} value props 属性值
 * @returns
 */
function shouldSetAsProps(el, key, value) {
  // 特殊处理
  if (key === 'form' && el.tagName === 'INPUT') return false
  return key in el
}

// DOM 操作 API
const domApi = {
  // 创建元素
  createElement(tag) {
    return document.createElement(tag)
  },
  // 设置元素的文本节点
  setElementText(el, text) {
    el.textContent = text
  },
  // 在给定的 parent 下面添加指定的元素
  /**
   *
   * @param {*} el 要添加的元素
   * @param {*} parent 父节点
   * @param {*} anchor 参照的节点
   */
  insert(el, parent, anchor = null) {
    parent.insertBefore(el, anchor)
  },
  /**
   *
   * @param {*} el 真实DOM
   * @param {*} key 属性名
   * @param {*} prevVal 上一次的值
   * @param {*} nextVal 当前值
   */
  patchProps(el, key, prevVal, nextVal) {
    //判断 props 中的参数如果是 on 开头的
    if (/^on/.test(key)) {
      // 在 el 上面存储一个对象用来保存事件处理函数
      const invokers = el._vei || (el._vei = {})
      // 获取对应事件名
      const eventName = key.slice(2).toLowerCase()
      // 获取之前的事件处理函数
      let invoker = invokers[key]
      // props 中有新的事件处理函数
      if (nextVal) {
        // 如果缓存中没有老的事件处理函数，就需要创建新的
        if (!invoker) {
          // 创建一个事件处理函数
          invoker = el._vei[key] = (e) => {
            // 如果事件执行的实现小于绑定的时间，则不执行事件处理函数
            // 因为默认情况下的逻辑是  事件函数触发的时间应该大于事件绑定的时间  先帮事件 后才能执行嘛
            if (e.timeStamp < invoker.attached) return
            // 将真正的事件函数挂载到 invoker.value 上面，在触发事件的时候再去调用，
            if (Array.isArray(invoker.value)) {
              // 如果是数组则 依次遍历进行调用
              invoker.value.forEach(fn => fn(e))
            } else {
              invoker.value(e)
            }
          }
          invoker.value = nextVal
          // 添加 attached 属性 存储事件函数被绑定时候的时间
          invoker.attached = performance.now()
          el.addEventListener(eventName, invoker)
        } else {
          // 有新的事件处理函数，就更新原来的值
          invoker.value = nextVal
        }
      }
      // 没有新的事件处理函数，但是可以获取到老的事件处理函数，则说明是要移除老的事件
      else if (invoker) {
        el.removeEventListener(eventName, invoker)
      }
    }
    // 区分是 DOM Properties 还是 HTML Attributes
    else if (key === 'class') {
      el.className = nextVal || ''
    } else if (shouldSetAsProps(el, key, nextVal)) {
      const type = typeof el[key]
      // 如果在 DOM 树形上的类型是 布尔值 并且当前拿到的 vnode 的值的 空字符串，那么久把值转成 true
      if (type === 'boolean' && nextVal === '') {
        el[key] = true
      } else {
        // 否则就用 vnode 里面的值
        el[key] = nextVal
      }
    } else {
      el.setAttribute(key, nextVal)
    }
  },
  // 创建文本节点
  createText(text) {
    return document.createTextNode(text)
  },
  // 设置文本节点的内容
  setText(el, text) {
    el.nodeValue = text
  }
}


export const renderer = createRenderer(domApi)
