// routes/users.js
const express = require('express');
const moment = require('moment');
const router = express.Router();

const User = require('../models/User');
const LogConexion = require('../models/LogConnection');
const passport = require('passport');
const { isAuthenticated } = require('../helpers/auth');

// SIGNIN VIEW
router.get('/users/signin', (req, res) => {
    res.render('users/signin');
});

// LOGIN PROCESS
router.post('/users/signin', passport.authenticate('local', {
    failureRedirect: '/users/signin',
    failureFlash: true
}), async (req, res) => {
    await new LogConexion({ user: req.user._id, login: true }).save();
    await User.findByIdAndUpdate(req.user._id, { connect: true });
    res.redirect('/users/user');
});

// SIGNUP VIEW
router.get('/users/signup', (req, res) => {
    res.render('users/signup');
});

// SIGNUP PROCESS
router.post('/users/signup', async (req, res) => {
    const { name, email, password, confirm_password } = req.body;
    const errors = [];

    if (!name || !email || !password || !confirm_password) {
        errors.push({ text: 'Some fields are empty' });
    }
    if (password !== confirm_password) {
        errors.push({ text: 'Passwords do not match' });
    }
    if (password.length < 4) {
        errors.push({ text: 'Password must be at least 4 characters' });
    }

    if (errors.length > 0) {
        res.render('users/signup', { errors, name, email });
    } else {
        const emailUser = await User.findOne({ email });
        if (emailUser) {
            req.flash('error_msg', 'The email is already in use');
            return res.redirect('/users/signup');
        }

        const newUser = new User({ name, email, password });
        newUser.password = await newUser.encryptPassword(password);
        await newUser.save();

        req.flash('success_msg', 'User registered successfully');

        // Si el usuario está logueado, redirige a la lista de usuarios
        if (req.user) {
            return res.redirect('/users/user');
        } else {
            // Si no está logueado, es un registro normal
            return res.redirect('/users/signin');
        }
    }
});


// LOGOUT
router.get('/users/logout', isAuthenticated, async (req, res, next) => {
    await new LogConexion({ user: req.user._id, login: false }).save();
    // Actualizar el campo connect del usuario a false
    await User.findByIdAndUpdate(req.user._id, { connect: false });
    req.logout(function (err) {
        if (err) return next(err);
        res.redirect('/');
    });
});

// CRUD DE USUARIOS

// GET: Ver todos los usuarios
router.get('/users/user', isAuthenticated, async (req, res) => {
    const users = await User.find().sort({ createdAt: -1 });
    res.render('users/user', { users });
});


// GET: Ver usuario específico
router.get('/users/edit/:id', isAuthenticated, async (req, res) => {
    const usuario = await User.findById(req.params.id);
    const logs = await LogConexion.find({ user: usuario._id }).sort({ createdAt: -1 }); // ordenados por fecha

    const logsFormatted = logs.map(log => ({
        date: moment(log.date).format('DD/MM/YYYY HH:mm:ss'),
        login: log.login
    }));

    res.render('users/edit-user', { usuario, logs: logsFormatted });
});

// PUT: Actualizar usuario
router.put('/users/edit/:id', isAuthenticated, async (req, res) => {
    const { name, email, password } = req.body;
    const updatedUser = { name, email };

    if (password && password.length >= 4) {
        const tempUser = new User();
        updatedUser.password = await tempUser.encryptPassword(password);
    }

    await User.findByIdAndUpdate(req.params.id, updatedUser);
    req.flash('success_msg', 'User updated successfully');
    res.redirect('/users/signin');
});


// DELETE: Eliminar usuario
// DELETE: Eliminar usuario
router.delete('/users/delete/:id', isAuthenticated, async (req, res, next) => {
    const userIdToDelete = req.params.id;
    const currentUserId = req.user._id.toString();

    // Eliminar los logs de conexión del usuario
    await LogConexion.deleteMany({ user: userIdToDelete });

    // Eliminar el usuario
    await User.findByIdAndDelete(userIdToDelete);

    // Contar cuántos usuarios quedan
    const remainingUsers = await User.countDocuments();

    if (remainingUsers === 0) {
        // Si no queda nadie, redirige al inicio
        return res.redirect('/');
    }

    if (userIdToDelete === currentUserId) {
        // Si eliminaste tu propio usuario, cierra sesión y redirige a login
        req.logout(function (err) {
            if (err) return next(err);
            res.redirect('/users/signin');
        });
    } else {
        // Si eliminaste otro usuario, redirige al listado
        res.redirect('/users/user');
    }
});


module.exports = router;
