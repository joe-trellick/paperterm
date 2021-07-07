import express from 'express';
import * as child from 'child_process';

const app = express();

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.send('Well done!');
})

app.get('/ls', (req, res) => {
    child.exec("ls", (error, stdout, stderr) => {
        res.send(stdout);
    })
})

app.listen(3000, () => {
    console.log('The application is listening on port 3000');
})

child.exec("ls -la", (error, stdout, stderr) => {
    console.log("\nQuick ls output:");
    console.log(stdout);
})