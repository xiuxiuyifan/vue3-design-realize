
// weakmap 的使用

const map = new Map()
const weakmap = new WeakMap()

let a
  ; (function () {
    const foo = { foo: 1 }
    const bar = { bar: 2 }

    a = bar
    map.set(foo, 1)
    weakmap.set(bar, 2)
  })()

console.log(map)
console.log(weakmap)
