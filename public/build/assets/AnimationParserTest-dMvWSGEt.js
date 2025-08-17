import{_ as C}from"./AppLayout.vue_vue_type_script_setup_true_lang-CmafWrlK.js";import{_ as d}from"./Button.vue_vue_type_script_setup_true_lang-BgPnemTW.js";import{_}from"./Textarea.vue_vue_type_script_setup_true_lang-DTxhneIX.js";import{A as x}from"./AnimationParser-DYUHDxlX.js";import{u as I}from"./useToast-zrdN7exZ.js";import{d as y,r as p,c as v,o as f,a as t,b as i,w as c,e as m,u,f as b,n as g,g as z}from"./app-Dynu5tc5.js";import{_ as j}from"./_plugin-vue_export-helper-DlAUqK2U.js";import"./index-CUUO6Z42.js";import"./DropdownMenuLabel.vue_vue_type_script_setup_true_lang-BagbxIyi.js";import"./createLucideIcon-CZW-bvdG.js";import"./DropdownMenuTrigger.vue_vue_type_script_setup_true_lang-mndLukLN.js";import"./settings-C2RLwdqr.js";import"./x-BE0BvSeC.js";import"./AppLogoIcon.vue_vue_type_script_setup_true_lang-C9_ic-40.js";const P={class:"flex h-full bg-background"},$={class:"flex-1 flex flex-col border-r border-border"},E={class:"flex-1 p-4"},w={class:"mb-4 flex gap-2"},B={class:"relative"},V={key:0,class:"absolute bottom-2 right-2 text-xs text-destructive bg-destructive/10 px-2 py-1 rounded"},X={class:"flex-1 flex flex-col"},q={class:"flex-1 p-4"},D={class:"mb-4 flex gap-2"},R={class:"relative"},F={key:0,class:"absolute bottom-2 right-2 text-xs text-destructive bg-destructive/10 px-2 py-1 rounded"},G=`media: https://example.com/image.jpg
name: 测试分镜
description: 这是一个测试分镜
width: 1920
height: 1080
initialPosition:
  x: 100
  y: 200
  scaleX: 1
  scaleY: 1
  opacity: 1
  rotation: 0
animationSequences:
  - id: anim_1
    name: 淡入动画
    duration: 2000
    easing: easeInOut
    keyframes:
      - startTime: 0
        duration: 1000
        opacity: 0
        scaleX: 0.8
        scaleY: 0.8
      - startTime: 1000
        duration: 1000
        opacity: 1
        scaleX: 1
        scaleY: 1`,H=y({__name:"AnimationParserTester",setup(h){const{toast:a}=I(),o=p(""),r=p(""),l=p(!1),n=p(!1),J={media:"https://example.com/image.jpg",name:"测试分镜",description:"这是一个测试分镜",width:1920,height:1080,initialPosition:{pos:"100 200",scale:1,opacity:1,rotation:0},animationSequences:[{id:"anim_1",name:"淡入动画",duration:2e3,easing:"easeInOut",keyframes:[{startTime:0,duration:1e3,opacity:0,scale:"0.8 0.8"},{startTime:1e3,duration:1e3,opacity:1,scale:1}]}]},N=()=>{o.value=JSON.stringify(J,null,2),l.value=!1;try{a.success("已加载示例数据","示例 JSON 数据已加载到左侧编辑器中")}catch(s){console.error("Toast 错误:",s)}},S=()=>{r.value=G,n.value=!1;try{a.success("已加载示例 YAML","示例 YAML 脚本已加载到右侧编辑器中")}catch(s){console.error("Toast 错误:",s)}},O=()=>{try{const s=JSON.parse(o.value);o.value=JSON.stringify(s,null,2),l.value=!1,a.success("JSON 格式化成功","JSON 数据已格式化")}catch{l.value=!0,a.error("JSON 格式化失败","请检查 JSON 格式是否正确")}},Y=()=>{l.value&&(l.value=!1)},A=()=>{n.value&&(n.value=!1)},T=()=>{if(o.value.trim())try{const s=JSON.parse(o.value),e=x.parseJsonToYaml(s);e&&(r.value=e,n.value=!1,l.value=!1,a.success("转换成功","JSON 已成功转换为 YAML"))}catch{l.value=!0,a.error("转换失败","请检查 JSON 格式是否正确")}},k=()=>{if(r.value.trim())try{const s=x.parseYamlToJson(r.value);s&&Object.keys(s).length>0&&(o.value=JSON.stringify(s,null,2),n.value=!1,l.value=!1,a.success("转换成功","YAML 已成功转换为 JSON"))}catch{n.value=!0,a.error("转换失败","请检查 YAML 格式是否正确")}},L=s=>{const e=s.target;e.value!==o.value&&(o.value=e.value,Y())},M=s=>{const e=s.target;e.value!==r.value&&(r.value=e.value,A())};return(s,e)=>(f(),v("div",P,[t("div",$,[e[3]||(e[3]=t("div",{class:"p-4 border-b border-border"},[t("h3",{class:"text-lg font-semibold text-foreground"},"JSON 数据"),t("p",{class:"text-sm text-muted-foreground"},"编辑 JSON 数据，点击转换按钮生成 YAML")],-1)),t("div",E,[t("div",w,[i(u(d),{onClick:N,variant:"outline",size:"sm",type:"button"},{default:c(()=>e[0]||(e[0]=[m(" 加载示例数据 ",-1)])),_:1,__:[0]}),i(u(d),{onClick:O,variant:"outline",size:"sm",type:"button"},{default:c(()=>e[1]||(e[1]=[m(" 格式化 JSON ",-1)])),_:1,__:[1]}),i(u(d),{onClick:T,variant:"default",size:"sm",type:"button"},{default:c(()=>e[2]||(e[2]=[m(" 转换为 YAML ",-1)])),_:1,__:[2]})]),t("div",B,[i(u(_),{value:o.value,placeholder:"请输入或粘贴 JSON 数据...",class:g(["font-mono text-sm h-96 resize-none",{"border-destructive":l.value}]),onInput:L},null,8,["value","class"]),l.value?(f(),v("div",V," JSON 格式错误 ")):b("",!0)])])]),t("div",X,[e[6]||(e[6]=t("div",{class:"p-4 border-b border-border"},[t("h3",{class:"text-lg font-semibold text-foreground"},"YAML 脚本"),t("p",{class:"text-sm text-muted-foreground"},"编辑 YAML 脚本，点击转换按钮生成 JSON")],-1)),t("div",q,[t("div",D,[i(u(d),{onClick:S,variant:"outline",size:"sm",type:"button"},{default:c(()=>e[4]||(e[4]=[m(" 加载示例 YAML ",-1)])),_:1,__:[4]}),i(u(d),{onClick:k,variant:"default",size:"sm",type:"button"},{default:c(()=>e[5]||(e[5]=[m(" 转换为 JSON ",-1)])),_:1,__:[5]})]),t("div",R,[i(u(_),{value:r.value,placeholder:"请输入或粘贴 YAML 脚本...",class:g(["font-mono text-sm h-96 resize-none",{"border-destructive":n.value}]),onInput:M},null,8,["value","class"]),n.value?(f(),v("div",F," YAML 格式错误 ")):b("",!0)])])])]))}}),K=j(H,[["__scopeId","data-v-64c23ed4"]]),Q={class:"py-6"},U={class:"h-[calc(100vh-200px)]"},me=y({__name:"AnimationParserTest",setup(h){const a=[{title:"动画解析器测试",href:"/animation-parser-test"}];return(o,r)=>(f(),z(C,{breadcrumbs:a},{default:c(()=>[t("div",Q,[r[0]||(r[0]=t("div",{class:"mb-6"},[t("h1",{class:"text-3xl font-bold text-foreground"},"动画解析器测试工具"),t("p",{class:"text-muted-foreground mt-2"}," 测试 AnimationParser 的 JSON 和 YAML 实时双向转换功能 ")],-1)),t("div",U,[i(K)])])]),_:1}))}});export{me as default};
