// Lightweight DOM/speech harness; no browser or third-party dependencies.
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');
const sourceRoot = path.resolve(__dirname, '../src');
const legacyRoot = path.resolve(__dirname, '../dist');
const root = fs.existsSync(path.join(sourceRoot, 'index.html'))
  ? sourceRoot
  : legacyRoot;
function createGame(directory = root, legacy = false, location = {hostname:'example.test',search:''}) {
  const html = fs.readFileSync(path.join(directory, 'index.html'), 'utf8');
  const nodes = {}, storage = new Map(), spoken = [], listeners = {};
  const noop = () => {};
  const context = new Proxy({measureText: s => ({width:s.length*6})}, {get:(o,k)=>o[k]||noop});
  function node() {
    const item = {style:{},parentElement:{classList:{toggle:noop}},classList:{add:noop,remove:noop,toggle:noop},
      getContext:()=>context,getBoundingClientRect:()=>({width:375,height:300}),clientWidth:375,clientHeight:300,
      add:noop,addEventListener:noop,setAttribute:noop,getAttribute:()=>'',removeAttribute:noop,
      querySelector:()=>({}),value:'',disabled:false};
    Object.defineProperty(item,'innerHTML',{get:()=>item.markup||'',set:text=>{
      item.markup=text;for(const [,id] of text.matchAll(/id="([^"]+)"/g))nodes[id]??=node();
    }});
    return item;
  }
  for(const [,id] of html.matchAll(/id="([^"]+)"/g))nodes[id]=node();
  const box={console,document:{getElementById:id=>{assert(nodes[id],`Missing element ${id}`);return nodes[id]},createElement:node,
    querySelector:()=>node(),querySelectorAll:()=>[],addEventListener:(k,f)=>listeners[k]=f,body:node(),hidden:false},
    localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
    speechSynthesis:{getVoices:()=>[{name:'Harri',lang:'fi-FI'},{name:'Satu',lang:'fi-FI'}],speak:u=>spoken.push(u),cancel:noop},
    SpeechSynthesisUtterance:function(text){this.text=text},
    rowingAudio:{stop:noop,stopCrowd:noop,cheerStart:noop,unlock:noop,startMenuMusic:noop,stopMenuMusic:noop,starterShot:noop,catchOar:noop,release:noop,isEnabled:()=>true},Image:function(){},Option:function(){},
    performance:{now:()=>1000},devicePixelRatio:2,addEventListener:(k,f)=>listeners[k]=f,requestAnimationFrame:noop,navigator:{},location,confirm:()=>true};
  vm.createContext(box);
  const scripts=legacy?['chatter.js','game.js']:[...html.matchAll(/<script src="([^"]+)"/g)].map(m=>m[1]);
  for(const src of scripts){const source=fs.readFileSync(path.join(directory,src),'utf8');new vm.Script(source,{filename:src});if(src.endsWith('effects.js'))continue;vm.runInContext(source,box,{filename:src});}
  return {box,nodes,storage,spoken,listeners,run:s=>vm.runInContext(s,box)};
}
module.exports={createGame,root};
