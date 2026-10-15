(function(root){
  "use strict";
  let connection;
  async function open(){
    if(connection)return connection;
    if(!root.indexedDB)throw Error("此瀏覽器無法使用 IndexedDB。請改用一般瀏覽模式；資料尚未儲存。");
    connection=await new Promise((resolve,reject)=>{
      const request=indexedDB.open("fly-room-reading-lab",1);
      request.onupgradeneeded=()=>{for(const store of ["meta","sessions","audio"])request.result.createObjectStore(store);};
      request.onsuccess=()=>{request.result.onversionchange=()=>{request.result.close();connection=null;};resolve(request.result);};
      request.onerror=()=>reject(Error("無法開啟練習資料庫，請確認瀏覽器允許網站儲存資料。"));
    });return connection;
  }
  async function transaction(stores,mode,action){
    const db=await open();return new Promise((resolve,reject)=>{
      const tx=db.transaction(stores,mode);let result;
      tx.oncomplete=()=>resolve(result);
      tx.onerror=tx.onabort=()=>reject(Error("儲存失敗：可能已達瀏覽器空間上限，請先匯出備份或刪除不需要的錄音。"));
      try{action(tx,value=>{result=value;});}catch(error){tx.abort();reject(error);}
    });
  }
  const get=(store,key)=>transaction([store],"readonly",(tx,done)=>{tx.objectStore(store).get(key).onsuccess=e=>done(e.target.result);});
  const put=(store,key,value)=>transaction([store],"readwrite",tx=>tx.objectStore(store).put(value,key));
  const list=store=>transaction([store],"readonly",(tx,done)=>{tx.objectStore(store).getAll().onsuccess=e=>done(e.target.result);});
  const remove=(store,key)=>transaction([store],"readwrite",tx=>tx.objectStore(store).delete(key));
  const checkpoint=(session,state,blob)=>transaction(["meta","sessions","audio"],"readwrite",tx=>{
    tx.objectStore("meta").put(state,"state");
    tx.objectStore("sessions").put(session,session.id);
    if(blob){tx.objectStore("audio").put(blob,session.id);tx.objectStore("audio").put(blob,"draft-reading");}
  });
  async function saveSession(session,blob){
    return transaction(["sessions","audio"],"readwrite",tx=>{
      tx.objectStore("sessions").put(session,session.id);
      if(blob)tx.objectStore("audio").put(blob,session.id);
      tx.objectStore("audio").delete("draft-reading");
    });
  }
  const removeSession=id=>transaction(["sessions","audio"],"readwrite",tx=>{tx.objectStore("sessions").delete(id);tx.objectStore("audio").delete(id);});
  const clear=()=>transaction(["meta","sessions","audio"],"readwrite",tx=>{for(const name of ["meta","sessions","audio"])tx.objectStore(name).clear();});
  async function importData(data,state,audio){
    return transaction(["meta","sessions","audio"],"readwrite",tx=>{
      tx.objectStore("meta").put(state,"state");
      for(const session of data.sessions)tx.objectStore("sessions").put(session,session.id);
      for(const [id,blob]of audio)tx.objectStore("audio").put(blob,id);
    });
  }
  root.ReadingLabDB={get,put,list,remove,checkpoint,saveSession,removeSession,clear,importData};
})(window);
