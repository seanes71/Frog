import test from 'node:test';
import assert from 'node:assert/strict';
import {cardLayout} from '../dist/card-layout.js';
test('all matching stages preserve playing-card ratio and fit small portrait and landscape boards',()=>{
 for(const [width,height] of [[272,348],[342,620],[650,178],[680,640]])for(const count of [12,18,24,30,36,42,48,52]){
  const cols=width>height?(count<=18?6:count<=36?8:10):width<300?(count<=24?4:6):count<=12?4:6,rows=Math.ceil(count/cols),s=cardLayout(width,height,cols,rows);
  assert.ok(Math.abs(s.width/s.height-5/7)<1e-9);
  assert.ok(s.width*cols+5*(cols-1)+12<=width);
  assert.ok(s.height*rows+5*(rows-1)+12<=height);
  assert.ok(s.icon>=12&&s.icon<=42);
 }
});
test('regular phone cards show moderately larger characters without oversized desktop symbols',()=>{
 const phone=cardLayout(342,620,4,3);assert.ok(phone.icon>=32&&phone.icon<=42);
 const desktop=cardLayout(680,640,6,2);assert.equal(desktop.width,100);assert.equal(desktop.icon,42);
});
