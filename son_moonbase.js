const fs = require('fs')

class Base {
    constructor(radiators) {
        this.radiators = radiators;
        this.chambers = {};
    }

    getChamber(chamber) {
        return this.chambers[chamber]
    }

    addChamber(chamber,pineapples, north, east, south, west){
        this.chambers[chamber] = new Chamber(pineapples, north, east, south, west)
    }

    addHeat(chamber, energy=5, parentChamber=null){
        const currentChamber = this.getChamber(chamber)

        if(energy === 5 && currentChamber.canHeat === false) return "current heat greater than 1";
        else if(energy === 5 ) currentChamber.hasRadiator = true;

        currentChamber.heat += energy
        if(currentChamber.heat> 0) currentChamber.canHeat = false;

        if (energy > 1){
            for (const direction in currentChamber.adjacent){
                if(currentChamber.adjacent[direction] && currentChamber.adjacent[direction] !== parentChamber) {
                    this.addHeat(currentChamber.adjacent[direction], energy - 2, chamber)
                }
            }
        }
    }

    getHeatedChambers(){
        const heatedChambers = [];
        for (const chamber in this.chambers){
            if(this.chambers[chamber].hasRadiator) heatedChambers.push(chamber)
        }
        return heatedChambers;
    }

    addHeatLeftOver(chamber, energy=5, parentChamber=null){
        const currentChamber = this.getChamber(chamber)


        if(energy === 5 ){
            if(currentChamber.heat> 1 || Number(chamber) === 0) return;
            currentChamber.hasRadiator = true;
        }

        currentChamber.heat += energy

        if (energy > 1){
            for (const direction in currentChamber.adjacent){
                if(currentChamber.adjacent[direction] && currentChamber.adjacent[direction] !== parentChamber) {
                    this.addHeat(currentChamber.adjacent[direction], energy - 2, chamber)
                }
            }
        }
    }
}

class Chamber {
    constructor(pineapples, north, east, south, west) {
        this.pineapples =pineapples;
        this.adjacent = {
            north,
            south,
            east,
            west,
        }
        this.heat = 0;
        this.canHeat = true;
        this.hasRadiator = false;
    }

}


function makeBase(file) {
    const fileContentsArr = fs.readFileSync(file, 'utf-8').split('\n')
    let radiators = Number(fileContentsArr[1].slice(10));
    let moonBase = new Base(radiators);

    let chamber = 0;
    let pineapples = 0;
    let north = null;
    let south = null;
    let west = null;
    let east = null;

    const allBases = [];

    fileContentsArr.forEach(line => {
        if (line.startsWith("Pineapple Moon Base")){
            moonBase.addChamber(chamber,pineapples, north, east, south, west)
            allBases.push(moonBase)
            moonBase = new Base(0)
            chamber = 0;
            pineapples = 0;
            north = null;
            south = null;
            west = null;
            east = null;
        }else if(line.startsWith("Radiators")){
            radiators = Number(line.slice(10));
            moonBase.radiators = radiators;
        }
        else if(line.startsWith("Chamber")){
            moonBase.addChamber(chamber,pineapples, north, east, south, west)
            chamber = Number(line.slice(8));
            pineapples = 0;
            north = null;
            south = null;
            west = null;
            east = null;
        }else if(line.endsWith("Pineapples") || line.endsWith("Pineapple")){
            pineapples = Number(line.split(" ")[0]);
        }else if(line.startsWith("North")){
            north = Number(line.split(" ")[1]);
        }else if(line.startsWith("South")){
            south = Number(line.split(" ")[1]);
        }else if(line.startsWith("East")){
            east = Number(line.split(" ")[1]);
        }else if(line.startsWith("West")){
            west = Number(line.split(" ")[1]);
        }
    })
    moonBase.addChamber(chamber,pineapples, north, east, south, west)
    allBases.push(moonBase)
    allBases.shift()
    return allBases;
}


