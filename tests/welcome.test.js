import test from 'node:test';
import assert from 'node:assert/strict';
import {freshProfile,loadProfile,claimWelcomeBonus} from '../dist/engine.js';
test('welcome bonus brings a new player to 50 and cannot repeat after save or reload',()=>{const p=freshProfile();assert.equal(claimWelcomeBonus(p),30);assert.equal(p.bank,50);assert.equal(claimWelcomeBonus(p),0);const reloaded=loadProfile(JSON.stringify(p));assert.equal(claimWelcomeBonus(reloaded),0);assert.equal(reloaded.bank,50);});
test('existing players retain their progress and receive the welcome gift only once',()=>{const p=loadProfile(JSON.stringify({...freshProfile(),bank:147,wins:8,owned:['green','blue']}));assert.equal(claimWelcomeBonus(p),30);assert.equal(p.bank,177);assert.equal(p.wins,8);assert.ok(p.owned.includes('blue'));assert.equal(claimWelcomeBonus(loadProfile(JSON.stringify(p))),0);});
