const sqlite3 = require('sqlite3').verbose();

// Cria ou abre um banco de dados
let db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Conectado ao banco de dados SQLite.');
});

const loginUsuario = (email, senha, callback) => {
    const query = `SELECT * FROM usuario WHERE email = ? AND senha = ?`;

    db.get(query, [email, senha], (err, row) => {
        if (err) {
            // Chamar callback com erro
            return callback(err, null);
        }

        if (row) {
            // Se o usuário foi encontrado, retorna o ID do usuário
            return callback(null, row); // Retorna a linha completa
        } else {
            // Se o usuário não foi encontrado
            return callback(null, null); // Retorna null
        }
    });
};
const criarAposta = async (idusuario, idjogo, valor, odd) => {
    const queryAposta = `INSERT INTO apostas (idusuario, idjogo, valor, odd) VALUES (?, ?, ?, ?)`;
    const querySaldo = `UPDATE usuario SET saldo = (saldo - ${valor}) + (${valor} * ${odd}) WHERE id = ?`;

    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Começar uma transação
            db.run("BEGIN TRANSACTION", (err) => {
                if (err) return reject(err);

                // Criar a aposta
                db.run(queryAposta, [idusuario, idjogo, valor, odd], function(err) {
                    if (err) {
                        db.run("ROLLBACK"); // Reverter transação em caso de erro
                        return reject(err);
                    }

                    // Atualizar o saldo do usuário
                    db.run(querySaldo, idusuario, function(err) {
                        if (err) {
                            db.run("ROLLBACK"); // Reverter transação em caso de erro
                            return reject(err);
                        }

                        // Confirmar a transação
                        db.run("COMMIT", (err) => {
                            if (err) return reject(err);
                            console.log(`Aposta criada com sucesso! ID da aposta: ${this.lastID}`);
                            resolve(this.lastID); // Retornar o ID da aposta
                        });
                    });
                });
            });
        });
    });
};


const realizarSaque = async (idusuario, valorSaque) => {
    try {
        // Verificar saldo do usuário de forma assíncrona
        const querySelect = `SELECT saldo FROM usuario WHERE id = ?`;
        const row = await new Promise((resolve, reject) => {
            db.get(querySelect, [idusuario], (err, row) => {
                if (err) {
                    return reject(err); // Rejeitar a promise em caso de erro
                }
                resolve(row); // Resolver com a linha retornada
            });
        });
        console.log(row.saldo, valorSaque + 1)
        if (row && row.saldo >= valorSaque) {
            // Usuário tem saldo suficiente, realizar saque
            const novoSaldo = row.saldo - valorSaque;

            const queryUpdate = `UPDATE usuario SET saldo = ? WHERE id = ?`;
            await new Promise((resolve, reject) => {
                db.run(queryUpdate, [novoSaldo, idusuario], function (err) {
                    if (err) {
                        return reject(err); // Rejeitar a promise em caso de erro no update
                    }
                    resolve(); // Resolver a promise com sucesso
                });
            });

            console.log(`Saque de R$ ${valorSaque.toFixed(2)} realizado com sucesso! Novo saldo: R$ ${novoSaldo.toFixed(2)}`);
        } else {
            console.log('Saldo insuficiente para realizar o saque.');
        }
    } catch (error) {
        console.error('Erro ao realizar saque:', error.message);
    }
};


const obterSaldo = async (id) => {
    const query = `SELECT saldo FROM usuario WHERE id = ?`;

    return new Promise((resolve, reject) => {
        db.get(query, [id], (err, row) => {
            if (err) {
                return reject(err); // Rejeita a Promise em caso de erro
            }
            if (row) {
                resolve(row.saldo); // Resolve a Promise com o saldo
            } else {
                resolve(null); // Resolve com null se o usuário não for encontrado
            }
        });
    });
};


// Recupera todos os usuários
const listarUsuarios = () => {
    db.all(`SELECT * FROM usuario`, [], (err, rows) => {
        if (err) {
            throw err;
        }
        rows.forEach((row) => {
            console.log(`${row.id}: ${row.nome} - ${row.email}`);
        });
    });
};

module.exports = {
    realizarSaque,
    criarAposta,
    loginUsuario,
    obterSaldo
}