const makeChain = (moonBase, chamber,storedVals= {chain:[], chainPineapples:0}, level=1, prevChamber = null) => {
    let copyVals = {chain:[...storedVals.chain], chainPineapples:storedVals.chainPineapples}
    let currentChamber = moonBase.getChamber(Number(chamber))
    copyVals.chain.push(Number(chamber))
    copyVals.chainPineapples += currentChamber.pineapples

    let chainsList = [];

    if (level < 4){
        for (const direction in currentChamber.adjacent){
            if(currentChamber.adjacent[direction] !== prevChamber && currentChamber.adjacent[direction]){
                chainsList = chainsList.concat(makeChain(moonBase,currentChamber.adjacent[direction], copyVals, level+1,chamber))
            }
        }
    }else if( level === 4){
        return [copyVals]
    }

    return chainsList
};


const bestChains = (moonBase) => {
    const radiators = moonBase.radiators;
    const chambers = moonBase.chambers;
    let topChains = [];
    let ends = []

    for (const chamber in chambers){
        let currentChain = makeChain(moonBase, Number(chamber));
        currentChain.forEach(chain =>{
            const startFound = ends.find(element => element === chain.chain[0])
            const endFound = ends.find(element => element === chain.chain[3])
            if( (!startFound && !endFound)){
                topChains.push(chain);
                topChains.sort((a,b) =>  b.chainPineapples - a.chainPineapples)
                // ends.push(chain.chain[0])
                // ends.push(chain.chain[3])
            }else if(topChains.length === radiators && topChains[radiators-1].chainPineapples < chain.chainPineapples && (!startFound && !endFound) ){
                const startIndex = ends.indexOf(topChains[radiators-1].chain[0])
                const endIndex = ends.indexOf(topChains[radiators-1].chain[3])
                ends[startIndex]= chain.chain[0]
                ends[endIndex] = chain.chain[3]
                topChains[radiators-1] = chain;
                topChains.sort((a,b) =>  b.chainPineapples - a.chainPineapples)
            }
        })

    }
    return topChains;
}

const heatChambers = (moonBase) => {
    const topChainsArr = bestChains(moonBase);
    let radiators = moonBase.radiators;
    let count = 0;

    while (radiators > 0 && count < topChainsArr.length) {
        let didAddHeatStart = moonBase.addHeat(topChainsArr[count].chain[0])
        let didAddHeatEnd = 1


        if(!didAddHeatStart) radiators -= 1
        else if(didAddHeatStart === "current heat greater than 1") {
            didAddHeatStart = moonBase.addHeat(topChainsArr[count].chain[1])
            if(!didAddHeatStart) radiators -= 1
        }


        if( radiators > 0) didAddHeatEnd = moonBase.addHeat(topChainsArr[count].chain[3])
        if(!didAddHeatEnd) radiators -= 1
        else if(didAddHeatEnd === "current heat greater than 1") {
            didAddHeatEnd = moonBase.addHeat(topChainsArr[count].chain[2])
            if(!didAddHeatEnd) radiators -= 1

        }
        count ++;
    }


    if (radiators > 0){
        let i =0;
        const lowHeatList = [];

        for (const chamber in moonBase.chambers){
            const currentChamber = moonBase.getChamber(chamber)
            if(currentChamber.heat < 2){
                lowHeatList.push([chamber,currentChamber])
            }
        }
        lowHeatList.sort((a,b)=> b[1].pineapples-a[1].pineapples)
        while(radiators > 0 && i < lowHeatList.length){
            moonBase.addHeatLeftOver(lowHeatList[i][0])
            radiators --;
            i++;
        }
    }
}

const makeResult = (moonBases) => {
    const resultsArr = []
    let i =0
    moonBases.forEach(base => {
        i++
        heatChambers(base);
    });
    moonBases.forEach(base =>{
        const moonBaseHeatedChambers = base.getHeatedChambers().join();
        resultsArr.push(moonBaseHeatedChambers);
    })

    const finalOutput = resultsArr
    fs.writeFileSync('result.txt',"", 'utf-8')

    const CreateFiles = fs.createWriteStream('result.txt', {
        flags: 'a' //flags: 'a' preserved old data
    })

    finalOutput.forEach(line => CreateFiles.write(line + "\n"))

}

const totalPineapples = (moonBases) => {
    let pineapples = 0
    moonBases.forEach(base => {
        for (const chamber in base.chambers){
            pineapples += base.chambers[chamber].pineapples
        }
    })
    console.log(pineapples)
}

const myBases = makeBase("SampleMaps.txt");
totalPineapples(myBases)
makeResult(myBases);

