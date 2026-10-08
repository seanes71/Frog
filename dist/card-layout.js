// Poker-style 5:7 cards stay proportional inside the available board space.
export function cardLayout(width,height,cols,rows,gap=5,padding=12){
 const availableWidth=Math.max(1,width-padding-gap*(cols-1));
 const availableHeight=Math.max(1,height-padding-gap*(rows-1));
 const cardWidth=Math.max(1,Math.floor(Math.min(100,availableWidth/cols,availableHeight/rows*5/7)));
 return {width:cardWidth,height:cardWidth*7/5,icon:Math.max(12,Math.min(42,Math.round(cardWidth*.48))),wordIcon:Math.max(12,Math.min(32,Math.round(cardWidth*.4))),wordText:Math.max(8,Math.min(12,Math.round(cardWidth*.14)))};
}
