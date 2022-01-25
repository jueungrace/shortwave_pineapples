const fs = require('fs')
const readline = require('readline')

/**
 * Function that parses through the input file and return an array of objects 
 * containing details about a single moon base
 * @param {string} file 
 * @returns {object[]}
 */
function parseInput(file) {

  let bases = []
  let radiators = 0
  let adjacencyList = {}
  let pineapples = {}

  const fileContents = fs.readFileSync(file, 'utf-8')

  let currBase
  let currChamber

  fileContents.split(/\r?\n/).forEach(line => {

    if (line === 'Pineapple Moon Base') {
      if (typeof currBase === 'object') {
        bases.push({
          radiators,
          pineapples,
          adjacencyList
        })
      }

      // Reset currBase, adjacencyList, and pineapples
      currBase = {}
      adjacencyList = {}
      pineapples = {}
    }

    if (line.startsWith('Radiators')) radiators = Number(line.slice(10))
    if (line.startsWith('Chamber')) {
      currChamber = line.slice(8).trim()
      adjacencyList[currChamber] = []
      pineapples[currChamber] = 0
    }

    if (line.endsWith('Pineapples') || line.endsWith('Pineapple')) pineapples[currChamber] = Number(line.match(/\d/g).join(''))
    
    // If necessary, go back and change from an array of chambers to an object + cardinal directions
    if (line.startsWith('North') || line.startsWith('South') || line.startsWith('East') || line.startsWith('West')) {
      let chamber = line.match(/\d/g).join('')
      adjacencyList[currChamber].push(chamber)
    }

  })

  bases.push({
    radiators,
    pineapples,
    adjacencyList
  })

  return bases
}

/**
 * Function that calculates a heatmap given a single chamber
 * @param {string} chamber
 * @param {[key:string]:string[]} list 
 * @param {number} level 
 * @param {[key:string]:number} heat 
 * @returns {[key:string]:number}
 */
function calculateHeat(chamber, list, level, heat={}) {

  if (level > 2) return

  if (!heat[chamber]) heat[chamber] = 0
  if (level === 0) heat[chamber] += 5
  if (level === 1) heat[chamber] += 3
  if (level === 2) heat[chamber] += 1

  if (heat[chamber] >= 11) {
    return false
  }

  for (let neighbor of list[chamber]) {
    // Iterate over the chambers the current chamber is connected to
    calculateHeat(neighbor, list, level + 1, heat)

  }

  return heat

}

/**
 * Function that calculates the total number of pineapples grown
 * @param {[key:string]:number} heatmap 
 * @param {[key:string]:number} pineapples 
 * @returns {number}
 */
function calculateGrowth(heatmap, pineapples) {

  let growth = 0

  for (let chamber in heatmap) {
    if (heatmap[chamber] >= 11) return false
    if (heatmap[chamber] > 3 && heatmap[chamber] < 7) growth += pineapples[chamber]
  }

  return growth

}

/**
 * Generates all potential combinations of radiator placement based on # of radiators available
 * @param {string[]} arr 
 * @param {number} k 
 * @returns {[][]}
 */
 function combinations(arr, k, adjacencyList, pineapples) {

  let result = []
  let temp = []

  let max = 0
  let chambers = []
  let mapCache = {}

  function helper(arr, k, start, result, temp) {
      if (temp.length === k) {
          
          let sub = [...temp]
          
          let heatmap 
          let tempChambers = ''

          for (let chamber of sub) {

            tempChambers += chamber

            if (mapCache[tempChambers]) {
              heatmap = mapCache[tempChambers]
              continue
            }

            if (!mapCache[tempChambers]) {
              let tempHeatmap = calculateHeat(chamber, adjacencyList, 0, heatmap)
              if (tempHeatmap === false) return
              mapCache[tempChambers] = Object.assign(tempHeatmap)
            }

          }

          let growth = calculateGrowth(heatmap, pineapples)

          if (growth && growth > max) {
            max = growth
            chambers = sub
            heat = heatmap
          }

          return
      }

      for (let i = start; i < arr.length; i++) {
          temp.push(arr[i])
          helper(arr, k, i + 1, result, temp)
          temp.pop()
      }
  }

  helper(arr, k, 0, result, temp)
  return {
    chambers,
    max
  }
} 


/**
 * Calculates the best possible radiator placement for a single moon base
 * @param {number} radiators 
 * @param {[key:string]:number} pineapples 
 * @param {[key:string]:string[]} adjacencyList 
 * @returns {string}
 */
function determineBestRadiatorPlacement(radiators, pineapples, adjacencyList) {

  const { chambers, max } = combinations(Object.keys(adjacencyList), radiators, adjacencyList, pineapples)
  return chambers.join(", ")

}

/**
 * Generates a new file containing the best possible radiator placements for moon bases
 * @param {string} file 
 * @return {void}
 */
function pineappleMoonBase(file) {

  const bases = parseInput(file);

  for (let base of bases) {

    const { radiators, pineapples, adjacencyList } = base
    const result = determineBestRadiatorPlacement(radiators, pineapples, adjacencyList)

    fs.appendFileSync('result.txt', `${result}\n`)

  }

  console.log('Done! Please check result.txt for the output.')
  
}

// Replace 'SmallMap.txt' with your input file of choice.
pineappleMoonBase('SmallMap.txt');