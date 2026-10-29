(function(){
  var KEY="scrum-backlog-v1", ORDER=["backlog","sprint","done"];
  var items=[];
  try{var raw=localStorage.getItem(KEY); if(raw) items=JSON.parse(raw)||[];}catch(e){items=[];}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(items));}catch(e){}}
  function $(id){return document.getElementById(id);}
  function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
  function sum(s){return items.filter(function(i){return i.status===s;}).reduce(function(a,i){return a+i.points;},0);}

  function add(){
    var t=$("title").value.trim();
    if(!t){$("title").focus();return;}
    items.push({id:uid(),title:t,points:+$("pts").value,value:+$("val").value,status:"backlog"});
    $("title").value="";$("title").focus();
    update();
  }
  function move(id,dir){
    var it=items.find(function(i){return i.id===id;});
    var n=ORDER.indexOf(it.status)+dir;
    if(n>=0&&n<ORDER.length){it.status=ORDER[n];update();}
  }
  function remove(id){items=items.filter(function(i){return i.id!==id;});update();}
  function edit(id){
    var it=items.find(function(i){return i.id===id;});
    var t=prompt("Edit story",it.title);
    if(t&&t.trim()){it.title=t.trim();update();}
  }
  function btn(label,fn,aria){
    var b=document.createElement("button");b.textContent=label;b.setAttribute("aria-label",aria||label);b.onclick=fn;return b;
  }
  function card(it){
    var c=document.createElement("div");c.className="card";
    var p=document.createElement("p");p.textContent=it.title;c.appendChild(p);
    var m=document.createElement("div");m.className="meta";
    [it.points+" pts","value "+it.value].forEach(function(x){var s=document.createElement("span");s.className="tag";s.textContent=x;m.appendChild(s);});
    c.appendChild(m);
    var a=document.createElement("div");a.className="acts";
    if(it.status!=="backlog")a.appendChild(btn("←",function(){move(it.id,-1);},"Move back"));
    if(it.status!=="done")a.appendChild(btn("→",function(){move(it.id,1);},"Move forward"));
    a.appendChild(btn("Edit",function(){edit(it.id);}));
    a.appendChild(btn("Delete",function(){remove(it.id);}));
    c.appendChild(a);return c;
  }
  function render(){
    document.querySelectorAll(".col").forEach(function(col){
      var s=col.dataset.s,list=col.querySelector(".list");
      list.textContent="";
      var f=items.filter(function(i){return i.status===s;});
      f.forEach(function(i){list.appendChild(card(i));});
      if(!f.length){var e=document.createElement("p");e.className="empty";
        e.textContent=s==="backlog"?"Add a story above to start.":s==="sprint"?"Move stories here to commit them.":"Finished stories land here.";list.appendChild(e);}
      col.querySelector("h2 span").textContent=f.length+" · "+sum(s)+" pts";
    });
    var cap=Math.max(1,+$("cap").value||1),com=sum("sprint");
    $("sCommit").textContent=com;$("sDone").textContent=sum("done");$("sBacklog").textContent=sum("backlog");
    var bar=$("capBar");bar.classList.toggle("over",com>cap);
    bar.firstElementChild.style.width=Math.min(100,com/cap*100)+"%";
    tips(cap,com);
  }
  function tips(cap,com){
    var out=[],sprint=items.filter(function(i){return i.status==="sprint";});
    var open=items.filter(function(i){return i.status!=="done";});
    if(com>cap)out.push("Sprint is over capacity by "+(com-cap)+" points. Move a lower-value story back to the backlog.");
    else if(com<cap*0.6&&items.some(function(i){return i.status==="backlog";})){
      var best=items.filter(function(i){return i.status==="backlog"&&i.points<=cap-com;})
        .sort(function(a,b){return b.value/b.points-a.value/a.points;})[0];
      if(best)out.push("There is room for more. Best fit: “"+best.title+"” ("+best.points+" pts, value "+best.value+").");
    }
    open.forEach(function(i){
      if(i.points>=13)out.push("“"+short(i.title)+"” is "+i.points+" points. Split it into smaller stories.");
      if(!/\bas an?\b/i.test(i.title)||!/\bi want\b/i.test(i.title))out.push("“"+short(i.title)+"” isn’t in “As a… I want… so that…” form.");
      else if(!/\bso that\b/i.test(i.title))out.push("“"+short(i.title)+"” is missing the “so that” benefit.");
    });
    sprint.forEach(function(i){if(i.value<=2&&i.points>=5)out.push("“"+short(i.title)+"” costs "+i.points+" points for low value. Reconsider it for this sprint.");});
    var box=$("tips");box.textContent="";
    out.slice(0,8).forEach(function(t){var d=document.createElement("p");d.className="tip";d.textContent=t;box.appendChild(d);});
    if(!out.length){var g=document.createElement("p");g.className="tip good";g.textContent=items.length?"No issues found. The backlog looks ready.":"Add stories and I’ll check them.";box.appendChild(g);}
  }
  function short(t){return t.length>40?t.slice(0,40)+"…":t;}
  function update(){save();render();}

  $("add").onclick=add;
  $("title").addEventListener("keydown",function(e){if(e.key==="Enter")add();});
  $("cap").oninput=render;
  $("sort").onclick=function(){
    var back=items.filter(function(i){return i.status==="backlog";})
      .sort(function(a,b){return b.value/b.points-a.value/a.points;});
    items=back.concat(items.filter(function(i){return i.status!=="backlog";}));update();
  };
  $("clear").onclick=function(){items=items.filter(function(i){return i.status!=="done";});update();};
  $("demo").onclick=function(){
    [["As a shopper, I want to save my cart, so that I can finish later",3,4],
     ["As an admin, I want to export orders, so that I can reconcile payments",5,3],
     ["As a user, I want to reset my password, so that I can regain access",2,5],
     ["Redesign checkout",13,4],
     ["As a visitor, I want dark mode, so that reading is easier at night",5,1]]
    .forEach(function(r){items.push({id:uid(),title:r[0],points:r[1],value:r[2],status:"backlog"});});
    update();
  };
  render();
})();
