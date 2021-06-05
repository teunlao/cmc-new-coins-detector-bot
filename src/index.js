const httpServer = require('http').createServer()
const SocketIoServer = require('socket.io').Server

const fs = require('fs')
const got = require('got')
const jsdom = require("jsdom")
const { JSDOM } = jsdom

const io = new SocketIoServer(httpServer, {})

io.on('connection', (client) => {
  console.log('socket connection')
})

httpServer.listen(3000, () => {
  console.log('http server started')
})

const CMC_URL = 'https://coinmarketcap.com'
const state = {
  previous: [],
  current: []
}

const createDomDocument = (body) => {
  const dom = new JSDOM(body)
  return dom.window.document
}

const parseTokenUrlsFromPage = async () => {
  try {
    const { body } = await got(`${CMC_URL}/new`)
    const document = createDomDocument(body)
    const newCoinElements = [...document.querySelectorAll('.cmc-table tbody tr')]
    return newCoinElements
      .filter(tr => tr.querySelectorAll('td')[8].textContent === 'Binance Coin')
      .map(tr => tr.querySelector('a').href)
  } catch (err) {
    console.warn('[ERROR]: parseTokenUrlsFromPage', err)
    return state.previous
  }
}

const getStateFromDb = () => {
  const rawData = fs.readFileSync('db.json');
  state.current = JSON.parse(rawData)
}

const saveStateToDb = (data) => {
  fs.writeFileSync('db.json', JSON.stringify(data))
}

const updateState = async () => {
  state.previous = [...state.current]
  state.current = await parseTokenUrlsFromPage()
}

const getStateChanges = () => {
  return state.current.filter(href => !state.previous.includes(href))
}

const getTokenInfo = async (tokenUrl) => {
  const url = `${CMC_URL}${tokenUrl}`
  const { body } = await got(url)
  const document = createDomDocument(body)
  const bscScanUrl = document.querySelector('.container > :nth-child(2) >:nth-child(5) >:nth-child(3) a').href
  const contract = bscScanUrl.split('/token/')[1]

  return {
    contract,
    bscScanUrl,
    cmcUrl: url
  }
}

const detectChanges = () => {
  console.log('waiting for new listings...', new Date())
  getStateFromDb()
  setInterval(async () => {
    await updateState()
    const newTokenUrls = getStateChanges()
    if (newTokenUrls.length) {
      saveStateToDb(state.current)
    }
    for (const tokenUrl of newTokenUrls) {
      const info = await getTokenInfo(tokenUrl)
      console.log('!!! NEW TOKEN !!!', info)
      io.sockets.emit('newToken', info)
    }
  }, 1000)

  setInterval(() => {
    console.log('waiting for new listings...', new Date())
  }, 60000)
}

detectChanges()
