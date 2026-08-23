let W=[];
let unavailable=JSON.parse(localStorage.getItem("unavailable")||"[]");

fetch("https://raw.githubusercontent.com/AG20260822/outfit-selector/main/wardrobe.json")
  .then(r=>r.json())
  .then(data=>{
    W=[...data,...JSON.parse(localStorage.getItem("addedWardrobe")||"[]")];
    init();
  })
  .catch(err=>{
    console.error(err);
    document.body.insertAdjacentHTML("afterbegin", '<div style="padding:16px;text-align:center">Could not load wardrobe.</div>');
  });

function init() {
JSON.parse(localStorage.getItem("unavailable")||"[]");
let mood="any", style="any", weather="mild", chosen=null, current=[];
const $=s=>document.querySelector(s);
const available=()=>W.filter(x=>!unavailable.includes(x.id));
let feedback=JSON.parse(localStorage.getItem("outfitFeedback")||"[]");
function outfitKey(outfit){return outfit.map(x=>x.id).sort().join("|")}
function recordFeedback(kind,outfit){
 feedback.push({kind, outfit: outfit.map(x=>x.id), at: Date.now()});
 if(feedback.length>100) feedback=feedback.slice(-100);
 localStorage.setItem("outfitFeedback",JSON.stringify(feedback));
}
function feedbackBias(x){
 let yes=0,no=0;
 feedback.forEach(f=>{
   if(f.outfit.includes(x.id)){ if(f.kind==="yes")yes++; else if(f.kind==="no")no++; }
 });
 return yes*2-no*3;
}


function card(x){
 return `<div class="item ${unavailable.includes(x.id)?"unavail":""}" data-id="${x.id}">
   ${unavailable.includes(x.id)?'<span class="badge">Unavailable</span>':''}
   <img src="${x.image}" alt="${x.name}"><div class="meta"><b>${x.name}</b><small>${x.note}</small></div>
 </div>`;
}
function renderCloset(){
 $("#closet").innerHTML=W.map(card).join("");
 document.querySelectorAll("#closet .item").forEach(el=>el.onclick=()=>{
   chosen=W.find(x=>x.id===el.dataset.id);
   showChoice(chosen);
 });
}
function compatible(a,b){
 if(a.type==="bottom"&&b.type==="bottom")return false;
 if(a.type==="shoes"&&b.type==="shoes")return false;
 if(a.type==="top"&&b.type==="top")return false;
 if((a.id==="camisole"&&["vneck","stripe","pinstripe"].includes(b.id))||(b.id==="camisole"&&["vneck","stripe","pinstripe"].includes(a.id)))return false;
 return true;
}
function score(x){
 let s=2;
 if(mood==="comfy")s+=x.id==="vneck"?7:x.id==="pinstripe"?7:x.id==="jeans"?5:x.id==="sneakers"?5:0;
 if(mood==="good")s+=x.id==="necklace"?8:x.id==="vneck"?5:x.id==="trousers"?4:0;
 if(style==="casual")s+=x.id==="jeans"?6:x.id==="sneakers"?5:x.id==="stripe"?4:0;
 if(style==="semi")s+=x.id==="pinstripe"?6:x.id==="blazer"?6:x.id==="trousers"?5:x.id==="loafers"?5:0;
 if(style==="interesting")s+=x.id==="loafers"?9:x.id==="trousers"?7:x.id==="blazer"?6:x.id==="necklace"?5:0;
 if(weather==="cold")s+=x.id==="blazer"?5:x.id==="pinstripe"?3:0;
 if(weather==="warm")s+=x.id==="vneck"?4:x.id==="camisole"?4:x.id==="sneakers"?2:0;
 return s+feedbackBias(x)+Math.random()*2;
}
function generate(seed){
 const pool=available(), r=seed?[seed]:[];
 const pick=t=>pool.filter(x=>x.type===t&&!r.some(y=>y.id===x.id)&&r.every(y=>compatible(y,x))).sort((a,b)=>score(b)-score(a))[0];
 if(!r.some(x=>x.type==="bottom")){let x=pick("bottom");if(x)r.push(x)}
 if(!r.some(x=>x.type==="top")){
   let tops=pool.filter(x=>x.type==="top"&&!r.some(y=>y.id===x.id)&&r.every(y=>compatible(y,x)));
   let x=tops.sort((a,b)=>score(b)-score(a))[0];if(x)r.push(x)
 }
 if(weather==="cold"){
   let x=pick("layer");if(x)r.push(x)
 }
 let s=pick("shoes");if(s)r.push(s)
 if(mood==="good"||style==="semi"||style==="interesting"){
   let a=pick("accessory");if(a)r.push(a)
 }
 // A little creative push: interesting mode should deliberately consider underused loafers/blazer/trousers.
 if(style==="interesting" && !r.some(x=>x.id==="loafers") && !unavailable.includes("loafers") && !r.some(x=>x.type==="shoes")){
   r.push(W.find(x=>x.id==="loafers"));
 }
 return r;
}
function show(title, outfit, note){
 current=outfit;
 $("#result").classList.add("show");
 $("#result").innerHTML=`<div class="section-title">STYLIST SUGGESTION</div><h2>${title}</h2><p>${chosen ? `🔒 ${chosen.name} stays — I’ll change the pieces around it.` : note}</p><div class="look">${outfit.map(card).join("")}</div><div class="tools">
   <button id="like">❤️ Yes</button><button id="dislike">👎 No</button><button id="new">↻ Try another</button>
   <button id="change">🔄 Change one thing</button><button id="alts">🎲 Alternatives</button>
 </div>
 <div id="feedback-note" class="hint"></div>`;
 $("#result").querySelectorAll(".item").forEach(el=>el.onclick=()=>toggle(el.dataset.id));
 $("#like").onclick=()=>{
   recordFeedback("yes",current);
   $("#feedback-note").textContent="Got it ❤️ I’ll use that signal for future suggestions.";
 };
 $("#dislike").onclick=()=>{
   recordFeedback("no",current);
   $("#feedback-note").textContent="Got it 👌 I’ll use that signal for future suggestions.";
 };
 $("#new").onclick=()=>{
   const anchor = chosen || null;
   show(title,generate(anchor), anchor ? `Same ${anchor.name}, with a different combination around it.` : "Another option based on your current mood.");
 };
 $("#change").onclick=changeOne;
 $("#alts").onclick=alternatives;
 $("#result").scrollIntoView({behavior:"smooth",block:"nearest"});
}
function toggle(id){
 unavailable=unavailable.includes(id)?unavailable.filter(x=>x!==id):[...unavailable,id];
 localStorage.setItem("unavailable",JSON.stringify(unavailable));renderCloset();
}
function openPicker(){
 $("#pickgrid").innerHTML=available().map(x=>`<button class="pick" data-pick="${x.id}"><img src="${x.image}"><b>${x.name}</b></button>`).join("");
 document.querySelectorAll("[data-pick]").forEach(b=>b.onclick=()=>{
   chosen=W.find(x=>x.id===b.dataset.pick); picker.close(); showChoice(chosen);
 });
 picker.showModal();
}
function showChoice(item){
 $("#result").classList.add("show");
 $("#result").innerHTML=`<div class="section-title">YOUR STARTING POINT</div>
 <h2>${item.name}</h2><div class="look">${card(item)}</div>
 <p>What should I do with it?</p>
 <div class="tools">
   <button id="build">✨ Build me an outfit</button>
   <button id="ways">🎲 Show me alternatives</button>
   <button id="goes">👀 What goes with this?</button>
 </div>`;
 $("#build").onclick=()=>show("Built around your choice",generate(item),"A complete look built around your chosen piece, style direction and weather.");
 $("#ways").onclick=()=>showAlternatives(item);
 $("#goes").onclick=()=>showCompatible(item);
 $("#result").scrollIntoView({behavior:"smooth",block:"nearest"});
}
function showCompatible(item){
 const matches=available().filter(x=>x.id!==item.id&&compatible(item,x)).sort((a,b)=>score(b)-score(a)).slice(0,6);
 $("#result").classList.add("show");
 $("#result").innerHTML=`<div class="section-title">WHAT GOES WITH IT</div><h2>Good matches for ${item.name}</h2>
 <p>Pieces I'd reach for first.</p><div class="look">${matches.map(card).join("")}</div>
 <div class="tools"><button id="build2">✨ Build a complete outfit</button></div>`;
 $("#build2").onclick=()=>show("Built around your choice",generate(item),"A complete look built around your chosen piece, style direction and weather.");
}
function showAlternatives(item){
 const a=generate(item), b=generate(item), c=generate(item);
 $("#result").classList.add("show");
 $("#result").innerHTML=`<div class="section-title">ALTERNATIVES</div><h2>Three ways to wear it</h2>
 <p>Same starting piece, different directions.</p>`+
 [a,b,c].map((v,i)=>`<div style="margin-top:18px"><b>Option ${i+1}</b><div class="look">${v.map(card).join("")}</div></div>`).join("");
}
function changeOne(){
 const choices=current.filter(x=>!chosen || x.id!==chosen.id).map(x=>`<button class="pick" data-change="${x.id}"><img src="${x.image}"><b>Change ${x.name}</b></button>`).join("");
 $("#pickgrid").innerHTML=choices;
 document.querySelectorAll("[data-change]").forEach(b=>b.onclick=()=>{
   const old=W.find(x=>x.id===b.dataset.change);
   const replacement=available().filter(x=>x.type===old.type&&x.id!==old.id&&!current.some(y=>y.id===x.id)).sort((a,b)=>score(b)-score(a))[0];
   if(replacement)show("One thing changed",current.map(x=>x.id===old.id?replacement:x),"Same outfit direction, one fresh piece.");
   picker.close();
 });
 picker.showModal();
}
function alternatives(){
 let seed=chosen||current.find(x=>x.type==="bottom")||current[0];
 const vs=[generate(seed),generate(seed),generate(seed)];
 const loafer=W.find(x=>x.id==="loafers"),blazer=W.find(x=>x.id==="blazer");
 if(!unavailable.includes("loafers")&&vs[1].some(x=>x.type==="shoes"))vs[1].splice(vs[1].findIndex(x=>x.type==="shoes"),1,loafer);
 if(!unavailable.includes("blazer")&&!vs[2].some(x=>x.id==="blazer"))vs[2].push(blazer);
 $("#result").innerHTML=`<div class="section-title">ALTERNATIVES</div><h2>Three ways to wear it</h2><p>Same starting point, different feel.</p>`+vs.map((v,i)=>`<div style="margin-top:18px"><b>Option ${i+1}</b><div class="look">${v.map(card).join("")}</div></div>`).join("");
 $("#result").classList.add("show");
}
document.querySelectorAll("#styles .chip").forEach(b=>b.onclick=()=>{
 document.querySelectorAll("#styles .chip").forEach(x=>x.classList.remove("active"));b.classList.add("active");style=b.dataset.style;
});
document.querySelectorAll("#moods .chip").forEach(b=>b.onclick=()=>{
 document.querySelectorAll("#moods .chip").forEach(x=>x.classList.remove("active"));b.classList.add("active");mood=b.dataset.mood;
});
document.querySelectorAll("#weather .chip").forEach(b=>b.onclick=()=>{
 document.querySelectorAll("#weather .chip").forEach(x=>x.classList.remove("active"));b.classList.add("active");weather=b.dataset.weather;
});
$("#surprise").onclick=()=>show("A surprise for today",generate(),"Based on your style direction, mood and weather.");
$("#start").onclick=openPicker;
$("#addItem").onclick=()=>$("#photoInput").click();

$("#photoInput").onchange=async e=>{
  const file=e.target.files[0];
  if(!file)return;

  const img=new Image();
  img.onload=()=>{
    const max=1000;
    const scale=Math.min(1,max/Math.max(img.width,img.height));
    const canvas=document.createElement("canvas");
    canvas.width=Math.round(img.width*scale);
    canvas.height=Math.round(img.height*scale);
    canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);

    const photo=canvas.toDataURL("image/jpeg",0.8);
    $("#photoPreview").src=photo;
    $("#addForm").style.display="block";
    $("#itemName").focus();
  };
  img.src=URL.createObjectURL(file);
};

$("#saveItem").onclick=()=>{
  const name=$("#itemName").value.trim();
  const type=$("#itemType").value;
  const image=$("#photoPreview").src;

  if(!name){
    alert("Please give this item a name.");
    return;
  }

  const item={
    id:"photo-"+Date.now(),
    name,
    type,
    image,
    note:"Added from phone"
  };

  const added=JSON.parse(localStorage.getItem("addedWardrobe")||"[]");
  added.push(item);
  localStorage.setItem("addedWardrobe",JSON.stringify(added));

  W.push(item);
  renderCloset();

  $("#itemName").value="";
  $("#photoInput").value="";
  $("#addForm").style.display="none";
  $("#photoPreview").src="";
};
$("#reset").onclick=()=>{unavailable=[];localStorage.removeItem("unavailable");renderCloset()};
renderCloset();
}

