# 手势和滚动

## AlloyFinger

浏览器暴露了四个事件给开发者，touchstart, touchmove, touchend, touchcancel，在这
四个事件的回调函数中可以拿到 TouchEvent。    

+ touches: 当前位于屏幕上的所有手指动作的列表
+ targetTouches: 位于当前 DOM 元素上的手指动作的列表
+ changedTouches: 涉及当前事件的手指动作的列表

### 补充 MDN 上关于 TouchEvent 的介绍

+ `touchstart`: 当一个或多个触摸点放到触摸平面上时触发
  - `touches` TouchList: 当前触摸了平面的每个点 Touch 组成的列表
  - `targetTouches` TouchList: 在当前元素上的开始触摸的那些点
  - `changedTouches` TouchesList: 应该是只包含每次触发事件时新增的那些点吧
+ `touchmove`: 当一个或多个点在平面上移动时触发
  - `touches`: 当前触摸着平面的所有点
  - `targetTouches`: 同 touchstart，在当前元素上开始触摸的那些点
  - `changedTouches`: 移动了的那些触摸点
+ `touchend`: 当一个或多个点在平面上移除时触发
  - `touches`: 当前还在平面上的点
  - `targetTouches`: 同 `touchstart`
  - `changedTouches`: 移除的那些触摸点，注意这些点必须和 touchstart 中的一致
+ `touchcancel`: 当一个触摸点在某些情况下被破坏时触发，可能有这些原因
  - 某些事件发生，并取消这次触摸，比如说弹出了一个模态框
  - 触摸点离开了 window 移动到了浏览器的 UI 区域
  - 参数上基本上同 touchend

TouchList 是一个对象，通过 `item(index)` 方法来访问其中的元素，有一个 `length` 属性。   

`Touch.radiusX`, `Touch.radiusY`, `Touch.rotationAngle` 描述了用户和屏幕间的接触区域。

事件对象的属性：   

- `identifier`: Touch 对象的 ID，一个触摸点在移动过程中会保持 ID 不变
- `screenX`: 触摸点相对于屏幕左边缘的 X 坐标
- `screenY`: 触摸点相对于屏幕上边缘的 Y 坐标
- `clientX`: 触摸点相对于浏览器视口左边缘的 X 坐标
- `clientY`: 触摸点相对于浏览器视口上边缘的 Y 坐标
- `pageX`: 触摸点相对于文档左边缘的 X 坐标
- `pageY`: 触摸点相对于文档上边缘的 Y 坐标
- `target`: 触摸点第一次放置到屏幕上时所处的元素