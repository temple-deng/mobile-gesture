const btn = document.getElementById('btn');

btn.addEventListener('click', (evt) => {
  const el = document.getElementById('canvas');
  el.addEventListener('touchstart', handleStart);
  el.addEventListener('touchend', handleEnd);
  el.addEventListener('touchcancel', handleCancel);
  el.addEventListener('touchmove', handleMove);
});

const ongoingTouches = [];

function handleStart(evt) {
  evt.preventDefault();

  console.log('touchstart.');

  const el = document.getElementById('canvas');
  const ctx = el.getContext('2d');
  const touches = evt.changedTouches;

  for (let i = 0; i < touches.length; i++) {
    console.log(`touchstart: ${i}....`);
    ongoingTouches.push(copyTouch(touches[i]));
    let color = colorForTouch(touches[i]);
    ctx.beginPath();
    ctx.arc(touches[i].pageX, touches.pageY, 4, 0, 2 * Math.PI, false);
    ctx.fillStyle = color;
    ctx.fill();
    console.log(`touchstart: ${i}.`);
  }
}

function handleMove(evt) {
  evt.preventDefault();

  const el = document.getElementById('canvas');
  const ctx = el.getContext('2d');
  const touches = evt.changedTouches;

  for (let i = 0; i < touches.length; i++) {
    const color = colorForTouch(touches[i]);
    const idx = ongoingTouchIndexById(touches[i].identifier);

    if (idx >= 0) {
      console.log('continuing touch ', idx);
      ctx.beginPath();

      // 先将点移到起点处
      console.log('ctx.moveTo(' + ongoingTouches[idx].pageX + ', ' + ongoingTouches[idx].pageY + ');');

      ctx.moveTo(ongoingTouches[idx].pageX, ongoingTouches[idx].pageY);

      // 然后划线到移动处
      console.log('ctx.lineTo(' + touches[i].pageX + ', ' + touches[i].pageY + ')');
      ctx.lineTo(touches[i].pageX, touches[i].pageY);
      ctx.lineWidth = 4;
      ctx.strokeStyle = color;
      ctx.stroke();
      ctx.closePath();

      ongoingTouches.splice(idx, 1, copyTouch(touches[i]));
      console.log('.');
    } else {
      console.log('can"t figure out which touch to continue')
    }
  }
}

function handleEnd(evt) {
  evt.preventDefault();

  log('touchend');

  const el = document.getElementById('canvas');
  const ctx = el.getContext('2d');
  const touches = evt.changedTouches;

  for (let i = 0; i < touches.length; i++) {
    const color = colorForTouch(touches[i]);

    const idx = ongoingTouchIndexById(touches[i].identifier);

    if (idx >= 0) {
      ctx.lineWidth = 4;
      ctx.fillStyle = color;

      ctx.beginPath();
      ctx.moveTo(ongoingTouches[idx].pageX, ongoingTouches[idx].pageY);
    }
  }

}