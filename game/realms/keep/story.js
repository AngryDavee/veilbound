// World VII — the finale. An impossible fortress assembled from stolen places: shoji halls
// stacked to infinity, corridors running across walls and ceilings, a tiered atrium with a
// floating stage, and a final meridian where fragments of every world orbit.
export const world={id:'keep',number:'VII',name:'The Endless Keep',herald:'The Nightwright',
 summary:'The Nightwright’s fortress is built from every place his Heralds folded away. With the five bells lit, it can only pull the world inside. Your sibling is already falling toward its heart.',
 accent:'#c94a4a',card:'#1c1018'};
export const regions={
 'keep-halls':{name:'The Falling Halls',tag:'Don’t be afraid of falling',module:'./realms/keep/halls.js',
  description:'Tatami rooms stacked without end above and below. Shoji doors slide open on their own, and the floor you land on was a ceiling a moment ago.',
  spawn:[0,1.68,30],look:[0,14,-8],exit:[0,1,-36],returnPoint:[0,1,34],
  arena:{name:'The landing hall',center:[0,0,0],size:[24,24]},
  theme:{sky:'none',background:0x160808,fog:0x1e0b0b,density:.0095,sun:0xffb070,power:.9,sunPos:[0,80,10],ambient:.8,hemiSky:0xa06048,hemiGround:0x281410,exposure:1.15,env:.05,label:'Endless'}},
 'keep-corridors':{name:'The Inverted Corridors',tag:'Every direction is down',module:'./realms/keep/corridors.js',
  description:'Corridors run across walls and ceilings. Lanterns hang upward. Staircases climb sideways into rooms you can see but never reach.',
  spawn:[0,1.68,44],look:[0,3,0],exit:[0,1,-52],returnPoint:[0,1,48],
  arena:{name:'The crossing chamber',center:[0,0,0],size:[20,20]},
  theme:{sky:'none',background:0x100810,fog:0x241018,density:.012,sun:0xff9a60,power:.7,sunPos:[10,60,0],ambient:.75,hemiSky:0x904050,hemiGround:0x200c10,exposure:1.2,env:.04,label:'Endless'}},
 'keep-atrium':{name:'The Stacked Atrium',tag:'A museum of stolen places',module:'./realms/keep/atrium.js',
  description:'A tiered atrium of lacquered balconies rises out of sight around a floating stage. Folded into its walls: lamp-lit streets, train windows, teahouse lattices, forge-fire.',
  spawn:[0,1.68,34],look:[0,8,0],exit:[0,1,-38],returnPoint:[0,1,38],
  arena:{name:'The floating stage',center:[0,0,0],size:[22,22]},
  theme:{sky:'none',background:0x0e0810,fog:0x2a1420,density:.005,sun:0xffa870,power:.8,sunPos:[0,100,0],ambient:.8,hemiSky:0xa05060,hemiGround:0x2a1010,exposure:1.15,env:.05,label:'Endless'}},
 'keep-meridian':{name:'The Nightwright’s Meridian',tag:'Unfold the world',module:'./realms/keep/meridian.js',
  description:'At the bottom of everything, a circular hall opens onto a void. Fragments of every world you crossed orbit overhead. Your sibling is here.',
  spawn:[0,1.68,30],look:[0,8,0],exit:[0,1,-34],returnPoint:[0,1,34],
  arena:{name:'The Meridian',center:[0,0,0],size:[28,28]},
  theme:{sky:'none',background:0x150a10,fog:0x1a0e14,density:.0042,sun:0xffc890,power:1.0,sunPos:[0,100,20],ambient:.7,hemiSky:0x8a5a7a,hemiGround:0x1a0c0c,exposure:1.15,env:.05,label:'Endless'}}
};
export const clues={
 'keep-halls':[
  {id:'keep-own-bell',pos:[-12,1,8],title:'The echo of your bells',text:'Somewhere above, the five bells you rang are still sounding — and each note slides a different shoji door open. The Keep is answering to you now, not only to him.'},
  {id:'keep-scarf',pos:[12.4,1,-6],title:'A scarf caught on a door',text:'Your sibling’s scarf, snagged on a sliding door that opens onto empty air. They fell further down. The threads point toward a corridor where the lanterns hang upward.'},
  {id:'keep-map',pos:[0,1,-32],title:'A builder’s plan',text:'A drafting table, perfectly level in a tilted room. The plan shows the Keep as a single spiral, folded inward forever. At its centre: a circle labelled “Meridian — where the first fold was made.”'}
 ],
 'keep-corridors':[
  {id:'keep-upside-lantern',pos:[1.6,1,22],title:'A lantern hung upward',text:'Its flame burns toward the floor. When you turn it right-side up, the corridor shudders and one sideways staircase settles into true.'},
  {id:'keep-valley-room',pos:[-6,1,-8],title:'A room from the valley',text:'Through one door: the dojo of Cloudveil Sanctuary, folded here in miniature. The Nightwright had already begun to take your home.'},
  {id:'keep-keepers',pos:[0,1,-46],title:'The Keepers’ oath',text:'Carved in a beam: “We folded the Court to shelter the valley. One of us folded the world to own it.” The Nightwright was once a Keeper of the Fold.'}
 ],
 'keep-atrium':[
  {id:'keep-city-lamp',pos:[-14,1,-6],title:'A lamp from the capital',text:'A gas lamp from Lamplight Avenue, still burning, bolted to a lacquered balcony. Every stolen place here still remembers being somewhere.'},
  {id:'keep-stage',pos:[0,1,-4],title:'The floating stage',text:'The stage is set for a performance with no audience: five empty cushions, one for each Herald. Every cushion is cold.'},
  {id:'keep-stair',pos:[3.2,1,-29.5],title:'The stair that goes down',text:'One stair in the whole atrium leads downward. Your sibling’s footprints, in ash, go down it two steps at a time.'}
 ],
 'keep-meridian':[
  {id:'keep-sibling',pos:[-13.4,1,-5.6],title:'Your sibling',text:'They are here — exhausted, sword drawn, standing between you and the dark. “You came the long way,” they say. “Good. Now we end it together.”'},
  {id:'keep-first-fold',pos:[8.2,1,-8.4],title:'The first fold',text:'A single crease in the floor, glowing. Every stolen place hangs from it like cloth from a nail. Cut it, and the Keep unfolds — every world returns to where it belongs.'},
  {id:'keep-way-home',pos:[0,1,-28],title:'The way home',text:'Beyond the Meridian, a familiar path: stone steps, cedar, mountain air. The sanctuary bell is ringing. The battle with the Nightwright will be fought here — and then, home.'}
 ]
};
