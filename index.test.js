const Nas = require("./models/Nas.js")

const myNas = new Nas("https://192.168.1.241:5001")

myNas.info()
     .then((apiLists) => {
        console.log(apiLists)
     })