const mongoose = require('mongoose');
const { Schema } = mongoose;

const LogSchema = new Schema({
    date: { type: Date, default: Date.now },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },  // Puedes poner userId si quieres referencia ObjectId a User
    login: { type: Boolean, required: true } // true = conexión, false = desconexión
});

module.exports = mongoose.model('Log', LogSchema);
