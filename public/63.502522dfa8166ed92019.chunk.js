"use strict";(this.webpackChunktweb=this.webpackChunktweb||[]).push([[63,709,810,641,776],{9638:(e,t,n)=>{n.d(t,{Z:()=>g});var a=n(3910),i=n(2738),r=n(4541),o=n(2325),s=n(3512),d=n(4494),c=n(279);let l,u=!1;function g(e){u||(l||(l=s.Z.managers.apiManager.getConfig().then((e=>e.suggested_lang_code!==o.ZP.lastRequestedLangCode?Promise.all([e,o.ZP.getStrings(e.suggested_lang_code,["Login.ContinueOnLanguage"]),o.ZP.getCacheLangPack()]):[])))).then((([t,n])=>{if(!t)return;const l=[];n.forEach((e=>{const t=o.ZP.strings.get(e.key);t&&(l.push(t),o.ZP.strings.set(e.key,e))}));const g="Login.ContinueOnLanguage",p=(0,d.Z)("btn-primary btn-secondary btn-primary-transparent primary",{text:g});p.lastElementChild.classList.remove("i18n"),(0,r.Z)({text:[o.ZP.format(g,!0)]}).then((()=>{window.requestAnimationFrame((()=>{e.append(p)}))})),s.Z.addEventListener("language_change",(()=>{p.remove()}),{once:!0}),l.forEach((e=>{o.ZP.strings.set(e.key,e)})),(0,i.fc)(p,(e=>{(0,a.Z)(e),u=!0,p.disabled=!0,(0,c.y)(p),o.ZP.getLangPack(t.suggested_lang_code)}))}))}},810:(e,t,n)=>{n.r(t),n.d(t,{default:()=>x});var a=n(279),i=n(4874),r=n(9807),o=n(4494),s=n(5432),d=n(4159),c=n(2325),l=n(1447),u=n(1405),g=n(9709),p=n(9638),h=n(3910),m=n(2738),y=n(5565),v=n(1656),f=n(7487),Z=n(2398),L=n(7922),_=n(3512),w=n(709),b=n(3855),k=n(5431);let S,E=null;const P=new i.Z("page-sign",!0,(()=>{const e=document.createElement("div");let t,i;e.classList.add("input-wrapper");const u=new k.Z({onCountryChange:(e,n)=>{t=e,i=n,n&&(x.value=x.lastValue="+"+n.country_code,setTimeout((()=>{C.focus(),(0,Z.Z)(C,!0)}),0))}}),x=new w.Z({onInput:e=>{l.Z.loadLottieWorkers();const{country:n,code:a}=e||{},r=n?n.name||n.default_name:"";r===u.value||t&&n&&a&&(t===n||i.country_code===a.country_code)||u.override(n,a,r),n||x.value.length-1>1?E.style.visibility="":E.style.visibility="hidden"}}),C=x.input;C.addEventListener("keypress",(e=>{if(!E.style.visibility&&"Enter"===e.key)return R()}));const T=new r.Z({text:"Login.KeepSigned",name:"keepSession",withRipple:!0,checked:!0});T.input.addEventListener("change",(()=>{const e=T.checked;_.Z.managers.appStateManager.pushToState("keepSigned",e),b.Z.toggleStorages(e,!0)})),b.Z.getState().then((e=>{L.Z.isAvailable()?T.checked=e.keepSigned:(T.checked=!1,T.label.classList.add("checkbox-disabled"))})),E=(0,o.Z)("btn-primary btn-color-primary",{text:"Login.Next"}),E.style.visibility="hidden";const R=e=>{e&&(0,h.Z)(e);const t=(0,v.Z)([E,S],!0);(0,y.Z)(E,(0,c.ag)("PleaseWait")),(0,a.y)(E);const i=x.value;_.Z.managers.apiManager.invokeApi("auth.sendCode",{phone_number:i,api_id:d.Z.id,api_hash:d.Z.hash,settings:{_:"codeSettings"}}).then((e=>{n.e(392).then(n.bind(n,6392)).then((t=>t.default.mount(Object.assign(e,{phone_number:i}))))})).catch((e=>{t(),"PHONE_NUMBER_INVALID"===e.type?(x.setError(),(0,y.Z)(x.label,(0,c.ag)("Login.PhoneLabelInvalid")),C.classList.add("error"),(0,y.Z)(E,(0,c.ag)("Login.Next"))):(console.error("auth.sendCode error:",e),E.innerText=e.type)}))};(0,m.fc)(E,R),S=(0,o.Z)("btn-primary btn-secondary btn-primary-transparent primary",{text:"Login.QR.Login"}),S.addEventListener("click",(()=>{g.default.mount()})),e.append(u.container,x.container,T.label,E,S);const A=document.createElement("h4");A.classList.add("text-center"),(0,c.$d)(A,"Login.Title");const M=document.createElement("div");M.classList.add("subtitle","text-center"),(0,c.$d)(M,"Login.StartText"),P.pageEl.querySelector(".container").append(A,M,e),s.Z||setTimeout((()=>{C.focus()}),0),(0,p.Z)(e),_.Z.managers.apiManager.invokeApi("help.getNearestDc").then((e=>{var t;const n=L.Z.getFromCache("langPack");n&&!(null===(t=n.countries)||void 0===t?void 0:t.hash)&&c.ZP.getLangPack(n.lang_code).then((()=>{x.simulateInputEvent()}));const a=new Set([1,2,3,4,5]),i=[e.this_dc];let r;return e.nearest_dc!==e.this_dc&&(r=_.Z.managers.apiManager.getNetworkerVoid(e.nearest_dc).then((()=>{i.push(e.nearest_dc)}))),(r||Promise.resolve()).then((()=>{i.forEach((e=>{a.delete(e)}));const e=[...a],t=()=>{return n=void 0,a=void 0,r=function*(){const n=e.shift();if(!n)return;const a=`dc${n}_auth_key`;if(yield f.Z.get(a))return t();setTimeout((()=>{_.Z.managers.apiManager.getNetworkerVoid(n).finally(t)}),3e3)},new((i=void 0)||(i=Promise))((function(e,t){function o(e){try{d(r.next(e))}catch(e){t(e)}}function s(e){try{d(r.throw(e))}catch(e){t(e)}}function d(t){var n;t.done?e(t.value):(n=t.value,n instanceof i?n:new i((function(e){e(n)}))).then(o,s)}d((r=r.apply(n,a||[])).next())}));var n,a,i,r};t()})),e})).then((e=>{u.value.length||x.value.length||u.selectCountryByIso2(e.country)}))}),(()=>{E&&((0,y.Z)(E,(0,c.ag)("Login.Next")),(0,u.Z)(E,void 0,void 0,!0),E.removeAttribute("disabled")),S&&S.removeAttribute("disabled"),_.Z.managers.appStateManager.pushToState("authState",{_:"authStateSignIn"})})),x=P},9709:(e,t,n)=>{n.r(t),n.d(t,{default:()=>y});var a=n(4874),i=n(4159),r=n(4494),o=n(2325),s=n(3512),d=n(279),c=n(9638),l=n(5418),u=n(9895);function g(e){return e<26?e+65:e<52?e+71:e<62?e-4:62===e?43:63===e?47:65}var p=function(e,t,n,a){return new(n||(n=Promise))((function(i,r){function o(e){try{d(a.next(e))}catch(e){r(e)}}function s(e){try{d(a.throw(e))}catch(e){r(e)}}function d(e){var t;e.done?i(e.value):(t=e.value,t instanceof n?t:new n((function(e){e(t)}))).then(o,s)}d((a=a.apply(e,t||[])).next())}))};let h;const m=new a.Z("page-signQR",!0,(()=>h),(()=>{h||(h=p(void 0,void 0,void 0,(function*(){const e=m.pageEl.querySelector(".auth-image");let t=(0,d.y)(e,!0);const a=document.createElement("div");a.classList.add("input-wrapper");const y=(0,r.Z)("btn-primary btn-secondary btn-primary-transparent primary",{text:"Login.QR.Cancel"});a.append(y),(0,c.Z)(a);const v=e.parentElement,f=document.createElement("h4");(0,o.$d)(f,"Login.QR.Title");const Z=document.createElement("ol");Z.classList.add("qr-description"),["Login.QR.Help1","Login.QR.Help2","Login.QR.Help3"].forEach((e=>{const t=document.createElement("li");t.append((0,o.ag)(e)),Z.append(t)})),v.append(f,Z,a),y.addEventListener("click",(()=>{n.e(810).then(n.bind(n,810)).then((e=>e.default.mount())),_=!0}));const L=(yield Promise.all([n.e(630).then(n.t.bind(n,1915,23))]))[0].default;let _=!1;s.Z.addEventListener("user_auth",(()=>{_=!0,h=null}),{once:!0});const w={ignoreErrors:!0};let b;const k=a=>p(void 0,void 0,void 0,(function*(){try{let r=yield s.Z.managers.apiManager.invokeApi("auth.exportLoginToken",{api_id:i.Z.id,api_hash:i.Z.hash,except_ids:[]},{ignoreErrors:!0});if("auth.loginTokenMigrateTo"===r._&&(w.dcId||(w.dcId=r.dc_id,s.Z.managers.apiManager.setBaseDcId(r.dc_id)),r=yield s.Z.managers.apiManager.invokeApi("auth.importLoginToken",{token:r.token},w)),"auth.loginTokenSuccess"===r._){const e=r.authorization;return s.Z.managers.apiManager.setUser(e.user),n.e(781).then(n.bind(n,5436)).then((e=>e.default.mount())),!0}if(!b||!(0,u.Z)(b,r.token)){b=r.token;const n="tg://login?token="+function(e){let t,n="";for(let a=e.length,i=0,r=0;r<a;++r)t=r%3,i|=e[r]<<(16>>>t&24),2!==t&&a-r!=1||(n+=String.fromCharCode(g(i>>>18&63),g(i>>>12&63),g(i>>>6&63),g(63&i)),i=0);return n.replace(/A(?=A$|$)/g,"=")}(r.token).replace(/\+/g,"-").replace(/\//g,"_").replace(/\=+$/,""),a=window.getComputedStyle(document.documentElement),i=a.getPropertyValue("--surface-color").trim(),o=a.getPropertyValue("--primary-text-color").trim(),s=a.getPropertyValue("--primary-color").trim(),d=yield fetch("assets/img/logo_padded.svg").then((e=>e.text())).then((e=>{e=e.replace(/(fill:).+?(;)/,`$1${s}$2`);const t=new Blob([e],{type:"image/svg+xml;charset=utf-8"});return new Promise((e=>{const n=new FileReader;n.onload=t=>{e(t.target.result)},n.readAsDataURL(t)}))})),c=new L({width:240*window.devicePixelRatio,height:240*window.devicePixelRatio,data:n,image:d,dotsOptions:{color:o,type:"rounded"},cornersSquareOptions:{type:"extra-rounded"},imageOptions:{imageSize:1,margin:0},backgroundOptions:{color:i},qrOptions:{errorCorrectionLevel:"L"}});let u;c.append(e),e.lastChild.classList.add("qr-canvas"),u=c._drawingPromise?c._drawingPromise:Promise.race([(0,l.Z)(1e3),new Promise((e=>{c._canvas._image.addEventListener("load",(()=>{window.requestAnimationFrame((()=>e()))}),{once:!0})}))]),yield u.then((()=>{if(t){t.style.animation="hide-icon .4s forwards";const n=e.children[1];n.style.display="none",n.style.animation="grow-icon .4s forwards",setTimeout((()=>{n.style.display=""}),150),setTimeout((()=>{n.style.animation=""}),500),t=void 0}else Array.from(e.children).slice(0,-1).forEach((e=>{e.remove()}))}))}if(a){const e=Date.now()/1e3,t=r.expires-e-(yield s.Z.managers.timeManager.getServerTimeOffset());yield(0,l.Z)(t>3?3e3:1e3*t|0)}}catch(e){return"SESSION_PASSWORD_NEEDED"===e.type?(e.handled=!0,n.e(774).then(n.bind(n,9437)).then((e=>e.default.mount())),_=!0,h=null):(console.error("pageSignQR: default error:",e),_=!0),!0}return!1}));return()=>p(void 0,void 0,void 0,(function*(){for(_=!1;!_&&!(yield k(!0)););}))}))),h.then((e=>{e()})),s.Z.managers.appStateManager.pushToState("authState",{_:"authStateSignQr"})})),y=m}}]);
//# sourceMappingURL=63.502522dfa8166ed92019.chunk.js.map