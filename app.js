const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const db = require('./mysql')

app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json());
app.use(express.static(__dirname + '/views'))

app.get('/', (req, res) => {
    let id = req.body.id
    if (id == null) {
        res.render('login', {})
    } else {
        res.render('index', {})
    }
})
app.get('/home', (req, res) => {
    res.render('home')
})
app.get('/aposta', (req, res) => {
    res.render('aposta', {})
})
app.get('/saque', (req, res) => {
    res.render('saque', {})
})
app.post('/auth', (req, res) => {
    let { email, password } = req.body;

    // Chamar a função de login de forma assíncrona
    db.loginUsuario(email, password, (err, result) => {
        if (err) {
            // Retornar erro caso algo dê errado
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }

        if (result) {
            // Login bem-sucedido, retornar ID do usuário
            res.json({ id: result.id, nome: result.nome, msg:'Login bem sucedido !' });
        } else {
            // Login falhou, email ou senha incorretos
            res.json({id:null, msg: 'Email ou senha incorretos' });
        }
    });
});


app.post('/saque', async (req, res) => {
    try {
        let { id, valor, cpf } = req.body;
        console.log(id, valor)
        // Verificar saldo do usuário
        let balance = await db.obterSaldo(id);

        // Verificar se o valor de saque é maior que o saldo disponível
        if (parseFloat(valor) < parseFloat(balance)) {
            await db.realizarSaque(id, parseFloat(valor));
            res.json({ msg: 'Saque realizado com sucesso!' });
        } else {
            res.json({ msg: 'Falha ao realizar saque, verifique as informações!' });
            // Realizar saque
        }
    } catch (error) {
        console.error('Erro ao realizar saque:', error.message);
        res.status(500).json({ status: 'Erro ao processar o saque' });
    }
});

app.post('/aposta', async (req, res) => {
    try {
        // Desestruturar os dados da requisição
        const { odd, idJogo, id, valor } = req.body;

        // Obter saldo do usuário
        const balance = await db.obterSaldo(id);
        console.log(balance, valor)
        // Verificar se o saldo é suficiente para realizar a aposta
        if (parseFloat(valor) > parseFloat(balance)) {
            res.json({ message: 'Saldo insuficiente!' });
        } else {
            // Criar a aposta
            const apostaId = await db.criarAposta(id, idJogo, parseFloat(valor), odd);

            // Retornar sucesso com o ID da aposta criada
            res.json({ message: 'Aposta criada com sucesso!', apostaId });
        }

    } catch (error) {
        console.error('Erro ao criar aposta:', error);
        res.status(500).json({ error: 'Erro ao criar aposta' });
    }
});


app.post('/saldo', async (req, res) => {
    console.log('cheguei');

    let id = req.body.id;

    try {
        // Usar await para esperar a obtenção do saldo
        let valor = await db.obterSaldo(id);

        // Se o usuário não for encontrado, retornar uma mensagem de erro
        if (valor !== null) {
            res.json({ saldo: valor });
        } else {
            res.status(404).json({ error: 'Usuário não encontrado' });
        }
    } catch (error) {
        // Lidar com erros na execução da query
        console.error('Erro ao obter saldo:', error);
        res.status(500).json({ error: 'Erro ao obter saldo' });
    }
});


app.listen(8080)