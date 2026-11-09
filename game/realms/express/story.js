// World IV — a midnight steam line. Real vocabulary: Taisho brick-and-timber station,
// wooden third-class carriages, dining and sleeper cars, a susuki-grass plain at dawn.
export const world={id:'express',number:'IV',name:'The Midnight Express',herald:'The Stationmaster',
 summary:'Every clock on the line has stopped at 11:59. The passengers sleep through a minute that never ends, and the train keeps running.',
 accent:'#e0b878',card:'#1e2228'};
export const regions={
 'express-station':{name:'Hollowmoor Station',tag:'One minute to midnight',module:'./realms/express/station.js',
  description:'A brick-and-timber station in the fog. The locomotive is breathing steam and the platform clock has not moved in years.',
  spawn:[0,1.68,30],look:[0,7,0],exit:[-6,1.45,-41],returnPoint:[0,1,34],
  arena:{name:'The forecourt',center:[0,0,18],size:[24,16]},
  theme:{sky:'night',background:0x0f141c,fog:0x2a3038,density:.014,sun:0xaab8e8,power:.95,sunPos:[30,70,40],ambient:.55,hemiSky:0x707f9c,hemiGround:0x241e18,exposure:1.2,env:.05,label:'11:59'}},
 'express-carriages':{name:'The Sleeping Carriages',tag:'Don’t fall asleep',module:'./realms/express/carriages.js',
  description:'Walk the length of the moving train — wooden benches, a dining car, a sleeper — while moonlit fields stream past the windows.',
  spawn:[0,1.68,40],look:[0,1.7,0],exit:[0,1,-46.4],returnPoint:[0,1,45.6],
  arena:{name:'The baggage car',center:[0,0,-36],size:[2.6,14]},
  theme:{sky:'night',background:0x0a0e18,fog:0x1a2232,density:.0045,sun:0xb8c6ff,power:1.1,sunPos:[-60,30,15],target:[0,0,0],ambient:.6,hemiSky:0x6070a0,hemiGround:0x2a2018,exposure:1.15,env:.06,label:'Moving'}},
 'express-dawn':{name:'The Dawn Plain',tag:'The minute ends',module:'./realms/express/dawn.js',
  description:'The express has halted in a sea of silver susuki grass. First light reaches the engine, and the clocks begin to move.',
  spawn:[0,1.68,36],look:[-4,3,0],exit:[0,1,-44],returnPoint:[0,1,40],
  arena:{name:'The grass clearing',center:[8,0,0],size:[26,24]},
  theme:{sky:'none',background:0xf0b48a,fog:0xe6b294,density:.0055,sun:0xffae72,power:2.7,sunPos:[-97,16,-71],target:[0,0,0],ambient:1.25,hemiSky:0xf2c2b0,hemiGround:0x4a3c2a,exposure:1.0,env:.22,label:'Dawn'}}
};
export const clues={
 'express-station':[
  {id:'express-clock',pos:[1.6,1.45,-14.6],title:'The platform clock',text:'The hands are not stuck — they tremble against 11:59 as if held. Someone has pried open the clock face and wedged a Warden’s hairpin into the gears.'},
  {id:'express-ledger',pos:[-10,1.45,1.5],title:'The stationmaster’s ledger',text:'Every passenger for twenty years has bought a ticket for the same train. None have arrived anywhere. The last entry is your sibling’s name, marked “refused to board.”'},
  {id:'express-luggage',pos:[-4.6,1.45,-30.5],title:'Unclaimed luggage',text:'A trunk with a Floating Quarter tag, addressed to “the Mask, care of the Willow Gate.” Inside: twenty theatre masks, each one smiling.'}
 ],
 'express-carriages':[
  {id:'express-hat',pos:[0,1,33],title:'Hats on every seat',text:'Hats, gloves, half-eaten bento — but no passengers. Each seat is warm. The window beside each one shows a different moonlit field, as if every passenger is dreaming their own journey.'},
  {id:'express-menu',pos:[0,1,12.4],title:'The dining car menu',text:'The menu lists one dish: “Tomorrow.” It is crossed out in red. Below, in a careful hand: “served at midnight, which never comes.”'},
  {id:'express-whistle',pos:[0,1,-37],title:'The conductor’s whistle',text:'A brass whistle on the baggage-car floor. You blow it, and for one heartbeat every clock in the train ticks forward. Ahead, light is coming.'}
 ],
 'express-dawn':[
  {id:'express-bell',pos:[-5.6,1,-2],title:'The departure bell',text:'The engine’s bronze bell — an anchor bell, mounted on a locomotive so it could never stay still. You ring it. Across the plain, the dawn finally arrives and the passengers wake.'},
  {id:'express-ticket-stub',pos:[3,1,22],title:'A ticket stub in the grass',text:'The Stationmaster’s own ticket, never punched. Destination: “The Floating Quarter, where nights are sold by the hour.”'},
  {id:'express-tracks',pos:[0,1,-38],title:'Rails toward the Quarter',text:'Beyond the plain, a branch line curves toward a walled pleasure quarter on the river. Its lanterns are still burning in the daylight.'}
 ]
};
