(function(){
  "use strict";

  const fallbackRoute="ci/home";
  const routeFromHash=()=>{try{return decodeURIComponent(location.hash.replace(/^#\/?/,"")).trim()}catch(error){return ""}};
  const routeExists=route=>Boolean(document.getElementById(`tab-${route}`));

  function announce(route){
    window.dispatchEvent(new CustomEvent("app:routechange",{detail:{route}}));
  }

  function setRoute(route,options={}){
    const clean=String(route||fallbackRoute).replace(/^#\/?/,"");
    const next=`#${encodeURI(clean)}`;
    try{ if(typeof store!=="undefined") store.set("uxRoute",clean); }catch(error){}
    if(location.hash!==next){
      const method=options.replace?"replaceState":"pushState";
      history[method]({route:clean},"",next);
    }
    announce(clean);
  }

  function restore(){
    let route=routeFromHash();
    if(!route){
      try{ if(typeof store!=="undefined") route=store.get("uxRoute",fallbackRoute); }catch(error){}
    }
    route=route||fallbackRoute;
    const parts=route.split("/"), area=parts[0], view=parts.slice(1).join("/")||"home";

    if(area==="ci"){
      if(view==="broadcast"){
        window.showTab?.("ciBroadcast",{remember:false,syncRoute:false,preserveSubroute:true});
      }else{
        window.showTab?.("eva",{remember:false,syncRoute:false,preserveSubroute:true});
        window.setSprintAir?.("ci");
        window.renderCIRoute?.(view);
      }
      announce(route);
      return;
    }
    if(area==="eva"){
      setRoute(fallbackRoute,{replace:true});
      restore();
      return;
    }
    if(routeExists(route)){
      window.showTab?.(route,{remember:false,syncRoute:false,preserveSubroute:true});
      announce(route);
      return;
    }
    setRoute(fallbackRoute,{replace:true});
    restore();
  }

  window.setAppRoute=setRoute;
  window.appRoute={set:setRoute,restore};
  window.addEventListener("popstate",restore);
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",restore,{once:true});
  else restore();
})();
