// Articulation of the original separate mesh parts; no external animation asset.
export function gaitPose(time, index, speed = 1) {
  const phase = time * 7 + (index % 2) * Math.PI + Math.floor(index / 2) * 2.1;
  return { swing: Math.sin(phase) * .24 * speed, lift: Math.max(0, Math.cos(phase)) * .15 * speed };
}
export function prepareCreature(THREE, model) {
  const meshes = [];
  model.traverse(o => { if (o.isMesh) meshes.push(o); });
  const normalized = o => o.name.replaceAll(' ', '_');
  const find = name => meshes.find(o => normalized(o) === name);
  const pivotFor = mesh => {
    mesh.geometry.computeBoundingBox();
    return mesh.localToWorld(mesh.geometry.boundingBox.getCenter(new THREE.Vector3()));
  };
  model.updateMatrixWorld(true);
  const legs = [];
  for (let i = 0; i < 6; i++) {
    const suffix = i ? `_${i}` : '';
    const joint = find(`joint${suffix}`), knee = find(`knee${suffix}`);
    if (!joint || !knee) continue;
    const hip = new THREE.Group(), shin = new THREE.Group();
    model.add(hip); hip.position.copy(model.worldToLocal(pivotFor(joint)));
    model.updateMatrixWorld(true);
    hip.add(shin); shin.position.copy(hip.worldToLocal(pivotFor(knee)));
    model.updateMatrixWorld(true);
    for (const name of [`joint${suffix}`, `upper_leg${suffix}`]) { const m = find(name); if (m) hip.attach(m); }
    for (const name of [`knee${suffix}`, `lower_leg${suffix}`, `talon${i*2 ? `_${i*2}` : ''}`, `talon_${i*2+1}`]) { const m = find(name); if (m) shin.attach(m); }
    legs.push({hip, shin, side: hip.position.x < 0 ? -1 : 1});
  }
  const tails = meshes.filter(o => normalized(o).startsWith('segmented_tail')).map(mesh => {
    const pivot = new THREE.Group(); model.add(pivot);
    const center = model.worldToLocal(pivotFor(mesh));
    pivot.position.copy(center); model.updateMatrixWorld(true); pivot.attach(mesh);
    return pivot;
  });
  model.userData.articulation = {legs, tails};
}
export function animateImported(model, time, seed, moving, dt) {
  const rig = model.userData.articulation;
  if (!rig) return;
  const target = moving ? 1 : 0;
  const activity = model.userData.activity = (model.userData.activity ?? 0) + (target - (model.userData.activity ?? 0)) * (1 - Math.exp(-dt*8));
  const t = time + Number(seed)*.37;
  rig.legs.forEach(({hip, shin, side}, i) => {
    const pose = gaitPose(t, i, activity);
    hip.rotation.y = pose.swing;
    hip.rotation.z = side * pose.lift;
    shin.rotation.z = -side * pose.lift * 1.7;
  });
  rig.tails.forEach((pivot,i) => { pivot.rotation.y = Math.sin(t*2.3+i*.45)*(.04+i*.008); });
  model.position.y = .08 + Math.sin(t*3.5)*.018 + Math.sin(t*14)*.025*activity;
  model.rotation.z = Math.sin(t*7)*.018*activity;
}
