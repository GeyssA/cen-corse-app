1:"$Sreact.fragment"
2:I[283,["647","static/chunks/647-a77b83f133caaad7.js","177","static/chunks/app/layout-11681106f09b1ea1.js"],"AuthProvider"]
3:I[7555,[],""]
4:I[1295,[],""]
5:I[9243,["647","static/chunks/647-a77b83f133caaad7.js","177","static/chunks/app/layout-11681106f09b1ea1.js"],""]
7:I[894,[],"ClientPageRoot"]
8:I[5311,["647","static/chunks/647-a77b83f133caaad7.js","89","static/chunks/app/auth/reset-password/page-645fcef7ffaf90f8.js"],"default"]
b:I[9665,[],"OutletBoundary"]
e:I[4911,[],"AsyncMetadataOutlet"]
10:I[9665,[],"ViewportBoundary"]
12:I[9665,[],"MetadataBoundary"]
14:I[6614,[],""]
:HL["/_next/static/css/12cf841200df849b.css","style"]
6:T7fb,
              if ('serviceWorker' in navigator) {
                // Fonction pour forcer les mises à jour
                function forceUpdate() {
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for(let registration of registrations) {
                      registration.update();
                    }
                  });
                }
                
                // Fonction pour vider le cache
                function clearCache() {
                  if ('caches' in window) {
                    caches.keys().then(function(names) {
                      for (let name of names) {
                        caches.delete(name);
                      }
                    });
                  }
                }
                
                // Vider le cache au démarrage en développement
                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                  clearCache();
                }
                
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                      
                      // Écouter les mises à jour du service worker
                      registration.addEventListener('updatefound', function() {
                        console.log('🔄 Nouvelle version du service worker disponible');
                        forceUpdate();
                      });
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
                
                // Exposer les fonctions globalement pour le débogage
                window.forceUpdate = forceUpdate;
                window.clearCache = clearCache;
              }
            0:{"P":null,"b":"EZmywgXRJUAu-3n4A1L5N","p":"","c":["","auth","reset-password"],"i":false,"f":[[["",{"children":["auth",{"children":["reset-password",{"children":["__PAGE__",{}]}]}]},"$undefined","$undefined",true],["",["$","$1","c",{"children":[[["$","link","0",{"rel":"stylesheet","href":"/_next/static/css/12cf841200df849b.css","precedence":"next","crossOrigin":"$undefined","nonce":"$undefined"}]],["$","html",null,{"lang":"fr","children":[["$","head",null,{"children":[["$","meta",null,{"name":"apple-mobile-web-app-capable","content":"yes"}],["$","meta",null,{"name":"apple-mobile-web-app-status-bar-style","content":"default"}],["$","meta",null,{"name":"apple-mobile-web-app-title","content":"CEN Corse"}],["$","meta",null,{"name":"mobile-web-app-capable","content":"yes"}],["$","link",null,{"href":"https://fonts.googleapis.com/css2?family=Oswald:wght@400;700&display=swap","rel":"stylesheet"}],["$","link",null,{"href":"https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap","rel":"stylesheet"}]]}],["$","body",null,{"className":"__variable_c8daab __variable_59aeca antialiased","children":[["$","$L2",null,{"children":["$","$L3",null,{"parallelRouterKey":"children","error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L4",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":[[["$","title",null,{"children":"404: This page could not be found."}],["$","div",null,{"style":{"fontFamily":"system-ui,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\"","height":"100vh","textAlign":"center","display":"flex","flexDirection":"column","alignItems":"center","justifyContent":"center"},"children":["$","div",null,{"children":[["$","style",null,{"dangerouslySetInnerHTML":{"__html":"body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}"}}],["$","h1",null,{"className":"next-error-h1","style":{"display":"inline-block","margin":"0 20px 0 0","padding":"0 23px 0 0","fontSize":24,"fontWeight":500,"verticalAlign":"top","lineHeight":"49px"},"children":404}],["$","div",null,{"style":{"display":"inline-block"},"children":["$","h2",null,{"style":{"fontSize":14,"fontWeight":400,"lineHeight":"49px","margin":0},"children":"This page could not be found."}]}]]}]}]],[]],"forbidden":"$undefined","unauthorized":"$undefined"}]}],["$","$L5",null,{"id":"register-sw","strategy":"afterInteractive","dangerouslySetInnerHTML":{"__html":"$6"}}]]}]]}]]}],{"children":["auth",["$","$1","c",{"children":[null,["$","$L3",null,{"parallelRouterKey":"children","error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L4",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","forbidden":"$undefined","unauthorized":"$undefined"}]]}],{"children":["reset-password",["$","$1","c",{"children":[null,["$","$L3",null,{"parallelRouterKey":"children","error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L4",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","forbidden":"$undefined","unauthorized":"$undefined"}]]}],{"children":["__PAGE__",["$","$1","c",{"children":[["$","$L7",null,{"Component":"$8","searchParams":{},"params":{},"promises":["$@9","$@a"]}],null,["$","$Lb",null,{"children":["$Lc","$Ld",["$","$Le",null,{"promise":"$@f"}]]}]]}],{},null,false]},null,false]},null,false]},null,false],["$","$1","h",{"children":[null,["$","$1","PiVQaMbeF9Pq5WH0xzheDv",{"children":[["$","$L10",null,{"children":"$L11"}],null]}],["$","$L12",null,{"children":"$L13"}]]}],false]],"m":"$undefined","G":["$14","$undefined"],"s":false,"S":true}
15:"$Sreact.suspense"
16:I[4911,[],"AsyncMetadata"]
9:{}
a:{}
13:["$","div",null,{"hidden":true,"children":["$","$15",null,{"fallback":null,"children":["$","$L16",null,{"promise":"$@17"}]}]}]
d:null
11:[["$","meta","0",{"charSet":"utf-8"}],["$","meta","1",{"name":"viewport","content":"width=device-width, initial-scale=1"}]]
c:null
f:{"metadata":[["$","title","0",{"children":"CEN Corse - Communauté"}],["$","meta","1",{"name":"description","content":"Application communautaire du CEN Corse"}],["$","link","2",{"rel":"manifest","href":"/manifest.json","crossOrigin":"$undefined"}],["$","meta","3",{"name":"Cache-Control","content":"no-cache, no-store, must-revalidate"}],["$","meta","4",{"name":"Pragma","content":"no-cache"}],["$","meta","5",{"name":"Expires","content":"0"}],["$","meta","6",{"name":"mobile-web-app-capable","content":"yes"}],["$","meta","7",{"name":"apple-mobile-web-app-title","content":"CEN Corse"}],["$","meta","8",{"name":"apple-mobile-web-app-status-bar-style","content":"default"}],["$","link","9",{"rel":"icon","href":"/favicon.ico","type":"image/x-icon","sizes":"16x16"}],["$","link","10",{"rel":"icon","href":"/Logo_CENCorse.png"}],["$","link","11",{"rel":"apple-touch-icon","href":"/Logo_CENCorse.png"}]],"error":null,"digest":"$undefined"}
17:{"metadata":"$f:metadata","error":null,"digest":"$undefined"}
