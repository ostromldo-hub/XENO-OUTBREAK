export function connectionInfo(interfaces,port,publicUrl=''){
 const lanUrls=[...new Set(Object.values(interfaces).flat().filter(i=>i&&(i.family==='IPv4'||i.family===4)&&!i.internal).map(i=>'http://'+i.address+':'+port))];
 let clean='';try{const u=new URL(publicUrl);if(['http:','https:'].includes(u.protocol))clean=u.origin;}catch{}
 return {lanUrls,publicUrl:clean,maxPlayers:6};
}
