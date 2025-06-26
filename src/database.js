const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/moontech', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log("MongoDB conectado"))
    .catch(err => console.error("Error al conectar a Mongo:", err));
