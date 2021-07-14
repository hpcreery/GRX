const fs = require('fs')
let steps = fs.readFileSync('./camsteps.json', 'utf-8')
let formSteps = JSON.parse(steps)
let newformSteps = []

for (const property in formSteps) {
  newformSteps.push({ id: property, ...formSteps[property] })
}

console.log(newformSteps)

fs.writeFileSync('./camstepsv2.json', JSON.stringify(newformSteps))
