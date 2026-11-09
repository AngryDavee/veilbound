// World II — a Taisho-era capital at night. Original city; real-world vocabulary only
// (brick arcades, gas lamps, tram rails, a temple gate lantern, a brick observation tower).
export const world={id:'city',number:'II',name:'The Ward of a Thousand Lamps',herald:'The Lamplighter',
 summary:'The capital never sleeps, but its temple bell has. A Herald walks the crowds wearing borrowed faces, and every lamp he passes gutters.',
 accent:'#d89a52',card:'#2c2620'};
export const regions={
 'city-avenue':{name:'Lamplight Avenue',tag:'The borrowed faces',module:'./realms/city/avenue.js',
  description:'Rain-slick brick arcades, tram rails and gas lamps. Somewhere in this crowd of empty storefronts, your sibling left a warning.',
  spawn:[0,1.68,40],look:[0,3,0],exit:[0,1,-46],returnPoint:[0,1,44],
  arena:{name:'The tram crossing',center:[0,0,-8],size:[22,20]},
  theme:{sky:'night',background:0x0d1220,fog:0x1a2030,density:.0055,sun:0x9fb4e8,power:.55,sunPos:[-40,70,-30],ambient:.55,hemiSky:0x6a7ea8,hemiGround:0x2a2018,exposure:1.15,env:.06,label:'Night'}},
 'city-precinct':{name:'The Thunderbell Precinct',tag:'The bell wrapped in black',module:'./realms/city/precinct.js',
  description:'A great red gate, a giant paper lantern and a five-storey pagoda. The temple bell hangs silent beneath black cloth.',
  spawn:[0,1.68,45],look:[0,5.5,10],exit:[22,1,-46],returnPoint:[0,1,48.8],
  arena:{name:'The incense court',center:[0,0,-6],size:[24,22]},
  theme:{sky:'night',background:0x100f1c,fog:0x241c26,density:.006,sun:0xa9b6e0,power:.6,sunPos:[30,80,-40],ambient:.6,hemiSky:0x75719c,hemiGround:0x2c1c14,exposure:1.15,env:.06,label:'Night'}},
 'city-tower':{name:'The Cloudpiercer',tag:'Twelve storeys above the lamps',module:'./realms/city/tower.js',
  description:'A brick observation tower rises over the sleeping capital. From its roof terrace, the Lamplighter’s trail runs north toward the mountains.',
  spawn:[0,1.68,10.5],look:[0,5,-20],exit:[0,1,-14],returnPoint:[0,1,14],
  arena:{name:'The roof terrace',center:[0,0,0],size:[24,24]},
  theme:{sky:'night',background:0x0b1022,fog:0x2c2638,density:.0022,sun:0xb8c8ff,power:.8,sunPos:[-60,90,-50],ambient:.6,hemiSky:0x6b80b8,hemiGround:0x2a2420,exposure:1.2,env:.08,label:'Moonlight'}}
};
export const clues={
 'city-avenue':[
  {id:'city-lamp-pass',pos:[-8,1,18],title:'A Warden’s lamp pass',text:'A brass lamp pass stamped with the Warden crest lies in a gutter. Your sibling’s number is scratched out and replaced with a single word: “Faces.”'},
  {id:'city-portrait',pos:[8.2,1,8.6],title:'An unfinished portrait',text:'A street portraitist abandoned his easel mid-sketch. The face on the paper has no eyes — only two lamp flames. The charcoal note beneath reads: “He asked me to draw who he was before.”'},
  {id:'city-tram-ticket',pos:[-6,1,-34],title:'A tram ticket punched twice',text:'A tram ticket for the last car to the Thunderbell Precinct, punched once by the conductor and once by a fingernail. On the back: “The bell is wrapped, not broken. Unwrap it at the hour of the ox.”'}
 ],
 'city-precinct':[
  {id:'city-ema',pos:[12,1,6.4],title:'A prayer plaque',text:'Among hundreds of wooden prayer plaques, one is written in your sibling’s hand: “Let my younger one stay in the valley.” Someone has crossed out “stay” and written “follow.”'},
  {id:'city-incense',pos:[0,1,10.4],title:'Cold incense',text:'The great incense burner is full, but none of it has burned. The ash is pale wax — silk-wax, the kind pressed by farmers on the northern ridges.'},
  {id:'city-black-cloth',pos:[20,1,-25.2],title:'The bell wrapped in black',text:'You cut the black cloth from the Thunderbell. It hums before you strike it — then rings across the whole ward. Every gas lamp flares at once. From the observation tower, something watches.'}
 ],
 'city-tower':[
  {id:'city-telescope',pos:[12,1,-1.2],title:'The coin telescope',text:'The telescope is aimed north, at a dark ridge furred with mist. Tiny threads of light shimmer between its cedars.'},
  {id:'city-lamp-oil',pos:[-13.2,1,5.4],title:'The Lamplighter’s can',text:'An abandoned lamplighter’s can, still warm. Its oil smells of mulberry and wax. A stamp on its base: “Mistweave Ridge Cooperative.”'},
  {id:'city-letter',pos:[-4.6,1,-13.4],title:'A letter pinned by a knife',text:'“The Heralds are not hiding. They are building. Each one is folding a piece of the world for the Nightwright’s Keep. Go north. — your sibling, written before the Court closed.”'}
 ]
};
