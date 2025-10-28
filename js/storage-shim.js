(function(){
  // dynamic loader for helper scripts and CSS
  function loadScript(src){ return new Promise((res,rej)=>{ const s=document.createElement('script'); s.src=src; s.onload=res; s.onerror=rej; document.head.appendChild(s); }); }
  function loadCSS(href){ const l=document.createElement('link'); l.rel='stylesheet'; l.href=href; document.head.appendChild(l); }

  async function init(){
    try{
      loadCSS('css/responsive.css');
      await loadScript('https://cdn.jsdelivr.net/npm/lz-string@1.4.4/libs/lz-string.min.js').catch(()=>{});
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/localforage/1.10.0/localforage.min.js').catch(()=>{});
      await loadScript('js/storage-browser.js').catch(()=>{});
      await loadScript('js/detect-device.js').catch(()=>{});

      for(let i=0;i<30;i++){ if(window.readTempUsersData && window.saveTempUsersData) break; await new Promise(r=>setTimeout(r,100)); }

      window.loadLocalData = async function(){
        try{
          let result;
          const tempUsersData = (typeof readTempUsersData==='function')? await readTempUsersData('temp_users_data') : null;
          if(tempUsersData){
            const response = await fetch('data.json');
            const initialData = await response.json();
            result = { users: tempUsersData, admin: initialData.admin };
          } else {
            const response = await fetch('data.json');
            if(!response.ok) throw new Error(`Gagal memuat data.json: ${response.status}`);
            result = await response.json();
          }
          window.localData = result;
          return true;
        }catch(err){ console.error('loadLocalData (shim) error',err); return false; }
      };

      window.saveUsersData = window.saveUsersData || (async function(){
        try{ const u = window.USERS_DATA || window.USERS_DATA; if(!u) return {ok:false, error:'no-users-data'}; return await saveTempUsersData('temp_users_data', u);}catch(e){return {ok:false,error:e};}
      });

      window.loadData = window.loadData || (async function(){
        try{
          setLoadingState && setLoadingState(true);
          let result;
          const tempUsersData = (typeof readTempUsersData==='function')? await readTempUsersData('temp_users_data') : null;
          if(tempUsersData){ result = { users: tempUsersData }; }
          else { const response = await fetch('data.json'); if(!response.ok) throw new Error(`Gagal memuat data.json: ${response.status}`); result = await response.json(); }
          window.USERS_DATA = result.users;
          return true;
        }catch(err){ console.error('loadData (shim) error',err); return false; }
      });

      window.loadUserData = window.loadUserData || (async function(){
        try{
          showLoading && showLoading();
          let result;
          const tempUsersData = (typeof readTempUsersData==='function')? await readTempUsersData('temp_users_data') : null;
          if(tempUsersData){ result = { users: tempUsersData }; }
          else { const response = await fetch('data.json'); if(!response.ok) throw new Error(`Gagal memuat data.json: ${response.status}`); result = await response.json(); }
          window.USERS_DATA = result.users;
          window.userData = window.USERS_DATA && window.USERS_DATA[(new URLSearchParams(window.location.search)).get('nrp')];
          return true;
        }catch(err){ console.error('loadUserData (shim) error',err); return false; }
      });

      window.loadVerificationData = window.loadVerificationData || (async function(){
        try{
          const urlParams = new URLSearchParams(window.location.search);
          const nrp = urlParams.get('nrp');
          const senpi = urlParams.get('senpi');
          if(!nrp||!senpi) { showError && showError('Parameter verifikasi tidak valid'); return; }
          showLoading && showLoading();
          try{
            const usersData = (typeof readTempUsersData==='function')? await readTempUsersData('temp_users_data') : null;
            if(!usersData) throw new Error('Data sistem tidak ditemukan');
            const user = usersData[nrp]; if(!user) throw new Error('Data personel tidak ditemukan');
            const senpiData = user.senpi.find(s=>s.nomor_seri===senpi); if(!senpiData) throw new Error('Data senpi tidak ditemukan');
            displayVerificationResult && displayVerificationResult(user, senpiData, nrp);
          }catch(e){ showError && showError(e.message); }
          finally{ hideLoading && hideLoading(); }
        }catch(err){ console.error('loadVerificationData (shim) error',err); }
      });

      console.log('[storage-shim] initialized');
    }catch(e){ console.error('storage-shim init error',e); }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
