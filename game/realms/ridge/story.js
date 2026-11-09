// World III — an abandoned silk-farming hamlet on a misted ridge. Real vocabulary:
// steep thatched farmhouses with silkworm attics, mulberry rows, cocoon racks, cedar ravines.
export const world={id:'ridge',number:'III',name:'Mistweave Ridge',herald:'The Weaver',
 summary:'A silk-farming hamlet emptied overnight. Threads of glowing mist run between the cedars, binding the villagers’ memories into cocoons.',
 accent:'#b9c9e6',card:'#1f2632'};
export const regions={
 'ridge-hamlet':{name:'The Silkfarm Hamlet',tag:'The village that forgot itself',module:'./realms/ridge/hamlet.js',
  description:'Steep thatched farmhouses stand above fallow terraces. Their silkworm attics are empty; their lamps are still lit.',
  spawn:[0,1.68,40],look:[0,4,0],exit:[0,1,-46],returnPoint:[0,1,44],
  arena:{name:'The threshing yard',center:[0,0,0],size:[22,20]},
  theme:{sky:'night',background:0x121a24,fog:0x323e50,density:.012,sun:0xc6d4ff,power:.9,sunPos:[-42,30,-86],target:[0,0,-5],ambient:.7,hemiSky:0x8094bb,hemiGround:0x252a22,exposure:1.15,env:.08,label:'Full moon'}},
 'ridge-ravine':{name:'The Threadbound Ravine',tag:'Threads of light',module:'./realms/ridge/ravine.js',
  description:'A cedar ravine strung with glowing filaments. A rope bridge crosses the gorge; every thread hums when you pass.',
  spawn:[0,1.68,44],look:[0,4,0],exit:[0,2.5,-50],returnPoint:[0,1,48],
  arena:{name:'The gorge shelf',center:[0,0,-17],size:[20,14]},
  theme:{sky:'night',background:0x0d141e,fog:0x2c3848,density:.013,sun:0xbfd0ff,power:1.35,sunPos:[-42,30,-86],target:[0,0,0],ambient:.85,hemiSky:0x7d94bc,hemiGround:0x262c28,exposure:1.3,env:.06,label:'Full moon'}},
 'ridge-hollow':{name:'The Cocoon Hollow',tag:'Where the memories sleep',module:'./realms/ridge/hollow.js',
  description:'Beneath an ancient camphor, hundreds of silk cocoons hang like lanterns. The anchor bell is bound somewhere in its roots.',
  spawn:[0,1.68,30],look:[0,6,-10],exit:[0,1,-34],returnPoint:[0,1,34],
  arena:{name:'The root circle',center:[0,0,3],size:[22,18]},
  theme:{sky:'night',background:0x0a0f18,fog:0x222a3a,density:.018,sun:0xb4c4f2,power:1.2,sunPos:[25,60,-76],target:[0,0,-12],ambient:.8,hemiSky:0x7088b4,hemiGround:0x22261e,exposure:1.3,env:.05,label:'Full moon'}}
};
export const clues={
 'ridge-hamlet':[
  {id:'ridge-attic',pos:[-12,1,6],title:'An empty silkworm attic',text:'Trays of mulberry leaves, still green. Not a single worm. Every tray is labelled with a family name — and every name has been unpicked, thread by thread, from the cloth tags.'},
  {id:'ridge-loom',pos:[10,1,-10],title:'The loom left running',text:'A loom holds an unfinished bolt woven with a pattern of five bells. The fifth is woven in your sibling’s scarf colour.'},
  {id:'ridge-trail',pos:[0,1.8,-40],title:'A thread that leads uphill',text:'One glowing filament runs from the last farmhouse into the ravine. Where you touch it, you hear a stranger’s lullaby — a memory, spun into silk.'}
 ],
 'ridge-ravine':[
  {id:'ridge-bridge-knot',pos:[0,-.4,4],title:'A Warden’s knot',text:'Halfway across the bridge, a rope is tied in a Warden’s binding knot — your sibling’s way of saying “I passed here, and I was not caught.”'},
  {id:'ridge-shrine',pos:[-12,1,-20],title:'A drowned roadside shrine',text:'The little shrine beside the falls is wrapped in silk to the eaves. Inside, a stone guardian holds a ticket for the midnight express in its lap.'},
  {id:'ridge-cut-thread',pos:[5,2.4,-42],title:'The severed thread',text:'A thread as thick as a wrist has been cut cleanly — a sword stroke. Beyond it, the ravine opens into the hollow of the great camphor.'}
 ],
 'ridge-hollow':[
  {id:'ridge-cocoon',pos:[-12,1,-7],title:'A cocoon that remembers',text:'Pressing your palm to one cocoon, you see a harvest festival: lanterns, drums, and the whole hamlet singing. The Weaver keeps their memories so the village will never miss them.'},
  {id:'ridge-root-bell',pos:[0,1,-14],title:'The bell in the roots',text:'The anchor bell is swallowed by camphor roots and wound in silk. You cut it free. Its note shakes every cocoon open, and light drifts home down the ridge.'},
  {id:'ridge-ticket',pos:[10,1,6],title:'The express timetable',text:'A torn timetable for Hollowmoor Station. Every departure reads 11:59. In the margin: “The second Herald keeps the clock. Don’t fall asleep on the train.”'}
 ]
};
