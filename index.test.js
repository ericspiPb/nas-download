const Nas = require("./models/Nas.js")
const fs = require("fs")

const myNas = new Nas("https://192.168.1.241:5001")

myNas.info()
     .then((apiList) => {
        fs.writeFileSync("support_api.json", JSON.stringify(apiList))
     })