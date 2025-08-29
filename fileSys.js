var fs = require('fs')
fs.readFile('sam.js', function (err, data) {
    if (err) {
        return console.log(err)
    }
    console.log('Async Data:', data.toString());
});
var data = fs.readFileSync('sam.js');
console.log("Sync Data:", data.toString())
console.log("Program End")