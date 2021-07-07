import express from 'express';
import * as child from 'child_process';

const app = express();

app.get('/', (req, res) => {
    res.send('Well done!');
})

app.listen(3000, () => {
    console.log('The application is listening on port 3000');
})

child.exec("ls -la", (error, stdout, stderr) => {
    console.log("\nQuick ls output:");
    console.log(stdout);
})