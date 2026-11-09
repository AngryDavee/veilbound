// World VI — a snowbound hot-spring village of swordsmiths. Real vocabulary: multi-storey
// Taisho-era wooden inns along a river, gas lamps, footbridges, tatara furnaces, waterwheels.
export const world={id:'springs',number:'VI',name:'Ember Springs',herald:'The Rust Warden',
 summary:'The village that cast every anchor bell is snowed in. Its forges are cold, its blades are rusting on the racks, and a Herald waits in the steam.',
 accent:'#f0a060',card:'#24282c'};
export const regions={
 'springs-bridges':{name:'The Gaslamp Bridges',tag:'Snow on the river street',module:'./realms/springs/bridges.js',
  description:'Wooden inns three and four storeys tall lean over a steaming river. Gas lamps glow on every footbridge, and the snow is still falling.',
  spawn:[0,1.68,45],look:[0,5,0],exit:[0,1,-57.5],returnPoint:[0,1,49],
  arena:{name:'The inn square',center:[0,0,-28],size:[20,18]},
  theme:{sky:'night',background:0x0f1726,fog:0x34425a,density:.0065,sun:0xc8d8ff,power:.7,sunPos:[-40,80,30],ambient:.85,hemiSky:0x9aacca,hemiGround:0x585450,exposure:1.1,env:.1,label:'Snow'}},
 'springs-forge':{name:'The Forge Terraces',tag:'The last fire',module:'./realms/springs/forge.js',
  description:'Stepped forges climb the valley wall beside a waterwheel. Every smithy is dark but one: the great clay furnace still burns, unattended, while rust creeps up the sword racks.',
  spawn:[0,1.68,40],look:[0,6,0],exit:[0,6,-44.5],returnPoint:[0,1,45],
  arena:{name:'The casting floor',center:[0,0,-6],size:[22,20]},
  theme:{sky:'night',background:0x161c26,fog:0x4c5260,density:.012,sun:0xd0dcff,power:.6,sunPos:[30,80,-20],ambient:.75,hemiSky:0x8a9cbc,hemiGround:0x3a2e28,exposure:1.15,env:.08,label:'Snow'}},
 'springs-basin':{name:'The Steam Basin',tag:'Where every bell was born',module:'./realms/springs/basin.js',
  description:'An open-air spring among black boulders and falling snow. The Rust Warden waits in the steam beside the last bell the smiths ever cast.',
  spawn:[0,1.68,30],look:[0,3,-14],exit:[15.2,1,-33.8],returnPoint:[0,1,36.5],
  arena:{name:'The steam shelf',center:[0,0,-4],size:[26,22]},
  theme:{sky:'night',background:0x0e1420,fog:0x46546a,density:.009,sun:0xd8e4ff,power:.7,sunPos:[-20,90,-40],ambient:.8,hemiSky:0xa0b0cc,hemiGround:0x404448,exposure:1.1,env:.08,label:'Snow'}}
};
export const clues={
 'springs-bridges':[
  {id:'springs-inn-register',pos:[-8.7,1,21.2],title:'The inn register',text:'Every smith in the village signed out on the same night: “gone to the basin to strike the last bell.” None signed back in. The snow on the step is undisturbed.'},
  {id:'springs-blade',pos:[8.4,1,-6.2],title:'A rusted blade in the snow',text:'A fine blade, rusted through in a single night. Rust in the shape of a handprint. The Herald does not break steel — he makes it forget it was ever sharp.'},
  {id:'springs-lamp',pos:[.6,1,-54],title:'The last lit gas lamp',text:'One lamp still burns at the end of the street. Tied to its post: your sibling’s scarf-pin, and a note — “The Court is letting go. I’m coming. Light the forge.”'}
 ],
 'springs-forge':[
  {id:'springs-tatara',pos:[-14,1,-6],title:'The last fire',text:'Every forge on the terraces is cold except this one. The waterwheel still works the bellows, and someone has kept the clay furnace fed — fresh charcoal, still unburnt, stacked by the tuyeres. Your sibling kept the last fire alive for the smiths who never came back.'},
  {id:'springs-mold',pos:[13.2,1,-3.6],title:'The bell mould',text:'A clay bell mould is split open — empty. The smiths cast the final anchor bell here, then carried it uphill to keep it from the Rust Warden.'},
  {id:'springs-hammer',pos:[0,6,-36],title:'The master’s hammer',text:'A smith’s hammer left on the top step, its handle wrapped in a Warden’s cord. Your sibling was here, hours ago, and went up to the basin alone.'}
 ],
 'springs-basin':[
  {id:'springs-last-bell',pos:[0,1,-17.6],title:'The last bell',text:'The bell sits half-submerged in the hot spring, untouched by rust. You strike it. Five notes answer from five worlds — the anchors are whole. And far below the basin, something enormous opens its doors.'},
  {id:'springs-steam-letter',pos:[-12.2,1,-11],title:'A letter in the steam',text:'Words form on the cold rock where the steam condenses: “The bells are lit. The Nightwright cannot hold the world from outside anymore — so he will pull us in. Don’t be afraid of falling.”'},
  {id:'springs-door',pos:[15,1,-28],title:'A door in the water',text:'Beneath the surface, a sliding door glows with lamplight, impossibly, at the bottom of the spring. It opens downward. The Endless Keep is waiting.'}
 ]
};
