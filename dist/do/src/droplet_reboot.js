module.exports=function(t){var e={};function n(o){if(e[o])return e[o].exports;var r=e[o]={i:o,l:!1,exports:{}};return t[o].call(r.exports,r,r.exports,n),r.l=!0,r.exports}return n.m=t,n.c=e,n.d=function(t,e,o){n.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:o})},n.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},n.t=function(t,e){if(1&e&&(t=n(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var o=Object.create(null);if(n.r(o),Object.defineProperty(o,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var r in t)n.d(o,r,function(e){return t[e]}.bind(null,r));return o},n.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return n.d(e,"a",e),e},n.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},n.p="",n(n.s=0)}([function(t,e,n){"use strict";async function o(t,e,o={}){const{digitaloceanApiKey:r}=o,{id:a}=t,i=[],s=JSON.stringify({type:"reboot"}),u={"Content-Type":"application/json","Content-Length":s.length,Authorization:`Bearer ${r}`};try{const{action:t}=JSON.parse(await((t,e,o)=>new Promise((r,a)=>{const i=n(1).request(t,{headers:e,method:"POST"},t=>{(t.statusCode<200||t.statusCode>299)&&a(new Error("Failed to load page, status code: "+t.statusCode));const e=[];t.on("data",t=>e.push(t)),t.on("end",()=>r(e.join("")))});i.write(o),i.on("error",t=>a(t)),i.end()}))("https://api.digitalocean.com/v2"+`/droplets/${a}/actions`,u,s));i.push({type:"section",text:{type:"mrkdwn",text:`Reboot initiated for ${a}. Started at: ${new Date(t.started_at).toUTCString()}\n Reboot status: ${t.status}`}})}catch(t){i.push({type:"section",text:{type:"mrkdwn",text:`*ERROR:* ${t.message}`}})}return{response_type:"in_channel",blocks:i}}t.exports=async({__secrets:t={},commandText:e,...n})=>({body:await o(n,0,t)})},function(t,e){t.exports=require("https")}]);