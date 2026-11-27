export function validFinancialRole(kind:string,role:string){
 if(['salary','ordinary','loan','asset-sale','bonus','refund'].includes(role))return kind==='income';
 if(['fixed-expense','variable-expense','extraordinary','investment','savings'].includes(role))return kind==='expense';
 return role==='unknown';
}
