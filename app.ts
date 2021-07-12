import express from 'express'
import * as child from 'child_process'
import { readFileSync } from 'fs'
import * as WebSocket from 'ws'
import * as http from 'http'

const app = express();

app.use(express.json());
app.use(express.static('public'));
app.use(express.static('build/clientjs'));

app.post('/command', (req: express.Request, res: express.Response) => {
    let command = req.body.command
    console.log(`Got /command request: "${command}"`)
    var result: string;
    try {
        let options: child.ExecSyncOptionsWithBufferEncoding = {
            stdio: 'pipe'  // This suppresses server console prints, per https://stackoverflow.com/questions/25340875/nodejs-child-process-exec-disable-printing-of-stdout-on-console/45578119
        }
        // TODO: this is blocking, won't be any good for non-instant commands!
        result = child.execSync(command, options).toString()
    } catch (error) {
        result = error.stderr.toString()
    }
    let responseObject = {command: command, output: result}
    res.send(JSON.stringify(responseObject));
    console.log(`Result is: "${result}"\n`);
})

app.get('/state', (req: express.Request, res: express.Response) => {
    let fakeState = readFileSync('fake-state.json')
    res.send(fakeState)
})

const server = http.createServer(app)
const wss = new WebSocket.Server({ server })

wss.on('connection', (ws: WebSocket) => {
    ws.on('message', (message: string) => {
        console.log(`received: ${message}`)
        ws.send(`Hello, you sent -> ${message}`)
    })

    ws.send('Hello from WebSocket server')
})

server.listen(3000, () => {
    console.log('The application is listening on port 3000');
})
