
//converts any JSON object to a unique string
const json2str = (obj) => {
    let type = typeof obj;
    if(Array.isArray(obj)) type = 'array';
    switch(type){
        case 'object': 
            let keys = Object.keys(obj).sort();
            let deets = keys.map(k => `kv:${k}(` + json2str(obj[k]) + ')').join(';');
            //console.log('obj', keys);
            return `object<${deets}>`;
            break;
        case 'array':
            //console.log('array');
            let elems = '[' + [... new Set(obj.map(e => json2str(e)))].join(',') + ']';

            return `array<${elems}>`;
            break;
        default:
            return `%${type}%`;
            break;
    }
};

let reduce = (object, name, history) => {
    let type = typeof object;
    if(Array.isArray(object)) type = 'array';
    switch(type){
        case 'array':
            let rawExamples = object.map(x => reduce(x, name, history));
            let examples = rawExamples.filter(re => typeof re.shape === 'string');
            rawExamples.forEach(e => {
                if(examples.find(ex => ex.type === e.type)) return;
                examples.push(e);
            });
            return {
                type: 'Array<' + examples.map(e => e.type).join('|') + '>',
                examples,
                realType: 'array'
            };
        case 'object':
            let has = history.find(h => h.shape == json2str(object));
            if(has)
                return {type: has.name, realType: 'object'};
            else{
                let examples = Object.keys(object).sort().map(k => Object.assign(reduce(object[k], name + '.' + k, history), {name: k}));
                let newObjType = {
                    name,
                    shape: json2str(object),
                    examples,
                    type: name,
                    realType: 'object'
                };
                history.push(newObjType);
                return newObjType;
            }
            
        case 'number': 
        case 'string': 
        default:
            return {type, realType: 'object'};
    }
};

/**
 * 
 * @param {*} object 
 * @param {*} level 
 */
let reductionToString = (object, level = 0) => {
    let type = typeof object;
    if(Array.isArray(object)) type = 'array';
    switch(type){
        case 'object':
            let ret = '/**\n';
            ret += ` * @typedef {${object.name == 'rootObject' ? object.realType : object.type}} ${object.name}\n`;
            ret += object.examples.map(x => ` * @property {${x.type}} ${x.name} -`).join('\n');
            return ret + '\n */';
        default: return '';
    }
};



const convert = () => {
    let input = document.getElementById('input').value;
    let inputObject = JSON.parse(input);
    let history = [];
    let toS = reduce(inputObject, 'rootObject', history);
    //console.log(history);
    //console.log(toS);
    history = history.map(h => reductionToString(h));
    //history.forEach(h => console.log(h));
    let outputString = history.join('\n\n');
    document.getElementById('output').innerHTML = outputString;
    //console.log(json2str(a) == json2str(b));
    //let red = reduce(inputObject);
    //console.log(reductionToString(red));
    //console.log(inputObject);
};