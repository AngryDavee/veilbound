// World V — a walled pleasure quarter on the river. Real vocabulary: a moat, a great gate,
// a looking-back willow, a central avenue of cherry trees, lattice-fronted teahouses,
// and a fire-watch tower with its alarm bell.
export const world={id:'quarter',number:'V',name:'The Floating Quarter',herald:'The Mask Dancer',
 summary:'Behind a moat and a single gate, the lanterns never go out. A Herald dances here with two faces, and the fire-watch bell has been stolen from its tower.',
 accent:'#e2675a',card:'#2c1a1e'};
export const regions={
 'quarter-gate':{name:'The Willow Gate',tag:'Look back once',module:'./realms/quarter/gate.js',
  description:'A dark moat, a single bridge and a great gate under a weeping willow. Guests look back at the willow when they leave. Many never do.',
  spawn:[0,1.68,44],look:[0,4,0],exit:[0,1,-46],returnPoint:[0,1,48],
  arena:{name:'The gate plaza',center:[0,0,-20],size:[22,18]},
  theme:{sky:'night',background:0x120c14,fog:0x2a1a22,density:.012,sun:0xc0a8d8,power:.45,sunPos:[40,70,40],ambient:.6,hemiSky:0x6c5a80,hemiGround:0x3a1e16,exposure:1.2,env:.05,label:'Night'}},
 'quarter-avenue':{name:'The Avenue of Blossoms',tag:'Nights sold by the hour',module:'./realms/quarter/avenue.js',
  description:'Cherry trees run down the centre of the main avenue. Lattice-fronted teahouses glow on both sides, and every balcony is empty.',
  spawn:[-5.2,1.68,52],look:[-2,4,0],exit:[0,1,-56],returnPoint:[0,1,54],
  arena:{name:'The blossom crossing',center:[0,0,0],size:[18,24]},
  theme:{sky:'night',background:0x140c16,fog:0x351c24,density:.01,sun:0xd0b0e0,power:.45,sunPos:[-30,70,30],ambient:.65,hemiSky:0x7a5c88,hemiGround:0x401c14,exposure:1.2,env:.05,label:'Night'}},
 'quarter-rooftops':{name:'The Burning Rooftops',tag:'The two-faced dance',module:'./realms/quarter/rooftops.js',
  description:'The quarter is burning. Across the tiled rooftops, the fire-watch tower stands over the flames — and its bell is gone.',
  spawn:[0,1.68,26],look:[0,4,-10],exit:[0,1,-30],returnPoint:[0,1,30],
  arena:{name:'The ridge-tile plaza',center:[0,0,0],size:[24,22]},
  theme:{sky:'night',background:0x1a0a08,fog:0x4a2214,density:.012,sun:0xff8a4a,power:1.2,sunPos:[20,30,-40],ambient:.7,hemiSky:0xb0584a,hemiGround:0x401808,exposure:1.1,env:.05,label:'Fire'}}
};
export const clues={
 'quarter-gate':[
  {id:'quarter-willow',pos:[-6.3,1,25.8],title:'Ribbons on the willow',text:'Hundreds of paper fortunes are tied to the willow. One is a Warden’s red ribbon, knotted three times: “Do not trust the face that cries.”'},
  {id:'quarter-gatebook',pos:[5.6,1,3],title:'The gatekeeper’s book',text:'Every guest entered; none left. The last line, in perfect brushwork, belongs to a guest with no name — just a drawing of two masks, one laughing, one weeping.'},
  {id:'quarter-mask',pos:[0,1,-40],title:'A cracked mask',text:'A porcelain mask lies split in two on the avenue stones. Inside the laughing half is written: “Tonight the Quarter burns, so no one will remember the tower.”'}
 ],
 'quarter-avenue':[
  {id:'quarter-teahouse',pos:[-9,1,20],title:'A teahouse ledger',text:'Room after room booked under the same name: “The Dancer.” The rooms face the fire-watch tower. Each entry notes the hour the tower bell is rung.'},
  {id:'quarter-blossom',pos:[2.6,1,-13.2],title:'A blossom that will not fall',text:'Petals hang motionless in the air around the central cherry tree, held by the same frozen minute you broke on the express. The Heralds are working together.'},
  {id:'quarter-fan',pos:[9,1,-36],title:'Your sibling’s fan',text:'A Warden’s iron fan, wedged in a balcony rail and pointing toward the rooftops. Etched on its rib: “Bell taken to the forge. Rust Warden waits.”'}
 ],
 'quarter-rooftops':[
  {id:'quarter-tower',pos:[3,1,-21.4],title:'The empty fire tower',text:'The ladder is scorched and the alarm bell’s hook is bare. In its place hangs a counterfeit — a painted paper bell. The Dancer wanted the Quarter to burn unwarned.'},
  {id:'quarter-two-faces',pos:[-10,1,4],title:'Two faces, one mask',text:'The Dancer’s mask, finally dropped. Behind the porcelain, the laughing and weeping faces are both painted on the inside. There was never a face beneath.'},
  {id:'quarter-sparks',pos:[10,1,8],title:'Embers that point north',text:'The embers drift against the wind, north, toward snowy peaks where the smiths of Ember Springs once cast every anchor bell in the land.'}
 ]
};
