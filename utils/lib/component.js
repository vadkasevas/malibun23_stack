export function component(claz){
    this[claz.name] = claz;
    return claz;
}