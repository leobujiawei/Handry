export type ElementTreeNode={sourceSelector:string;tagName:string;id:string;className:string;context?:string;children:ElementTreeNode[]}

export function elementTreeContains(node:ElementTreeNode,selector:string):boolean{
 return node.sourceSelector===selector||node.children.some(child=>elementTreeContains(child,selector))
}

export function elementTreeRevealDelta(itemTop:number,itemBottom:number,panelTop:number,panelBottom:number){
 if(itemTop<panelTop)return itemTop-panelTop
 if(itemBottom>panelBottom)return itemBottom-panelBottom
 return 0
}
