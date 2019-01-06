# 手势和滚动

<!-- TOC -->

- [手势和滚动](#手势和滚动)
  - [一步步打造一个移动端手势库](#一步步打造一个移动端手势库)
    - [基本的代码结构](#基本的代码结构)
    - [构造函数的实现](#构造函数的实现)
    - [单手指事件和手势](#单手指事件和手势)
    - [多手指手势](#多手指手势)
  - [补充 MDN 上关于 TouchEvent 的介绍](#补充-mdn-上关于-touchevent-的介绍)

<!-- /TOC -->

## 一步步打造一个移动端手势库

> 摘自 https://juejin.im/post/5a795e6d6fb9a0635630fe2b

### 基本的代码结构

```js
;(function(){
	function Gesture(target){
		//初始化代码
	}
    Gesture.prototype = {
        //实现各种手势的代码
    }
	Gesture.prototype.constructor = Gesture;
	if (typeof module !== 'undefined' && typeof exports === 'object') {
	    module.exports = Gesture;
	 } else if (typeof define === 'function' && define.amd) {
	    define(function() { return Gesture; });
	 } else {
	    window.GT = Gesture;
	 }
})()
```   

### 构造函数的实现

构造函数需要处理的事情包括：获取目标元素，初始化配置和其他需要使用到的参数，以及基本事件
的绑定。    

```js
function Gesture(target) {
  this.target = target instanceof HTMLElement ? target :
    typeof target === 'string' ? document.querySelector(target) : null;

  if (!this.target) {
    return;
  }

  this.target.addEventListener('touchstart', this._touch.bind(this), false);
  this.target.addEventListener('touchmove', this._move.bind(this), false);
  this.target.addEventListener('touchend', this._end.bind(this), false);
  this.target.addEventListener('touchcancel', this._cancel.bind(this), false);
}
```   

### 单手指事件和手势

单手指事件和手势包括：`tap`, `dbtap`, `longtap`, `slide/move/drag` 和 `swipe`。   

当手指开始触摸时，触发原生的 `touchstart` 事件，获取手指相关的参数，基于需求，此时应该
执行原生的 `touchstart` 回调，这是第一步；接着应该发生以下几种情况：   

1. 手指没有离开并移动，持续一段时间后，触发 `longtap` 事件
2. 手指没有离开并且做不定时的移动操作，此时应该先触发原生的 `touchmove` 事件的回调，接着
触发自定义的滑动事件（这里命名为 `slide`），于此同时，应该取消 `longtap` 事件的触发
3. 手指离开了屏幕，开始应该触发原生的 `touchend` 事件回调，同时取消 `longtap` 事件触发，
在一定时间内离开后手指的距离变化在一定范围外，则触发 `swipe` 手势的回调，否则，如果手指
没有再次放下，则触发 `tap` 事件，若手指再次放下并抬起，则应该触发 `dbtap` 事件，同时取消
`tap` 事件的触发。   

首先往构造函数添加以下参数：  

```js
this.touch = {}; // 记录刚触摸的手指
this.moveTouch = {};   // 记录移动过程中变化的手指参数
this.preTouch = {};    // 记录上一次触摸的对象
this.longTapTimer = null;   // longtap 的定时器
this.tapTimer = null;  // tap 的定时器
this.doubleTap = false;  // 用于记录是否执行双击的定时器
this.handles = {};
```   

然后是具体的方法：  

```js
_touch: function(e) {
  this.params.event = e;
  this.e = e.target;

  const point = e.touches ? e.touches[0] : e;
  const now = Date.now();

  // 记录手指位置等参数
  this.touch.startX = point.pageX;
  this.touch.startY = point.pageY;
  this.touch.startTime = now;

  // 由于有多次触摸的情况，tap 和 dbtap 针对单次触摸，故先清空定时器
  clearTimeout(this.longTapTimer);
  clearTimeout(this.tapTimer);
  this.doubleTap = false;

  this._emit('touch');   // 执行原生的 touchstart 回调
  
  if (e.touches.length > 1) {

  } else {
    var self = this;
    this.longTapTimer = setTimeout(function() {
      self._emit('longtap');
      self.doubleTap = false;
      e.preventDefault();
    }, 800);

    this.doubleTap = this.preTouch.time && now - this.preTouch.time < 300 &&
      Math.abs(this.touch.startX - this.preTouch.startX) < 30 &&
      Math.abs(this.touch.startY - this.preTouch.startY) < 30 &&
      Math.abs(this.touch.startTime - this.preTouch.time) < 300;
    
      // 更新上一次触摸的信息为当前，供下一次触摸使用
      this.preTouch = {
        startX: this.touch.startX,
        startY: this.touch.startY,
        time: this.touch.startTime
      };
  }
},
_move: function(e) {
  const point = e.touches ? e.touches[0] : e;
  this._emit('move');

  if (e.touches.length > 1) {

  } else {
    let diffX = point.pageX - this.touch.startX;
    let diffY = point.pageY - this.touch.startY;
    this.params.diffX = diffX;
    this.params.diffY = diffY;

    if (this.moveTouch.x) {
      this.params.deltaX = point.pageX - this.moveTouch.x;
      this.params.deltaY = point.pageY - this.moveTouch.y;
    } else {
      this.params.deltaX = this.params.deltaY = 0;
    }

    // 当手指滑动距离超过了 30，所有单值非滑动事件取消
    if (Math.abs(diffX) > 30 || Math.abs(diffY) > 30) {
      clearTimeout(this.longTapTimer);
      clearTimeout(this.tapTimer);
      this.doubleTap = false;
    }

    this._emit('slide');

    // 更新移动中的手指参数
    this.moveTouch.x = point.pageX;
    this.moveTouch.y = point.pageY;
  }
},
_end: function(e) {
  clearTimeout(this.longTapTimer);

  let timeStamp = Date.now();

  let deltaX = ~~((this.moveTouch.x || 0) - this.touch.startX);
  let deltaY = ~~((this.moveTouch.y || 0) - this.touch.startY);

  if (this.moveTouch.x && Math.abs(deltaX) > 30 ||
    this.moveTouch.y !== null && Math.abs(deltaY) > 30) {
      // swipe 手势
      if (Math.abs(deltaX) < Math.abs(deltaY)) {
        if (deltaY < 0) {
          // 上划
          this._emit('swipeUp');
          this.params.direction = 'up';
        } else {
          // 下划
          this._emit('swipeDown');
          this.params.direction = 'down';
        }
      } else {
        if (deltaX < 0) {
          this._emit('swipeLeft');
          this.params.direction = 'left';
        } else {
          this._emit('swipeRight');
          this.params.direction = 'right';
        }
      }

      this._emit('swipe');
    } else {
      let self = this;

      if (!this.doubleTap && timeStamp - this.touch.startTime < 300) {
        // 单次点击 300ms 内离开，触发点击事件
        this.tapTimer = setTimeout(function() {
          self._emit('tap');
          self._emit('finish');
        }, 300);
      } else if (this.doubleTap) {
        this._emit('dbtap');
        clearTimeout(this.tapTimer);
        this._emit('finish');
      } else {
        this._emit('finish');
      }
    }
    this._emit('end');
},
_emit: function(type) {
  !this.handles[type] && (this.handles[type] = []);

  for (let i = 0, len = this.handles[type].length; i < len; i++) {
    typeof this.handles[type][i] === 'function' &&
      this.handles[type][i](this.params);
  }
  return true;
},
on: function(type, callback) {
  !this.handles[type] && (this.handles[type] = []);
  this.handles[type].push(callback);
  return this;
}
```  

### 多手指手势

常见的多手指手势为缩放手势 `pinch` 和选择手势 `rotate`。   

下面是对数学知识的介绍。   

> 下面的内容摘自：https://juejin.im/post/5c2ecd2ee51d45517334489e

**向量的数量积**   

向量同样也具有可以运算的属性，它可以进行加、减、乘、数量积和向量积等运算，接下来就介绍下
我们使用到的数量积这个概念，也称为点积，被定义为公式：   

> 当 a = (x1, y1), b = (x2, y2), 则 a · b = |a|·|b|·cosθ = x1 · x2 + y1 · y2   

**共线定理**   

共线，即两个向量处于平行的状态，但 a = (x1, y1), b = (x2, y2)，则存在唯一的一个实数λ，
使得 a = λb，带入坐标点后，可以得到 x1 · y2 = y1 · x2;   

因此当 x1 · y2 - x2 · y1 &gt; 0 时，即斜率 ka &gt; kb，所以此时 b 向量相对于 a 向量
是属于顺时针旋转，反之，则为逆时针。   

这个其实是这样的，很明显如果两个向量平行，则 x1/y1 = x2/y2，x1/y1 就是 cosθ，就是斜率
嘛，所以上面的东西也就很明显了。   

**旋转角度**    

通过数量积公式我们可以推导求出两个向量的夹角：   

cosθ = (x1 * x2 + y1 * y2)/(|a|*|b|)    

然后通过共线定理我们可以判断出旋转的方向，函数定义为：   

```js
/* 
 * 首先需要明确这里 v1, v2 是什么
 * v1 应该是旋转前两手指构成的一个向量
 * 假设一个手指为 point1, 另一个为 point2
 * 那 v1 = {
 *    x: point2.pageX - point1.pageX,
 *    y: point2.pageY - point1.pageY
 * };
 * v2 同理，是旋转后两个手指构成的向量
*/
getAngle(v1, v2) {
  // 判断方向，顺时针为 1，逆时针为 -1
  let direction = v1.x * v2.y - v2.x * v1.y > 0 ? 1 : -1;

  let len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  let len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
  let mr = len1 * len2;
  let dot, r;

  // 这是什么情况
  // 一个手指不动，另一个划向另一个手指？
  // 那也应该有点距离吧，感觉这种请求出现的几率很小
  if (mr === 0) {
    return 0;
  }

  // 通过数量积公式可以推导出
  // cos = (x1 * x2 + y1 * y2) / mr
  dot = v1.x * v2.x + v1.y * v2.y;
  r = dot / mr;

  // 下面这些应该是只选择 90 度的倍数
  if (r > 1) {
    r = 1;
  }
  if (r < -1) {
    r = -1;
  }

  return Math.acos(r) * direction * 180 / Math.PI;
}
```    

**矩阵与变换**    

由于空间最本质的特征就是其可以容纳运动，因此在线性空间中，我们用向量来刻画对象，而矩阵便是
用来描述对象的运动。   

我们知道，通过一个坐标系基向量便可以确定一个向量，例如 `a = (-1, 2)`，我们通常约定的基
向量是 `i = (1, 0)` 与 `j = (0, 1)`，因此：   

`a = -1i + 2j = -1 * (1,0) + 2 * (0,1) = (-1+0, 0+2) = (-1, 2)`   

而矩阵变换的，其实便是通过矩阵转换了基向量，从而完成了向量的变换（那就是向量对象的运动吧）。   

例如上面的例子，把 a 向量通过矩阵 (1, -2, 3, 0) 进行变换，此时基向量 i 由 (1,0) 变换成了
(-1, 2) 与 j 由 (0,1) 变换成了 (3,0)，沿用上面的推导，则   

`a = -1i + 2j = -1(1, -2) + 2(3, 0) = (5,2)`   

如下图所示：A 图表示变换之前的坐标系，此时 a = (-1, 2)，通过矩阵变换后，基向量 i,j 的变换
引起了坐标系的变换，变成了下图 B，因此 a 向量由 (-1, 2) 变换成了 (5, 2)：   

![matrix](https://raw.githubusercontent.com/temple-deng/markdown-images/master/program/matrix.png)    


## 补充 MDN 上关于 TouchEvent 的介绍

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

