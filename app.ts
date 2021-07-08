import express from 'express';
import * as child from 'child_process';

const app = express();

app.use(express.json());
app.use(express.static('public'));
app.use(express.static('build/clientjs'));

app.get('/', (req, res) => {
    res.send('Well done!');
})

app.get('/ls', (req, res) => {
    child.exec("ls", (error, stdout, stderr) => {
        res.send(stdout);
    })
})

app.post('/command', (req: express.Request, res: express.Response) => {
    let command = req.body.command
    console.log(`Got /command request: "${command}"`)
    var result: string;
    try {
        // TODO: this is blocking, won't be any good for non-instant commands!
        result = child.execSync(command).toString()
    } catch (error) {
        result = error.stderr.toString()
    }
    let responseObject = {command: command, output: result}
    res.send(JSON.stringify(responseObject));
    console.log(`Result is: "${result}" --> "${JSON.stringify(responseObject)}"`);
})

app.listen(3000, () => {
    console.log('The application is listening on port 3000');
})

child.exec("ls -la", (error, stdout, stderr) => {
    console.log("\nQuick ls output:");
    console.log(stdout);
})