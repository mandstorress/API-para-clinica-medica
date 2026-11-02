require('dotenv').config()

const express = require('express')
const jwt = require('jsonwebtoken')
const { Paciente } = require('./models')

const app = express()
const PORT = process.env.PORT || 3000
const JWT_SECRET = process.env.JWT_SECRET

app.use(express.json())

app.get('/', (req, res) => {
    return res.json({ mensagem: 'Bem-vindo à API da Clínica Médica' })
})

app.post('/pacientes', async (req, res) => {
    try {
        const cadastroPaciente = await Paciente.create(req.body)
        const paciente = cadastroPaciente.toJSON()
        return res.status(201).json(paciente)
    } catch (error) {
        return res.status(400).json({ mensagem: 'Erro ao cadastrar paciente', erro: error.message })
    }
})

app.post('/login', async (req, res) => {
    try {
        const { usuario, senha } = req.body

        if (!usuario || !senha) {
            return res.status(400).json({ mensagem: 'Informe usuário e senha' })
        }

        const paciente = await Paciente.findOne({ where: { usuario } })

        if (!paciente || paciente.senha !== senha) {
            return res.status(401).json({ mensagem: 'Usuário ou senha inválidos' })
        }

        const token = jwt.sign(
            { sub: paciente.id, usuario: paciente.usuario },
            JWT_SECRET,
            { expiresIn: '2m' }
        )
        return res.status(200).json({mensagem: 'Login realizado com sucesso',token})

    } catch (error) {
        return res.status(500).json({ mensagem: 'Erro ao realizar login' })
    }
})

function verificaJWT(req, res, next) {
    const authHeader = req.headers.authorization

    if(!authHeader){
        return res.status(401).json({mensagem: 'Token de autenticação não fornecido.'})
    } 

const token = authHeader.split(' ')[1]

    jwt.verify(token, JWT_SECRET, (error, decoded) => {
        if (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ mensagem: 'Token expirado' })
            }
            return res.status(401).json({ mensagem: 'Token inválido' })
        }

        req.usuarioLogado = decoded
        return next()
    })
}

app.get('/pacientes', verificaJWT, async (req, res) => {
    try {
        const pacientes = await Paciente.findAll(req.params.id)
        return res.status(200).json(pacientes)
    } catch (error) {
        return res.status(500).json({ mensagem: 'Erro ao buscar pacientes' })
    }
})

app.get('/pacientes/:id', verificaJWT, async (req, res) => {
    try {
        const paciente = await Paciente.findByPk(req.params.id)
        if (!paciente) {
            return res.status(404).json({ mensagem: 'Paciente não encontrado' })
        }
        return res.status(200).json(paciente)
    } catch (error) {
        return res.status(500).json({ mensagem: 'Erro ao buscar paciente' })
    }
})

app.put('/pacientes/:id', verificaJWT, async (req, res) => {
    try {
        const paciente = await Paciente.findByPk(req.params.id)
        if (!paciente) {
            return res.status(404).json({ mensagem: 'Paciente não encontrado' })
        }
        await paciente.update(req.body)
        const pacienteAtualizado = paciente.toJSON()
        return res.status(200).json(pacienteAtualizado)
    } catch (error) {
        return res.status(400).json({ mensagem: 'Erro ao atualizar paciente', erro: error.message })
    }
})

app.delete('/pacientes/:id', verificaJWT, async (req, res) => {
    try {
        const paciente = await Paciente.findByPk(req.params.id)
        if (!paciente) {
            return res.status(404).json({ mensagem: 'Paciente não encontrado' })
        }
        await paciente.destroy()
        return res.status(200).json({ mensagem: 'Paciente excluído com sucesso' })
    } catch (error) {
        return res.status(400).json({ mensagem: 'Erro ao excluir paciente', erro: error.message })
    }
})

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`)
})
