const fs = require('fs');
const n3 = require('n3');

const parser = new n3.Parser();

fs.readFile('./data/drainageareas.ttl', 'utf8', (err, data) => {
    console.log(err);
    console.log(data);
});

// console.log(parser);


