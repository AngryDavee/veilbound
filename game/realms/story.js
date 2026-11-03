export const chapters = {
 sanctuary:{number:'I',name:'Cloudveil Sanctuary',tag:'The missing guardian',description:'The training grounds are silent. Follow your sibling’s unfinished letter beyond the eastern ridge.',spawn:[0,1.68,24],look:[0,3,-16],next:'cedar',exit:[32,12,-46],returnPoint:[0,1,36],arena:{name:'Training court',center:[0,0,7],size:[18,18]},theme:{sky:true,fog:0xb4c8c1,density:.0018,sun:0xffe3b1,power:3.2,ambient:1.45}},
 reedwater:{number:'III',name:'Reedwater Crossing',tag:'The ferryman’s debt',description:'Rain washes through an abandoned canal town. A shipment of silent bells passed through its ferry yard.',spawn:[0,1.68,32],look:[0,4,-20],next:'folded',previous:'cedar',exit:[0,1,-37],returnPoint:[0,1,35],arena:{name:'The ferry yard',center:[0,0,15],size:[22,18]},theme:{sky:false,fog:0x526a78,density:.008,sun:0xa8c9e0,power:1.7,ambient:1.15}},
 cedar:{number:'II',name:'Whispering Thicket',tag:'The broken covenant',description:'An overgrown forest swallows the old pilgrim road. Follow the ribbon markers through bamboo and giant roots to the river town.',spawn:[0,1.68,37],look:[0,4,-25],next:'reedwater',previous:'sanctuary',exit:[0,1,-39],returnPoint:[0,1,39],arena:{name:'The hidden clearing',center:[0,0,-10],size:[26,26]},theme:{sky:true,fog:0x829487,density:.014,sun:0xffdfab,power:3.1,ambient:1.0}},
 folded:{number:'IV',name:'The Folded Court',tag:'The heart that holds the valley',description:'Rooms turn around a suspended observatory. Rejoin your sibling at the mechanism that keeps the valley from folding into itself.',spawn:[0,1.68,29],look:[0,6,-25],next:'sanctuary',previous:'reedwater',exit:[0,7,-79],returnPoint:[0,1,31],arena:{name:'The Meridian Ring',center:[0,0,0],size:[26,26]},theme:{sky:false,fog:0x121322,density:.006,sun:0x829cda,power:2.0,ambient:1.3}}
};
export const realmClues={
 reedwater:[
  {id:'ferry-token',pos:[10,1,18],title:'A token for two passengers',text:'Two names are scratched into a ferry token: your sibling’s, and the old bell founder’s. Neither passenger returned. Beneath the names is the mark of a cedar split by lightning.'},
  {id:'canal-ledger',pos:[-10,1,-27],title:'The ferryman’s ledger',text:'The last cargo was not weapons. It was three bronze tuning weights, bound for the foundry beyond Whispering Thicket. A note reads: “Keep the fourth weight here. Someone will follow.”'},
  {id:'rain-waybill',pos:[0,1,-35],title:'The fourth tuning weight',text:'A small bronze weight lies beneath an oilcloth. Your sibling left it deliberately. Its four notches match the pattern scratched into the silent sanctuary bell. The wrapping describes a doorway that appears in the old storehouse when the weight is brought close.'}
 ],
 cedar:[
  {id:'founder-mold',pos:[-11,1,-11],title:'A broken pilgrim marker',text:'The moss-covered marker carries an inscription: “These bells do not summon. They anchor.” The missing guardian was repairing a network of anchors beneath the valley.'},
  {id:'cedar-memory',pos:[11,1,9],title:'A promise in the roots',text:'Your sibling’s ribbon is wrapped around a weathered stone: “The Court is waking. I can hold its heart, but I cannot return without the fourth weight.” Beyond the clearing, a river runs toward the lanterns of Reedwater Crossing.'},
  {id:'threshold-key',pos:[0,1,-35],title:'A ferryman’s trail',text:'A small trail of copper tokens runs toward the river. Your sibling carved a message into the final marker: “Find the ferryman. Ask what the bells were keeping outside.” The path opens toward Reedwater Crossing.'}
 ],
 folded:[
  {id:'west-calibration',pos:[-30,1,0],title:'The western counterweight',text:'An old calibration plate names the builders: Keepers of the Fold. Their Court was designed to shelter the valley from a collapsing boundary. The moving halls are counterweights, not a prison.'},
  {id:'east-letter',pos:[30,1,0],title:'The guardian’s second letter',text:'“I am at the heart. The anchors were severed from outside. Bring the weight through the Meridian Ring. Whatever follows you, keep it away from the mechanism.” The central platform is the only ground wide enough to make a stand.'},
  {id:'heart-of-court',pos:[0,7,-72],title:'A place beside the heart',text:'A warm lantern, an unfinished meal, and your sibling’s scarf wait beside the astrolabe. The fourth weight fits. One rotating ring settles into place; a path home appears between the halls. The guardian’s return—and the final battle—belong to the next chapter of the build.'}
 ]
};
