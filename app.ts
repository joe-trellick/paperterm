import express from 'express'
import * as child from 'child_process'
import { readFileSync } from 'fs'
import * as WebSocket from 'ws'
import * as http from 'http'
import {v4 as uuidv4} from 'uuid'
import { SIGINT } from 'constants'

const app = express()

app.use(express.json())
app.use(express.static('public'))
app.use(express.static('build/clientjs'))

app.get('/state', (req: express.Request, res: express.Response) => {
    let fakeState = readFileSync('fake-state.json')
    res.send(fakeState)
})

const server = http.createServer(app)
const wss = new WebSocket.Server({ server })
const processMap = new Map()  // maps command historyIds to child processes

wss.on('connection', (ws: WebSocket) => {
    console.log('websocket connected')

    ws.on('message', (message: string) => {
        console.log(`received: ${message}`)
        let request = JSON.parse(message)
        if (request.command) {
            console.log('got command', request.command)
            let command = request.command
            let historyId = uuidv4()
            var result: string
            try {
                let options: child.ExecSyncOptionsWithBufferEncoding = {
                    stdio: 'pipe'  // This suppresses server console prints, per https://stackoverflow.com/questions/25340875/nodejs-child-process-exec-disable-printing-of-stdout-on-console/45578119
                }
                ws.send(JSON.stringify({status: "start", command: command, historyId: historyId, output: ""}))

                let runningCommand = child.exec(command, options)
                processMap.set(historyId, runningCommand)
                runningCommand.stdout?.on('data', (data: any) => {
                    console.log("Got data output", data.toString())
                    ws.send(JSON.stringify({status: "continue", command: command, historyId: historyId, output: data.toString()}))
                })
                runningCommand.stderr?.on('data', (data: any) => {
                    console.log("Got error output", data.toString())
                    ws.send(JSON.stringify({status: "continue", command: command, historyId: historyId, output: data.toString()}))
                })
                runningCommand.stdout?.on('end', (code: any) => {
                    console.log(`Got command end via stdout: "${code}"`)
                    ws.send(JSON.stringify({status: "end", command: command, historyId: historyId}))
                    processMap.delete(historyId)
                })

            } catch (error) {
                result = error.stderr.toString()
                let responseObject = {command: command, historyId: historyId, output: result}
                ws.send(JSON.stringify(responseObject))
            }
        } else if (request.action == "stop") {
            console.log('got stop request', request)
            let historyId = request.historyId
            let process = processMap.get(historyId)
            if (process) {
                process.kill(SIGINT)
            }
        }
    })

    ws.on('close', () => {
        console.log('websocket closed')
    })
})

server.listen(3000, () => {
    console.log('The application is listening on port 3000')
})
