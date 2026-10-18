const test=require("node:test");
const assert=require("node:assert/strict");
const vm=require("node:vm");
const fs=require("node:fs");
const path=require("node:path");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");

function comboHarness(){
  const window={};
  const context=vm.createContext({window,Math,Number,Set});
  vm.runInContext(read("js/elemental-synergy.js"),context);
  return window;
}
function upgradesHarness(){
  const window={},rendered=[];
  const context=vm.createContext({
    window, Math, document:{createElement:()=>({disabled:false})},
    notify:()=>{},unlockAchievement:()=>{},trackDiscovery:()=>{},playSfx:()=>{}
  });
  vm.runInContext(